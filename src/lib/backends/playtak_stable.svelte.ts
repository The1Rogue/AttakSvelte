

import { Capacitor } from '@capacitor/core';

import type { Backend } from "$lib/backends/connector.svelte"

import { addDirect, addMsg, addRoom } from "$lib/chat/chats.svelte"
import { player_seeks, bot_seeks, ongoing, addGame, getGame, disconnect } from "$lib/backends/connector.svelte"
import { Game } from "$lib/ingame/game.svelte"
import { addToast } from "$lib/ui/toast.svelte"


export type GameData = {
    id: number,
    p1: string,
    p2: string,
    size: number,
    time: number,
    inc: number,
    extra: number,
    trigger: number,
    color: Color,
    halfkomi: number,
    flats: number,
    caps: number,
    rated: boolean,
    tourney: boolean
}

export const GameStateStrings = ["0-0", "1/2-1/2", "F-0", "0-F", "R-0", "0-R", "1-0", "0-1"]

enum Color {
    Neither = 0,
    White = 1,
    Black = 2,
    Both = 3
}


export class PlaytakStable implements Backend {
    name: string = "Playtak"
    heartbeat: any = -1 //type doenst seem to be number, but i cant find out what else it is....
    ws: WebSocket | undefined
    username: string = ""
    password: string = ""
    messageChain = Promise.resolve()

    attempt_login(username: string, password: string): boolean {
        this.username = username
        this.password = password
        if (this.ws != undefined && this.ws.readyState != WebSocket.CLOSED) { return false }
    
        this.ws = new WebSocket("wss://playtak.com/ws", "binary");
    
        this.ws.onmessage = ({data}) => {
            this.messageChain = this.messageChain.then(() => data.text()).then((s) => this.handle_msg(s))
        } 
    
        this.ws.onclose = this.handle_close
        this.ws.onerror = this.handle_error
        this.heartbeat = setInterval(() => this.ping(), 10_000);
        return true
    }

    disconnect() {
        this.ws?.send("quit")
    }

    search(game: GameData) {
        this.ws?.send(`Seek ${game.size} ${game.time} ${game.inc} ${["A", "W", "B", "A"][game.color]} ${game.halfkomi} ${game.flats} ${game.caps} ${game.rated ? 0 : 1} ${game.tourney ? 1 : 0} ${game.trigger} ${game.extra} ${game.p2}`)
    }

    acceptGame(id: number) {
        this.ws?.send(`Accept ${id}`)
    }

    spectate(id: number) {
        this.ws?.send(`Observe ${id}`)
    }

    send_move(move: number, gameID: number) {
        this.ws?.send(`Game#${gameID} ${moveString(move)}`)
    }

    requestUndo(id: number, retract: boolean) {
        if (retract) {
            this.ws?.send(`Game#${id} RemoveUndo`)
        } else {
            this.ws?.send(`Game#${id} RequestUndo`)
        }
    }

    requestDraw(id: number, retract: boolean) {
        if (retract) {
            this.ws?.send(`Game#${id} RemoveDraw`)
        } else {
            this.ws?.send(`Game#${id} OfferDraw`)
        }
    }

    resign(id: number) {
        this.ws?.send(`Game#${id} Resign`)
    }

    shout(msg: string) {
        this.ws?.send(`Shout ${msg}`)
    }

    send_dm(user: string, msg: string) {
        this.ws?.send(`Tell ${user} ${msg}`)
    }

    send_room(room: string, msg: string) {
        this.ws?.send(`ShoutRoom ${room} ${msg}`)
    }

    leave_room(room: string) {
        this.ws?.send(`LeaveRoom ${room}`)
    }

    handle_msg(msg: string) {
        msg = msg.trim()
        // if (msg != "OK") {
        //     console.log(`<< ${msg}`)
        // }

        if (msg == "OK") {
            return

        } else if (msg == "Login or Register") {
            this.ws?.send("Protocol 2")
            this.ws?.send("Client Attak_2")
            this.ws?.send("Login " + this.username + " " + this.password)
        } else if (msg.startsWith("Welcome ")) {
            this.username = msg.slice(8, -1)
        }

        else if (msg.startsWith("Seek new")) {
            //Seek new [id] [user] [size] [time] [inc] [color] [komi] [pieces] [caps] [rated] [tourney] [name] [isBot]
            let cmd = msg.split(" ")

            if (cmd[15] != this.username && cmd[15] != "0") {
                return
            }

            let seek: GameData = {
                id: parseInt(cmd[2]),
                p1: cmd[3],
                p2: cmd[15],
                size: parseInt(cmd[4]),
                time: parseInt(cmd[5]),
                inc: parseInt(cmd[6]),
                trigger: parseInt(cmd[13]),
                extra: parseInt(cmd[14]),
                color: {"W": Color.White, "B": Color.Black, "A": Color.Both}[cmd[7]] ?? Color.Both,
                halfkomi: parseInt(cmd[8]),
                flats: parseInt(cmd[9]),
                caps: parseInt(cmd[10]),
                rated: cmd[11] == "0",
                tourney: cmd[12] == "1"
            }

            if (cmd[16] == "1") {
                bot_seeks[parseInt(cmd[2])] = seek
            } else {
                player_seeks[parseInt(cmd[2])] = seek
            }
        } else if (msg.startsWith("Seek remove")) {
            let cmd = msg.split(" ")
            
            if (cmd[16] == "1") {
                delete bot_seeks[parseInt(cmd[2])]
            } else {
                delete player_seeks[parseInt(cmd[2])]
            }
        }

        else if (msg.startsWith("Accept Rematch")) {
            let cmd = msg.split(" ")
            this.ws?.send("Accept " + cmd[2])
        }

        else if (msg.startsWith("GameList Add")) {
            let cmd = msg.split(" ")

            let seek: GameData = {
                id: parseInt(cmd[2]),
                p1: cmd[3],
                p2: cmd[4],
                size: parseInt(cmd[5]),
                time: parseInt(cmd[6]),
                inc: parseInt(cmd[7]),
                trigger: parseInt(cmd[13]),
                extra: parseInt(cmd[14]),
                color: Color.Neither,
                halfkomi: parseInt(cmd[8]),
                flats: parseInt(cmd[9]),
                caps: parseInt(cmd[10]),
                rated: cmd[11] == "0",
                tourney: cmd[12] == "1"
            }
            ongoing[parseInt(cmd[2])] = seek
            
        } else if (msg.startsWith("GameList Remove")) {
            let cmd = msg.split(" ")
            delete ongoing[parseInt(cmd[2])]
        }

        else if (msg.startsWith("Observe")) {
            let cmd = msg.split(" ")
            let gameData: GameData = {
                id: parseInt(cmd[1]),
                p1: cmd[2],
                p2: cmd[3],
                color: 0,
                size: parseInt(cmd[4]),
                time: parseInt(cmd[5]),
                inc: parseInt(cmd[6]),
                halfkomi: parseInt(cmd[7]),
                flats: parseInt(cmd[8]),
                caps: parseInt(cmd[9]),
                rated: cmd[10] == "0",
                tourney: cmd[11] == "1",
                trigger: parseInt(cmd[12]),
                extra: parseInt(cmd[13]),
            }
            addGame(new Game(gameData, undefined, this))
            let players = [cmd[2], cmd[3]]
            players.sort()
            this.ws?.send("JoinRoom " + players.join("-"))

        } else if (msg.startsWith("Game Start")) {
            let cmd = msg.split(" ")
            let gameData: GameData = {
                id: parseInt(cmd[2]),
                p1: cmd[3],
                p2: cmd[5],
                color: cmd[6] == "white" ? 1 : 2,
                size: parseInt(cmd[7]),
                time: parseInt(cmd[8]),
                inc: parseInt(cmd[9]),
                halfkomi: parseInt(cmd[10]),
                flats: parseInt(cmd[11]),
                caps: parseInt(cmd[12]),
                rated: cmd[13] == "0",
                tourney: cmd[14] == "1",
                trigger: parseInt(cmd[15]),
                extra: parseInt(cmd[16]),
            }
            addGame(new Game(gameData, undefined, this))
            let opp = cmd[6] == "white" ? cmd[5] : cmd[3]
            addDirect(opp)
        } 
        
        else if (msg.startsWith("Game#")){
            let cmd = msg.split(" ")
            let id = parseInt(cmd[0].slice(5))
            let game = getGame(id)
            if (game == undefined) {return}

            if (cmd[1] == "P" || cmd[1] == "M") {
                game.addMove(parseMove(cmd.slice(1)))
            } else if (cmd[1] == "Time") {
                game.timew = 1000 * parseInt(cmd[2])
                game.timeb = 1000 * parseInt(cmd[3])
            } else if (cmd[1] == "Timems") {
                game.timew = parseInt(cmd[2])
                game.timeb = parseInt(cmd[3])
            } else if (cmd[1] == "Over") {
                game.end(GameStateStrings.indexOf(cmd[2]))
            } else if (cmd[1] == "OfferDraw") {
                game.drawReq |= 1
            } else if (cmd[1] == "RemoveDraw") {
                game.drawReq &= 2
            } else if (cmd[1] == "RequestUndo") {
                game.undoReq |= 1
            } else if (cmd[1] == "RemoveUndo") {
                game.undoReq &= 2
            } else if (cmd[1] == "Undo") {
                game.removeLast()
            } else if (cmd[1] == "Abandoned.") {
                game.end(game.data.p1 == cmd[2] ? 7 : 6)
            }
        }

        else if (msg.startsWith("Shout ")) {
            let cmd = msg.split(" ")
            addMsg(cmd[1].slice(1,-1), "Global", msg.slice(7 + cmd[1].length))
        } else if (msg.startsWith("Joined room")) {
            let cmd = msg.split(" ")
            addRoom(cmd[2])
        } else if (msg.startsWith("ShoutRoom ")) {
            let cmd = msg.split(" ")
            addMsg(cmd[2].slice(1,-1), cmd[1], msg.slice(12 + cmd[1].length + cmd[2].length))
        } else if (msg.startsWith("Tell ")) {
            let cmd = msg.split(" ")
            addMsg(cmd[1].slice(1,-1), cmd[1].slice(1,-1), msg.slice(6 + cmd[1].length))
        } else if (msg.startsWith("Told ")) {
            let cmd = msg.split(" ")
            addMsg(this.username, cmd[1].slice(1, -1), msg.slice(6 + cmd[1].length))    
        }


        else if (msg.startsWith("Message ")) {
            addToast(msg.slice(8), false)
        } else if (msg.startsWith("Error ")) {
            addToast(msg.slice(6), true)
        } else if (msg == "NOK") {
            addToast("The server disliked something...", true)
        } else if (msg == "Authentication failure") {
            addToast("Invalid Login", true)
            this.ws?.close()
        }

        //Online
        //OnlinePlayers

        else if (msg == "Password changed") {
            addToast("Password Changed Successfully!", false)
        }


    }

    handle_close(e: any) {
        console.log("connection closed")
        clearInterval(this.heartbeat)
        this.heartbeat = -1
        disconnect()
    }

    handle_error(e: any) {
        addToast("Error in server connection!", true)
    }

    ping() {
        this.ws?.send("PING")
    }

    async get_rating(user: string) {
        // if (!Capacitor.isNativePlatform()) {return 0}

        if (user.startsWith("Guest")) {
            return 0
        }
        
        let resp = await fetch(`https://api.playtak.com/v1/ratings/${user}`)
        if (!resp.ok) {
            return -1
        }

        return resp.json().then((json) => {return json.rating})
    }

    async get_history(options: any) {
        //OPTIONS SUPPORTED:
        //limit:        number per page
        //page:         page number
        //skip:         number of entries to skip
        //order:        ASC | DESC
        //sort:         column to sort by
        //id:           game id by range "a-b" or comma'd "a,b,c"
        //player_white: player name, % can be used at start or end for partial (who tf came up with this shit)
        //player_black: ditto
        //game_result:  result string, X-0 / 0-X for any type of win
        //size:         board size
        //type:         normal | tournament | unrated
        //mirror:       also search mirror
        //date:         timstamp, range a-b or greater >a or less <a
        //komi:         halfkomi, supports 1 up to 8 (no option for 0?????)
        //timertime:    game time in seconds, only supports very specific numbers
        //timerinc:     same for increment
        //extra_time_amount: alledgedly time added in seconds, only support values youd expect for trigger
        //extra_time_trigger: alledgedly move when time is added, only support values youd expect for the amount


        // if (!Capacitor.isNativePlatform()) {
            // return [{"id":859447,"date":1784493129941,"size":6,"player_white":"Sn0oT","player_black":"Ren_Renegade","notation":"","result":"0-0","timertime":900,"timerinc":15,"rating_white":1783,"rating_black":1651,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":600,"extra_time_trigger":35},{"id":859444,"date":1784491107657,"size":6,"player_white":"PlutoTheBrave","player_black":"Riddle","notation":"P A1,P F6,P E4,P E2,P C4,P D4,P D3 C,P D2,P C3,P C2,P E3,P B4,P B3,P B2 C,P F4,M B2 B3 1,P B5,P C5,P A4,M D4 C4 1,P D4,M B3 C3 2,M D3 D4 1,M C3 C4 3,M D4 D2 1 1,P E5,P F5,M E5 E4 1,P F3,M E2 E3 1,P F2,M E4 F4 2,P E4,M E3 E4 2,P D4 W,P B3,P B2,P A2,P A3,P C6,M D2 C2 2,P C1,P E3,P B1,M B5 C5 1,P C3,P D2,M B1 B2 1,M C2 B2 3,P B5,P C2,M C1 C2 1,M B2 C2 4,M B3 A3 1,M A4 A3 1,M E4 E3 3,P E2,M E3 E2 4,P E3,M F4 F3 3,M F2 F3 1,P B3 W,M A3 A2 2","result":"R-0","timertime":900,"timerinc":15,"rating_white":2045,"rating_black":1755,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":859439,"date":1784489301638,"size":6,"player_white":"rabbitboy84","player_black":"archvenison","notation":"P A1,P F6,P E4,P C3,P E3,P E2,P C4,P B4,P D3 C,P D2,P C2,P B3,P B2,P A2 C,P B5,P A5,P A4,P A3,P F4,P C5 W,P D4,M C5 C4 1,P C5,P A6,M A4 A5 1,M C4 C5 2,M D3 C3 1,P A4,M C3 C5 1 1,M A4 A5 1,M C5 A5 1 2,P D5 W,P C3,M D5 C5 1,M B5 B3 1 1,M C4 B4 1,M A5 A3 2 3,M B4 B2 1 2,M A3 B3 4,P D3 W,P B4,P C4 W,P C1,M D3 C3 1,P D3,M A2 B2 1,M B3 C3 1,M B3 A3 4","result":"R-0","timertime":900,"timerinc":15,"rating_white":1957,"rating_black":1908,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":74,"rating_change_black":-36,"extra_time_amount":0,"extra_time_trigger":0},{"id":859438,"date":1784488595555,"size":6,"player_white":"Sn0oT","player_black":"Torinku","notation":"P A1,P F6,P D4,P C3,P C4 C,P D5,P D3,P D2,P B4,P E4,P E3,P E2 C,P A4,M E2 E3 1,P E5,P F4,P E6,P B3,P D6,M B3 B4 1,P C6,P B6 W,P C5,M B6 C6 1,P B5,M C6 D6 2,P A5,M D5 E5 1,P B1,P B2,P D5,P F5,M E6 E5 1,M D6 D5 3,P E6,M D5 E5 4,P D6,M E5 E6 5,P B3,P A2,M C4 B4 1,P C2,M B4 B2 1 2,P B4 W,P A3,M B4 B3 1,P D5,P D1,M B2 A2 3,M B3 A3 3,M A2 A3 1,M E6 A6 1 1 1 2","result":"R-0","timertime":900,"timerinc":15,"rating_white":1774,"rating_black":1727,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":86,"rating_change_black":-52,"extra_time_amount":0,"extra_time_trigger":0},{"id":859437,"date":1784487438301,"size":6,"player_white":"archvenison","player_black":"rabbitboy84","notation":"P A1,P F6,P D4,P B4,P E5,P B3,P B5 C,P D3,P C5,P D5 C,P C4,P E4,P C3,M D5 C5 1,P D5,P E3,P A4,P D2,P E6,M E4 D4 1,P E4 W,M D4 D5 2,P C2,P B2,P C1,P A2,P D6,P C6,M B5 B4 1,P D4 W,P B5,M C5 C4 2,P C5,M D5 C5 3,M B4 B3 2,P D1,P B6,M D1 C1 1,M B3 B2 3,P D1,P B1,M C1 C3 1 1","result":"0-R","timertime":900,"timerinc":15,"rating_white":1913,"rating_black":1948,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-45,"rating_change_black":93,"extra_time_amount":0,"extra_time_trigger":0},{"id":859428,"date":1784486129974,"size":6,"player_white":"Torinku","player_black":"Sn0oT","notation":"P F6,P A1,P C3,P D3 C,P B2,P D2,P D4,P E4,P E5,P F5,P F4,P D1,P D5,P E3,P C4,P F3,M F4 F5 1,M F6 F5 1,P F4 W,M F5 D5 1 2,M F4 E4 1,P F4,P F5 C,P C2,P B3,P A2,P B1,M A2 B2 1,P A2 W,P C5,M F5 E5 1,P F5,M E4 F4 2,M D5 D4 3,P C6,P D6,M E5 D5 2,M D3 D4 1,M A2 B2 1,P B4,P C1,P A4,M D5 C5 2,M D4 C4 5,M B2 D2 1 2,P D4,M B3 B4 1,P D3,M D2 D3 3,P E4,M F4 E4 3,P B3,P B5,M B3 B4 1,P B3 W,P D5,P E2,P E6,M B3 B4 1,P D2,M E4 D4 4,P B3 W,P A5,P E4,M C5 D5 3,P F6,P F4,P C5 W,P F2,P E1,M D3 D2 4,M C4 C2 5 1,M D5 D4 1,P D3,M D4 D2 5 1,M D1 C1 1,M D3 C3 6,P D3,M B4 E4 1 2 1,M D3 C3 1","result":"0-R","timertime":900,"timerinc":15,"rating_white":1734,"rating_black":1763,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-67,"rating_change_black":112,"extra_time_amount":0,"extra_time_trigger":0},{"id":859422,"date":1784485613211,"size":6,"player_white":"Carlitos","player_black":"thebestlettuce","notation":"P F1,P A6,P D3,P E3,P C3,P E4,P D4,P E5,P E2,P D2 C,P F3,M D2 D3 1,P D2 C,P C4,P C2,P B3,P F2,P B2,P B1,P A1,M B1 B2 1,P A2 W,M B2 B3 2,P A3,P B4,M C4 B4 1,M B3 B4 3,P A4 W,M B4 B6 1 4,P B3,P C4,P C5,P B4","result":"R-0","timertime":600,"timerinc":20,"rating_white":1635,"rating_black":1610,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":63,"rating_change_black":-103,"extra_time_amount":0,"extra_time_trigger":0},{"id":859401,"date":1784482874843,"size":6,"player_white":"blantonrc","player_black":"Pinheadlarry","notation":"P A6,P F1,P E3,P F2,P D3,P F3,P E2,P E1,P D4,M E1 E2 1,P C4,P F4,P F5,P E4,P E5 C,P C3 C,P D5,P A4,P D2,M C3 D3 1,P C5,P A5,P A3,P B4,P B3,P C3,P B5,M C3 B3 1,P B2,P C3,M A3 A4 1,M A5 A4 1,P A3 W,M F3 E3 1","result":"0-R","timertime":600,"timerinc":20,"rating_white":1483,"rating_black":1425,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-132,"rating_change_black":249,"extra_time_amount":0,"extra_time_trigger":0},{"id":859382,"date":1784481766072,"size":6,"player_white":"Abyss","player_black":"rabbitboy84","notation":"P A6,P F6,P E3,P A3,P D3,P B3,P A4,P B4,P E4,P B5,P C4 C,P A5,M C4 B4 1,P C4 C,P F4,P F5,P E5,P C3,P D2,P D4 W,P C2,M D4 D3 1,P E2,P C5,P E6,M D3 E3 2,M B4 B3 2,P D3 W,P F3,P F2,P F1,P E1,M E2 F2 1","result":"R-0","timertime":900,"timerinc":15,"rating_white":2097,"rating_black":1947,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":32,"rating_change_black":5,"extra_time_amount":0,"extra_time_trigger":0},{"id":859372,"date":1784480936762,"size":6,"player_white":"Carlitos","player_black":"blantonrc","notation":"P F1,P F6,P D4,P C4,P C3,P D3,P E4,P C2,P E5,P D5 C,P B3,P D2,P E3 C,P F5,P E6,P D1,P A3,M D3 C3 1,P E2,P E1,M E3 D3 1,P B4,M D3 C3 1,M C4 D4 1,P E3,M F5 E5 1,P F3,P D3 W,P C4,P B2,M C3 C2 2,P A2,P C5,P C1,P B1 W,P D6,P C6,P F5,P A1,M D5 C5 1,P D5,P B5,M D5 D4 1","result":"R-0","timertime":900,"timerinc":15,"rating_white":1632,"rating_black":1489,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":34,"rating_change_black":-57,"extra_time_amount":0,"extra_time_trigger":0},{"id":859366,"date":1784480627915,"size":6,"player_white":"blantonrc","player_black":"Carlitos","notation":"P A6,P F1,P E3,P C3,P D3,P C4,P D4,P C5,P D5 C,P D2 C,P D6,P E4 W,P C6,P B6,P B5,P B4,P A5,P C2,P C1,P D1,P B1,M C5 B5 1","result":"0-R","timertime":900,"timerinc":15,"rating_white":1496,"rating_black":1628,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-72,"rating_change_black":43,"extra_time_amount":0,"extra_time_trigger":0},{"id":859331,"date":1784476762406,"size":6,"player_white":"rabbitboy84","player_black":"Abyss","notation":"P A1,P F6,P E4,P C3,P E3,P E2,P C4,P D4 C,P D3 C,P C2,P D2,P D1,P B3,P C1,P F3,M D4 E4 1,P A3,M E4 E3 2,P B1,P B2,P D4,P E1,M D2 D1 1,P D2,M D3 C3 1,P E4,P E5,P F1,M C3 C2 2,P E6,M C2 D2 3,P D5,M F6 E6 1,P D3,P C5,P D6,M D4 D5 1,P D4 W,P C3,M D6 D5 1,P C6,M D4 C4 1,P D4,M D5 F5 1 2,M D4 E4 1,M E3 E4 3,M D2 E2 4,P D2,P C2,M D2 D1 1,M E2 E1 5,P F6,P D2 W,P F2,P E3 W,P B4,P A4,P A5,P B5,M C4 C3 2,M D2 D1 1,P D5,P C4,M E4 C4 1 4,M E6 E5 2,M F5 E5 2,P F5 W,M E5 B5 2 1 3,P B6 W,P F4,M F3 F4 1,P E2,M B6 B5 1,P F3,M B5 D5 1 3,P E4,M D5 D3 2 2,M C4 C5 5,P B6,P E5 W,M C2 B2 1,M C5 B5 6,M D5 C5 2,P C4 W,M E1 D1 1,M C4 D4 1,M D1 F1 2 1,M D4 C4 3,M B1 C1 1,M E2 E1 1,M F1 E1 2,P B1 W,P C2,M B1 B2 1,P B1,M C4 C5 2,M D3 D4 3,M C5 C6 4,M F4 F3 2,M B2 C2 2,P A2,P E2","result":"0-F","timertime":900,"timerinc":15,"rating_white":1947,"rating_black":2093,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":5,"rating_change_black":40,"extra_time_amount":0,"extra_time_trigger":0},{"id":859311,"date":1784474198636,"size":6,"player_white":"entr0p1","player_black":"x0u0x","notation":"P A1,P B1,P C3,P C1,P B2,P C4,P B3,P A3,P B4,P C2,P B5,M A3 B3 1,P B6,M A1 B1 1,P A1 W,P C5,M A1 B1 1,P C6,M B1 C1 2,M C2 B2 1,P C2 C,P A3,M C2 B2 1,M C5 B5 1,P C5,P A4 W,M B2 B3 2,M A4 B4 1,P D3,P C2 C,P E3,M C2 C3 1,P C2,M C3 C1 1 1,M B3 C3 3,M B4 B3 2,M C2 E2 1 1,M C1 D1 4,P C2,P D4,P D5,M D1 D3 1 2,M C3 C4 3,P E5,P C3,M B5 C5 2,M C4 D4 4,P C4,P E4,M C4 C3 1,P C4 W,P F3,P D6,M E5 E4 1,P E5,P F4,P E1,M F3 E3 1,P F3 W,M B3 B2 3,M F3 E3 1,M D2 E2 2,P D2,P F2 W,P F5,P B3,P A6,P E6 W,M C4 C5 1,M C6 B6 1,M C5 C3 1 2,M E6 E5 1,P E6,M B2 D2 3 1,M C3 C2 3,M D3 C3 1,M C2 A2 1 5,M C3 C2 2,M A2 A4 1 3,M C2 C4 2 1,P C2","result":"R-0","timertime":900,"timerinc":15,"rating_white":1771,"rating_black":991,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":4,"rating_change_black":-4,"extra_time_amount":0,"extra_time_trigger":0},{"id":859310,"date":1784474076304,"size":6,"player_white":"Ren_Renegade","player_black":"Tones","notation":"P A1,P F6,P D4,P C4,P F4,P C5,P F3,P C3,P F5,P E4 W,P F2,M E4 F4 1,P E3,P D5,P E4 C,M F4 F5 2,P E5,P E6,P D6,P F1,P E1,P E2 C,M F6 E6 1,M F1 F2 1,P C6,P F6 W,P D3,P D2,P C2,P C1,P B2,P D1,P B1,M F6 E6 1,P B3,M E6 C6 1 2,M D4 C4 1,P B4,P E6,M C1 B1 1,P C1,M D1 C1 1,M C2 C1 1,M B1 C1 2,P D1 W,M C1 B1 5,P A2,M B1 B3 2 3,P C2 W,P A3,M A2 B2 1,M B3 B2 4,M C2 B2 1,P B3 W,M B2 D2 3 2,M B3 B2 1,M C2 C4 1 1,M B2 C2 2,M C4 A4 2 1,M C2 C3 3,P C4,M C3 C4 4,P D4,M C4 B4 5,P C2,P C1,M E4 D4 1,M B4 A4 6,M D4 C4 2,M A4 A5 6,P E4,M D6 E6 2,P D4,M E2 D2 1,M C4 B4 1","result":"R-0","timertime":900,"timerinc":15,"rating_white":1639,"rating_black":1955,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":121,"rating_change_black":-98,"extra_time_amount":0,"extra_time_trigger":0},{"id":859306,"date":1784473466847,"size":6,"player_white":"x0u0x","player_black":"entr0p1","notation":"P A1,P F6,P F5,P F3,P E4,P E3,P D4,P D3,P C4,P C3,P D2,P B3,M D2 D3 1,P B4,P D2,P D5 C,P D1,M D5 D4 1,P C5,M D4 D3 2,M E4 E3 1,M D3 E3 3,M D2 D3 1,M E3 D3 4,M C4 C3 1,M D3 C3 5","result":"0-1","timertime":900,"timerinc":15,"rating_white":992,"rating_black":1770,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-4,"rating_change_black":4,"extra_time_amount":0,"extra_time_trigger":0},{"id":859295,"date":1784472054688,"size":6,"player_white":"Tones","player_black":"Ren_Renegade","notation":"P F6,P A6,P E5,P F5,P F4,P E4,P E3,P D4 C,P A4,P F3,P F2,P D3,P D2,P C3,P C2 C,P B3,P E2,P A3,M C2 C3 1,P B4,P A2,P B2,P C2,P C4,M C3 B3 2,M D3 D2 1,P D1,P D3,P A5,P C3,P B1,M A3 A4 1,M B3 B4 3,P B3,M B4 A4 4,P A3 W,P E1,P A1,P C1,M A1 B1 1,M C1 B1 1,P A1 W,M B1 B2 2,M B3 B2 1,M C2 B2 1,P B3 W,P C1","result":"R-0","timertime":900,"timerinc":15,"rating_white":1953,"rating_black":1641,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":18,"rating_change_black":-19,"extra_time_amount":0,"extra_time_trigger":0},{"id":859263,"date":1784466515459,"size":6,"player_white":"Menegato","player_black":"entr0p1","notation":"P F6,P A1,P C3,P C4,P D3,P D4,P B3,P B4,P A3,P B2 C,P A2,P A4,P E3,M B2 B3 1,P C5 C,P B2,P F3,P B1,P C2,P D5,P C1,P D6","result":"0-R","timertime":600,"timerinc":20,"rating_white":1599,"rating_black":1761,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-56,"rating_change_black":93,"extra_time_amount":0,"extra_time_trigger":0},{"id":859169,"date":1784421694966,"size":6,"player_white":"Riddle","player_black":"SilverPhantom","notation":"P A1,P F6,P E4,P E3,P F4,P D3,P F3,P F2,P E2 C,P D2,P F5,P C2,P F1,M F2 F3 1,P F2,P B2,M E2 E3 1,M F3 F2 2,P E2,M D2 E2 1,P E1,P D2,M E3 E2 2,P E3 W,P F3,M F2 F3 3,P F2,P B1,M E2 F2 1,M F3 F6 1 1 2,M F5 F6 1,P F3 C,M F2 E2 2,M F3 E3 1,M E2 B2 1 3 1,P C3 W,P F2,P F3 W,M F6 C6 1 1 2,M C3 C2 1,M B2 C2 1,P C3,P B3,P B4,P C4,P B6,P C5,P B5,M C2 C3 2,M B5 C5 1,P A3,M B4 B3 1,M A3 B3 1,M B2 B3 1,P B2 W,M B3 B5 2 2,P B3,P D4,P A3,M D3 D2 1,P D5,M D4 C4 1,P D4,M E3 E4 2,P D3,M D2 D4 1 2,P D1,M B4 B3 2,M B2 B3 1,P B2 W,P D2,M B2 C2 1,M C3 C2 1,P A5,M B3 B6 1 1 2,P B2,M C2 C4 4 2,M D3 C3 2,M C4 C3 3,P B3,M B5 B3 1 2,M B2 B3 1,M B4 B2 1 1,M E4 E1 1 1 1,P D3,M E2 D2 1,P E4","result":"R-0","timertime":900,"timerinc":15,"rating_white":1752,"rating_black":1634,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":38,"rating_change_black":-65,"extra_time_amount":0,"extra_time_trigger":0},{"id":859152,"date":1784418796622,"size":6,"player_white":"SilverPhantom","player_black":"Riddle","notation":"P A1,P F6,P D4,P C2,P C4,P B4,P C3,P B3 C,P D3,P B5,P C5,P B6,P A4 C,P A3,M A4 B4 1,P A4,P A5,P A6,M C5 B5 1,P C5 W,P E4,M C5 B5 1,M A5 A4 1,M A3 A4 1,P A5,M A4 A5 2,P A3,P A2,M A3 A4 1,M A5 A4 3,M B4 A4 2,P B4 W,P D2,P D1,P B2,P C1,P F4,P E1,M A4 A1 1 1 3,M B3 C3 1,M A1 D1 1 1 2,M C3 D3 2,P C3,M C1 C3 1 1,M D2 C2 1,M B4 A4 1,P B4,M B5 B4 2,P B3,M A4 A2 1 2,M C2 C1 3,P E3,P A4,P F3,M A4 A3 1,M A2 A3 3,P F5,P C2,M B3 C3 1,M A3 C3 2 4,M B2 B3 1,P A3,M D1 C1 3,P D2,P B2 W,P A1,M C1 C3 2 1,M C2 C1 2","result":"0-R","timertime":900,"timerinc":15,"rating_white":1642,"rating_black":1747,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-83,"rating_change_black":48,"extra_time_amount":0,"extra_time_trigger":0},{"id":859149,"date":1784417357169,"size":6,"player_white":"Vogopolis","player_black":"blantonrc","notation":"P A1,P F6,P E5,P C3,P E4,P D3,P E3,P D4 C,P E2,P B3,P D5,P D6,P C5,P B5,P B4,P C4,P A5,P E6,P F5,M E6 E5 1,P F4,M E5 E4 2,P E5 C,M B5 A5 1,M E5 E4 1,P E5 W,P E1","result":"R-0","timertime":900,"timerinc":15,"rating_white":1767,"rating_black":1500,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":23,"rating_change_black":-35,"extra_time_amount":0,"extra_time_trigger":0},{"id":859148,"date":1784416458672,"size":6,"player_white":"blantonrc","player_black":"Vogopolis","notation":"P F6,P A1,P B3,P D5,P C3,P D3,P C4,P D4,P A3,P D2,P C5 C,P D6,M C5 D5 1,P B4 C,P E4,P C6,P C5,P E6,P B6,P B5,P A6,P A5,P A2,M B4 C4 1,M B6 B5 1,P B6,M B5 A5 2,P A4 W,P B5,M A4 A5 1,M A6 B6 1,M A5 C5 1 2,P A6,M C4 C5 1","result":"0-R","timertime":900,"timerinc":15,"rating_white":1504,"rating_black":1765,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-41,"rating_change_black":27,"extra_time_amount":0,"extra_time_trigger":0},{"id":859146,"date":1784415468025,"size":6,"player_white":"archvenison","player_black":"Abyss","notation":"P A1,P F6,P D4,P C3,P E5,P D3,P E4,P D5,P C4 C,P E3,P F5,P F4 C,P C5,M F4 E4 1,P B4,P D6,M C4 D4 1,P E6,M D4 D5 2,M E4 E5 2,P E4,P F4,P D4,P E2,P B5,P E1,M F5 F4 1,M E3 E4 1,P E3 W,M E4 F4 2,P F3,P D2,M F3 F4 1,P E4 W,M F4 F1 2 1 2,P F4 W,M E3 F3 1,P C6,P B6,P B3,P C2,P C4,P D1,M E4 D4 1,P E4,P A3,P A6,P C1,P B2,P B1,P E3,P A5,P A4,P A2,M F3 D3 2 1,M F4 E4 1,M D3 E3 2,P D3 W,M E3 E2 4,P F3,M A4 A3 1,P A4,M D5 C5 3,M D4 C4 2,M C5 C6 4,M E6 F6 1,M D1 C1 1,M B1 C1 1,M C2 C1 1,P C2 W,P B1,M A4 A3 1,M C1 E1 2 2,P A4,P F5,P E6 W,P F4,P C1,M C6 C4 2 1,M E5 C5 1 2,M C4 C3 4,M C5 B5 3,M C3 C5 3 2,M A5 A6 1,M B6 A6 1,M A4 B4 1,P B6,M B5 B6 4,M C5 B5 3,M E4 C4 1 1,M B5 B4 3,M C4 F4 1 1 2,P C5,P E5,M B4 B3 4,M D6 C6 1,M E2 D2 2,M D3 E3 1,M B3 A3 5,M E3 E2 2,M A6 A4 1 2,M E2 E1 3,M A3 A2 6,M C2 B2 1,P A6,M B2 B1 2,M D5 D4 1,M E4 D4 1,M D2 D4 1 2,P B3","result":"0-F","timertime":900,"timerinc":15,"rating_white":1923,"rating_black":2090,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-25,"rating_change_black":25,"extra_time_amount":0,"extra_time_trigger":0},{"id":859140,"date":1784412183222,"size":6,"player_white":"Abyss","player_black":"archvenison","notation":"P A6,P F1,P E3,P C4,P E4,P E5,P C3,P D5,P D4 C,P C5,P F3,P E6,P B3,P B4 C,P D6,P F6,M D4 D5 1,P D4 W,P D3,M B4 B3 1,P F2,P F5,P F4,P E2 W,P B2,P C2,P A2,P B4,P C1,M E2 E3 1,P B1,P D1,P D2,M B3 C3 2,P E2,M D1 C1 1,M B1 C1 1,M C3 C2 3,P C3,P B3,P A3,M B3 C3 1,P B3,P B5,M D5 C5 2,M E3 D3 2,M C5 C3 1 2,P B6,P B1,P D1 W,P D5,P C6,M C3 C4 3,M E5 D5 1,M D6 C6 1,P C5,M C4 C5 5,P C4,P E5,M E6 E5 1,P E6,M D4 E4 1,P D4 W,M D1 C1 1,M D4 D5 1,M C2 C3 3,M C5 C4 6,P A4,P A5,P A1,P E3,P D6,P D4,M C1 B1 2,M D5 B5 1 2,P D5,P D1,M D6 C6 1,M C5 C6 1,M B6 C6 1,P D6 W,M C3 C1 1 2","result":"R-0","timertime":900,"timerinc":15,"rating_white":2087,"rating_black":1926,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":30,"rating_change_black":-30,"extra_time_amount":0,"extra_time_trigger":0},{"id":859116,"date":1784410251672,"size":6,"player_white":"SilverPhantom","player_black":"Torinku","notation":"P F1,P A6,P B4,P C3,P B3,P B2,P C2,P A3,P B5,P B1,P C4,P D4,P D3,P E3,P E4,P F4,P F3,P C1,P E2,P E1,P D1,P D2 C,P A5,P A1,M C2 C1 1,P C2,M D1 E1 1,P F2,M E4 E3 1,M D2 D3 1,P E4 C,P D2,P D5,M D3 E3 2,M E2 D2 1,P C5,M F3 F4 1,M D4 C4 1,M B4 C4 1,P B4 W,M C4 C6 1 2,M B4 B5 1,P B6,M B5 C5 2,P D6,M C5 C6 3,P D1,P D3,M B3 C3 1,P C4,P D4,M E3 C3 1 3,M D5 C5 1,M C6 C5 4,M B6 C6 1,M C5 C6 5,M D4 C4 1,M C3 C4 4,M D2 C2 2,P B3,M C2 B2 3,P A2,M B2 B3 4,P C2,P B2 W,P B4,P A4,P E2,P D2,M C6 D6 6,M C1 C3 1 1,M C4 C3 5,P C1 W,M D3 D1 1 1","result":"0-R","timertime":900,"timerinc":15,"rating_white":1649,"rating_black":1729,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-68,"rating_change_black":49,"extra_time_amount":0,"extra_time_trigger":0},{"id":859057,"date":1784405195939,"size":6,"player_white":"Torinku","player_black":"SilverPhantom","notation":"P A6,P F1,P D3,P C3,P E2,P C2,P C4,P B4,P B3,P D4,P E3,P E4,P C5,P A4,P F4,P E5,P D5 C,M D4 C4 1,P D4 W,P A5,M D4 C4 1,P D4 C,M C4 B4 2,P A3,P A2,P D2,P B2,M D4 C4 1,P F2,P D4,P D6,P C1,M D5 D4 1,M E4 E3 1,P B5 W,P F3,P E4,M E5 E4 1,P D5,M C4 B4 1,M B5 A5 1,M B4 C4 3,M F4 F3 1,M D2 D3 1,P F4 W,P B5,M B2 C2 1,P B2,P D2,M E3 E2 2,M D4 D3 2,P B6,M D3 C3 4,P B1,M A2 A3 1,P E1,P E3,M A4 A3 1,M A5 A3 1 1,M C4 B4 4,M C5 B5 1,P A5,M A3 A5 2 2,P A3,M E3 E2 1,M E1 E2 1,M D2 E2 1,P E3 W,P D4,M B4 D4 2 2,M C3 E3 2 1,M D3 B3 1 1,M E3 E2 1,P E5 W,M E2 A2 1 2 2 1","result":"R-0","timertime":900,"timerinc":15,"rating_white":1723,"rating_black":1657,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":62,"rating_change_black":-86,"extra_time_amount":0,"extra_time_trigger":0},{"id":859028,"date":1784401371230,"size":6,"player_white":"the1Rogue","player_black":"Syntax_undefined","notation":"P A1,P F6,P E4,P E2,P D4,P E3,P E5,P C4,P C5,P D5 C,P B4,P D3,P C3 C,P D6,P A4,M C4 D4 1,M C3 D3 1,M D5 D4 1,P D5,P F4,P F5,M D6 D5 1,P D6,P B5,P C4,M D5 C5 2,P C6,P D5,P E6,M F4 E4 1,P B6,P A6,P A5,M A6 B6 1,M C6 C5 1,M D5 C5 1,P D5 W,M D4 D5 1,M D3 D4 2,M C5 C4 2,M D4 C4 3,M B5 B4 1,P B5,P C6 W,P F4,P F3,M C4 C5 4,M B4 C4 2,M C5 C4 5,M F3 F4 1,P A6,P B4,M C4 B4 6,M E4 C4 1 1,M D4 C4 1,P E4 W,M C4 C1 1 1 2","result":"R-0","timertime":900,"timerinc":15,"rating_white":1903,"rating_black":1620,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":21,"rating_change_black":-33,"extra_time_amount":0,"extra_time_trigger":0},{"id":859022,"date":1784400834591,"size":6,"player_white":"Syntax_undefined","player_black":"the1Rogue","notation":"P A1,P F6,P E4,P E2,P E3,P D2,P F2,P F1,P E1,P F3,P E5,P D3 C,P D4 C,P C2,P C4,P B2,M E3 F3 1,P B1,M E1 F1 1,P F4 W,P E1 W,M F4 F3 1,M E1 F1 1,P E3,M E4 E3 1,M E2 E3 1,P A6","result":"0-1","timertime":900,"timerinc":15,"rating_white":1624,"rating_black":1901,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-38,"rating_change_black":24,"extra_time_amount":0,"extra_time_trigger":0},{"id":858836,"date":1784326051215,"size":6,"player_white":"Nok_","player_black":"DeltaWhy","notation":"P A1,P A6,P B4,P C4,P C3,P B3,P C5,P D3,P D4 C,P B5 C,M C5 C4 1,M B5 B4 1,P D2,P B2,P C2,M B4 C4 2,M D4 D3 1,P B4,M C2 B2 1,P D4,M C3 B3 1,P A4,P D5 W,P A3,P A2,M C4 C3 3,P C2,P B1,P E2,M A1 A2 1,M B2 A2 2,M A3 A2 1,P B2 W,M A2 A5 2 1 2,P E4,P E3,P F3,P F4,M F3 E3 1,P E5,M D5 D4 1,P C5,P D5,P D6,M D3 D4 1,P F5,M B3 B4 2,P B5,M E4 E5 1,P B3,M B2 B3 1,P C6,P E6,P E4,M B3 A3 2,M A4 B4 1,M D4 B4 1 2,M C4 D4 1","result":"0-R","timertime":600,"timerinc":20,"rating_white":1501,"rating_black":1633,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-55,"rating_change_black":81,"extra_time_amount":0,"extra_time_trigger":0},{"id":858705,"date":1784257302093,"size":6,"player_white":"alion02","player_black":"Abyss","notation":"P A1,P F6,P E4,P B4,P B3,P C4,P C3 C,P D3 C,P D4,P D5,P E3,P D2,P F4,P D1,P C5,M C4 D4 1,P D6 W,P E1,P C4,P C1,P B1,P B2,P C2,P F1,M B1 C1 1,M D5 C5 1,P C6,P A4,M C6 C5 1,P C6 W,P E2,P B1 W,P F5,M B1 C1 1,P F2,P A3,P F3,P E5 W,P E6,M C6 C5 1,M F2 F1 1,M E5 F5 1,P E5,M C5 E5 2 2,P A2,P A5,M D6 D5 1,P A6,M A2 A3 1,P A2,M D5 D4 3,M A4 A3 1,M D4 A4 1 2 2,P F2,P D4,M D3 D4 1,P D3,M D4 B4 1 1,M A4 A3 2,M D2 D3 1,P D2,M C1 C2 2,M C3 C2 1,M B4 B2 1 2,M C4 A4 1 1,M B3 B4 2,P B3 W,M F2 F1 1,M D2 D1 1,P B1,M D1 C1 2,P D2,P C5,P D1,P F2 W,P D5,P C6,M D1 C1 1,M F2 F1 1,P D6,M F1 D1 2 2,M B4 D4 1 3,P B4 W,P F1 W,M E2 D2 1,M F1 E1 1,P E2 W,M E1 F1 3,M B4 C4 1,M F1 F3 1 2,M C4 D4 2,M D6 E6 1,P B4,M E5 E4 3,M D1 C1 2,P B6,M D4 D6 1 3,P B5,M C1 B1 3,M B6 C6 1,M A3 A1 2 3,M B2 A2 2,P C3","result":"F-0","timertime":600,"timerinc":20,"rating_white":2312,"rating_black":2089,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":20,"rating_change_black":-21,"extra_time_amount":0,"extra_time_trigger":0},{"id":858609,"date":1784221248929,"size":6,"player_white":"MediocreTaborlin","player_black":"Cap88","notation":"P A1,P F6,P D4,P C3,P C4,P D3,P E4,P E3,P F4,P D5 C,P F3,P F2,P F5,P E2,P D2 C,M D5 D4 1,P D5,P E5,P C5,P E6,P D6,P A3,P B3,P B4,M D2 D3 1,P A4,P D2,P E1,M D3 E3 2,P D1,P B5,P A5,P A6,P B6,P A2,P C1,P B1,P B2,P F1,M B2 B1 1","result":"0-R","timertime":600,"timerinc":20,"rating_white":1817,"rating_black":1851,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-9,"rating_change_black":122,"extra_time_amount":0,"extra_time_trigger":0},{"id":858549,"date":1784202878310,"size":6,"player_white":"the1Rogue","player_black":"Vogopolis","notation":"P A1,P F6,P E4,P C2,P C4,P D4 C,P D3 C,P A3,P E3,P A5,P A2,P A6,P B3,P B2,P F4,P A4,M A2 A3 1,M B2 B3 1,P B4,M B3 A3 2,P A2 W,M A3 B3 3,M A2 A3 1,P A2,P F5,P E5 W,P E6,P F3 W,P D2,M F3 F4 1,P C3,P B2,P D1,P B5,M B4 B3 1,P B4,M B3 B6 1 1 2","result":"R-0","timertime":900,"timerinc":15,"rating_white":1897,"rating_black":1769,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":38,"rating_change_black":-38,"extra_time_amount":0,"extra_time_trigger":0},{"id":858548,"date":1784200757244,"size":6,"player_white":"Vogopolis","player_black":"the1Rogue","notation":"P A1,P F1,P E2,P B4,P E3,P E4,P B3,P A4,P A3,P C3 C,P D3 C,P D4,P E5,P C4,M D3 D4 1,P D3,P F3,P F2,P E1,P D2 W,P E6,M D2 E2 1,P B2,P C2,P C1,P B1,P D1,P A5,M C1 C2 1,M C3 C2 1,P C3,M C2 C3 2,P C1,P A6,M B3 B4 1,P A2,M A3 A2 1,P A3,P D2,M C2 B2 1,M B4 A4 2,P B3,P D5,M E2 E3 2,P C2 W,P E2,P B5,M A3 A4 1,M B5 A5 1,M A4 A5 4,P A4 W,M A5 D5 2 1 2","result":"0-R","timertime":900,"timerinc":15,"rating_white":1773,"rating_black":1892,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-47,"rating_change_black":48,"extra_time_amount":0,"extra_time_trigger":0},{"id":858417,"date":1784141008631,"size":6,"player_white":"SilverPhantom","player_black":"Niaisenif","notation":"P A1,P F1,P D3,P C4,P D4,P C3,P D2,P C2,P D5,P C1,P D6,P D1,P E2,M C4 D4 1,P C4 C,P E1,P F2,M D4 D3 2,P E3,P D4,M C4 D4 1,M D3 C3 3,P D3","result":"R-0","timertime":600,"timerinc":20,"rating_white":1623,"rating_black":1352,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":82,"rating_change_black":-49,"extra_time_amount":0,"extra_time_trigger":0},{"id":858291,"date":1784092974623,"size":6,"player_white":"Tones","player_black":"rabbitboy84","notation":"P F6,P A1,P E4,P B4,P B2,P C4,P E2,P D4,P E5,P A4,P E3,P F4,P D3 C,P E6,P D5,P D6 C,P F5,P C5,M F5 F6 1,M D6 D5 1,P B5,P B3,P C3 W,P F5,M C3 C4 1,P C3,P C2,P A5,P D2,M E6 E5 1,M E4 E5 1,P B1 W,P C1,M D5 E5 2,P A2,M B3 B2 1,P B6,P E4,P F2,P D5,M C4 B4 2,P C4,M D3 C3 1,M E5 B5 1 1 3","result":"0-R","timertime":600,"timerinc":20,"rating_white":1958,"rating_black":1941,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-46,"rating_change_black":81,"extra_time_amount":0,"extra_time_trigger":0},{"id":858290,"date":1784089743817,"size":6,"player_white":"rabbitboy84","player_black":"Tones","notation":"P A1,P F6,P E4,P B4,P F4,P E3 C,P C3,P B3,P C4,P B5,P C5,P A3,P B6,P C6,P A4 C,P A5,M A4 B4 1,P A4,P A2,P B2,M A2 A3 1,P C2,P D5,P A2,M B4 B3 2,M E3 E4 1,P E6,M B5 C5 1,P D3,P D4 W,P B5,P D2,P D6,M D4 D5 1,P E3,M E4 E3 2,P D4,P E4 W,P A6,P B4,P B1,P E2,M B1 B2 1,P B1,M B5 C5 1,M C6 D6 1,M C5 A5 1 2,P F2,M D3 D2 1,P D1,P C1 W,P E1,P E5,P C6,P D3,P F1,P F5,M D1 D2 1,M C1 B1 1,P C5,M E6 D6 1,M C6 D6 1,P C1,M D2 D4 1 2,M C4 B4 1,M C2 C1 1,M B1 C1 2,P B1 W,P C2,P D1 W,P C4 W,M E4 D4 1,P D2,M A4 A5 1,M B5 A5 1,P A4 W,P F3,M A4 A5 1,P B5,M A5 A6 5,P C6 W,M D6 F6 2 2,P D6,M A6 B6 2,M D6 E6 1,M B1 B2 1,M C1 C2 3,P D6,M E6 F6 2,M D4 F4 3 1,M F6 D6 1 3,P A4,M B3 A3 3,P B1,M A3 A5 2 3,P B3","result":"0-F","timertime":600,"timerinc":20,"rating_white":1942,"rating_black":1951,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-15,"rating_change_black":70,"extra_time_amount":0,"extra_time_trigger":0},{"id":858272,"date":1784075310483,"size":6,"player_white":"Torinku","player_black":"Vogopolis","notation":"P A6,P F1,P D3,P C4,P E2,P D4,P E3,P E4,P C3,P F4,P C5 C,P B5,P D5,P D2 C,P C2,P B4,P B2,P A5","result":"0-R","timertime":900,"timerinc":15,"rating_white":1745,"rating_black":1768,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-61,"rating_change_black":55,"extra_time_amount":0,"extra_time_trigger":0},{"id":858265,"date":1784072142087,"size":6,"player_white":"Vogopolis","player_black":"Torinku","notation":"P A1,P F1,P E2,P C4,P E3,P D4,P E4,P D3 C,P E5,P C3,P F2,M D3 E3 1,P D3 C,P F4,P C2,P B2,P B3,P D2,P B4,P B5,P C5,P A2,P A3,P C6,P D5,M E3 E4 2,M D3 C3 1,M A2 A3 1,P A4,P A5 W,P D3,M A5 A4 1,P A2,P A5,M C5 B5 1,P C5,P E3,M E4 E3 3,P B6,M A4 B4 2,P D1,P B1,P C1,P E1,P E4,M E3 D3 4,M B6 C6 1,P E3,P F3,P D6,P E6,M D2 E2 1,M D1 E1 1,M E2 E1 2,M F1 E1 1,P E2 W,M E1 C1 1 2,M E2 E1 1,P F1,M E1 F1 3,P E2,P E1,P D2,M F1 F3 2 2,P F1,M E1 F1 1,P E1,M B4 B5 3,P B4,P A4,M D5 D4 1,M F4 E4 1,P D5,M D3 D4 5,M C1 A1 1 2,M B5 B3 1 4,M E1 F1 1,P F4","result":"0-R","timertime":900,"timerinc":15,"rating_white":1776,"rating_black":1736,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-80,"rating_change_black":96,"extra_time_amount":0,"extra_time_trigger":0},{"id":858220,"date":1784059195124,"size":6,"player_white":"PlutoTheBrave","player_black":"Carlitos","notation":"P A1,P F6,P D4,P C3,P E5,P C4,P C5,P D5,P E4,P D3 C,P E3,P E2,P D2,P F2,P F5,P D1,P B4,M D5 C5 1,P C2 C,M D3 D2 1,P D3,P C1,P B1,P B2,M B1 C1 1,P B3,M D3 C3 1,M D1 C1 1,P A4,M C4 B4 1,M C2 C1 1,P C4,M C1 C2 2,P D3 W,P B5,P C6,M B5 B4 1,M B3 B4 1,M A4 B4 1,P B3 W,M B4 C4 4","result":"R-0","timertime":900,"timerinc":15,"rating_white":2044,"rating_black":1635,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":9,"rating_change_black":-11,"extra_time_amount":0,"extra_time_trigger":0},{"id":858207,"date":1784053531854,"size":6,"player_white":"Carlitos","player_black":"archvenison","notation":"P A1,P F6,P E4,P C3,P E3,P E2,P D4,P D2,P C4,P D3 C,P B4,P D5,P F4,M C3 C4 1,P C5,M C4 D4 2,P C4 W,P D6,M C4 D4 1,M D3 D4 1,P D3 C,P C3,P C2,P C1,P B3,P F3 W,P A3,M F3 E3 1,P B1,P C4,M C2 C3 1,P C2,P B2,P A2 W,P B5,M A2 B2 1,P A2,P A4,P B6,M A4 A3 1,M B1 C1 1,P D1,M A2 A3 1,M B2 B3 2,M C5 D5 1,M D4 D5 5,M A3 A5 1 2,M B3 C3 3,P E1,P C5,M B4 C4 1,M C3 C4 4,M C1 C2 2,P C1,P D4 W,M C1 C2 1,M D3 C3 1,M C2 A2 1 2,P F2 W,P F1,M E1 F1 1,M C4 A4 1 5,P C4,P B3,M C3 B3 2,P C3,M B3 B4 3,P F3,M C4 C5 1,P C4,M C5 C4 2,P C5,P D3 W,P B3,M D3 C3 1,P C6,P A3,P D3,M A3 A2 1,M A4 A2 1 5,P E6,P B1,M E6 D6 1,P E6,P E5,M D5 E5 6,M B4 B2 1 3,P C1,M F2 E2 1,M E5 E3 5 1","result":"0-R","timertime":900,"timerinc":15,"rating_white":1636,"rating_black":1931,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-19,"rating_change_black":16,"extra_time_amount":0,"extra_time_trigger":0},{"id":858205,"date":1784052246853,"size":6,"player_white":"archvenison","player_black":"Carlitos","notation":"P A1,P F6,P D4,P C3,P E5,P C4,P D5,P D3,P C5,P B5,P B4 C,P E4 C,P E6,P D6,P A5,M B5 C5 1,P B5,P C6,M B4 C4 1,M C5 D5 2,M E5 D5 1,M E4 D4 1,M D5 F5 1 2,M D4 D5 2,P D4,P E4,P F4,P F3,P B4,M F3 F4 1,P E3,M D5 D4 3,P D5,M D6 D5 1,P D6,P B3,M B4 B3 1,P A3,P B6,M C6 D6 1,P C6 W,P B2,M C4 C3 2,P D2,M C6 D6 1,P C2,M E3 D3 1,P E3,M D6 D5 2,P E2,P C6","result":"R-0","timertime":900,"timerinc":15,"rating_white":1929,"rating_black":1639,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":18,"rating_change_black":-21,"extra_time_amount":0,"extra_time_trigger":0},{"id":858204,"date":1784052172177,"size":6,"player_white":"FilipFarkas","player_black":"Torinku","notation":"P A6,P F6,P E4,P E2,P D4,P B3,P D3,P C3,P D2,P E3 C,P D1,P C2,P E5,M E3 D3 1,P E3,P F2,M D2 E2 1,P D2 W,M E2 F2 2,P F1,P E1,P F3,P E2 C,M D3 E3 2,P D3,P D5,P F5,M D2 D3 1,P B4,P B5,P C4,M E3 E4 3,P C1,P B1,P B2,M C2 B2 1,P C2 W,P F4,M C2 B2 1,P C2 W,P C5,P C6,P A4,M C3 C4 1,P E3,P A5,M D4 C4 1,P D4,M C4 C6 1 2,P C4,M C5 A5 1 1,P C3,P A3,P A2,M B2 B3 2,P A1,P C5 W,P B6 W,P D6 W,M B6 B5 1,P E6,M B5 A5 2,P B6,M A5 A3 1 3,M C5 B5 1,P C5,M B3 C3 3,P B3,M C3 C4 4,P C3,M E2 F2 1,M F3 E3 1,M F2 F4 3 1,P F2,P E2,P D2,M E2 F2 1,M F1 F2 1,M F3 F2 3,P F3 W,P F1,P E2,M F2 D2 2 4,M C2 D2 1,P F2,M D2 F2 1 4,M F4 F3 1,M E2 B2 1 1 1,M F3 E3 2,P A5","result":"0-F","timertime":600,"timerinc":20,"rating_white":1810,"rating_black":1720,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-70,"rating_change_black":93,"extra_time_amount":0,"extra_time_trigger":0},{"id":858135,"date":1783993020395,"size":6,"player_white":"Evoshen","player_black":"Vogopolis","notation":"P A1,P F6,P D4,P C2,P C4,P D3 C,P E4,P E2,P B4,P B2,P F4,M D3 D4 1,P D2 C,P B3,P E3,P E1,P D3,P F3,P C3,M F3 E3 1,P B5,P D1,P A5,P B1,M D3 E3 1,M D4 C4 2,P C5,P F1,M E3 E1 1 2,P E3 W,P D5,M C4 C5 3,P D4,P C4 W,P D6,M E3 E2 1,M E1 D1 3,M C4 D4 1,P C4,M C2 C3 1,P D3,P A4,P E3,M E2 E4 1 2,P C6,P B6,P A6,M C5 B5 4,M A5 A4 1,P A3 W,M D2 D3 1,M A3 A4 1,M C6 B6 1,M B5 B6 4,P C5,P E1,P A5,M B6 B5 5,M D3 B3 1 1,M A4 C4 1 2,P D2,P C1,P C6,M E1 D1 1,P E1 W,M D1 D3 1 3,M E1 D1 1,P F3,M D1 D2 2,P E1,P D1,P C2,M C6 B6 1,M D3 C3 2","result":"0-R","timertime":600,"timerinc":20,"rating_white":1613,"rating_black":1771,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-45,"rating_change_black":42,"extra_time_amount":0,"extra_time_trigger":0},{"id":858117,"date":1783986511380,"size":6,"player_white":"Vogopolis","player_black":"Syntax_undefined","notation":"P A1,P F6,P E5,P D4,P E4,P D5,P E3,P D3,P E2,P F3 C,P C4 C,P D2,P E6,M F3 E3 1,P C5,P D6,M C4 D4 1,P C2,P F3,P F2,P B5,P A5,P A4,P C4,P B4,M D6 E6 1,P F5,M D5 E5 1,P F4,M E3 E4 2,P E3,M D3 E3 1,P D3 W,P E1,M D3 E3 1,P B2,P D3,P B1,M E2 F2 1,P F1,M E3 E1 1 2,P E3,P D5,M D2 D3 1,M D4 D3 2,P D4 W,P D2,M F1 F2 1,P D1,M F2 D2 1 2","result":"0-R","timertime":900,"timerinc":15,"rating_white":1780,"rating_black":1604,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-82,"rating_change_black":193,"extra_time_amount":0,"extra_time_trigger":0},{"id":858115,"date":1783985352804,"size":6,"player_white":"Syntax_undefined","player_black":"Vogopolis","notation":"P A1,P F6,P E4,P C2,P F4,P D2,P E2,P E3 C,P F3,P F2,P F1,P B2,M E2 F2 1,P F5,P E2 C,P D3,M F6 F5 1,M E3 F3 1,P F6,P E3,M E2 E3 1,M F3 F2 2,P F3,P A2,M E3 E2 2,M F2 F3 4,P E3 W,P D4,P C4,P D5,M E2 D2 2,P C3,M D2 D4 1 2,P E2,P B4,M F3 F5 1 3,P A4,M F5 F4 4,P E5,M F4 E4 4,P D6,P F2,M F1 F2 1,P D2,P F1,M F4 F2 1 1","result":"0-R","timertime":900,"timerinc":15,"rating_white":1610,"rating_black":1776,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-57,"rating_change_black":37,"extra_time_amount":0,"extra_time_trigger":0},{"id":858074,"date":1783966729905,"size":6,"player_white":"rabbitboy84","player_black":"PlutoTheBrave","notation":"P A1,P F6,P E4,P B4,P E3,P E2,P D2,P B3,P E5,P A3,P D3,P D4 C,P E6,M E2 E3 1,P B5,P C4,P C3 C,P A2,P A4,P C5,M B5 B4 1,P B5,M C3 C4 1,P A5,P E2,P B6,P D1,M E3 E4 2,P B2 W,P D5,M E5 D5 1,P C3,M B2 B3 1,P C2,P E3,P E5 W,P F4,M E5 D5 1,P F5,M D5 F5 1 2,P F3,P D5,P C6,P D6,M C6 C5 1,P C6,M C4 C5 2,M F5 F3 1 2,M C5 E5 2 2,M F3 F4 3,M E5 E4 2,M C2 D2 1,M D3 D2 1,M A5 A4 1,M E4 E5 4","result":"R-0","timertime":900,"timerinc":15,"rating_white":1935,"rating_black":2048,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":81,"rating_change_black":-47,"extra_time_amount":0,"extra_time_trigger":0},{"id":858072,"date":1783963731305,"size":6,"player_white":"the1Rogue","player_black":"archvenison","notation":"P A1,P F6,P E4,P C3,P E3,P E2,P C4,P D3,P D4,P D5,P B4,P C5 C,P D2 C,P C2,P F4,M C5 C4 1,P E1,P F5,P E5,M C4 D4 2,P E6,M D5 E5 1,P D5,M D4 D5 3,P C4,P D4,M D2 D3 1,P C5 W,P B3,P B2,M C4 C3 1,M B2 B3 1,P A3,M C2 C3 1,M D3 C3 2,P D3 W,P D2,P D1,P C2,M E2 D2 1,P E2,P B5,P A5,P A6,P B6,P C6,P F3,P D6,M F4 F5 1,M D1 E1 1,P F4,M D5 F5 1 3,P D1,M F5 E5 4,M B4 B3 1,M D2 E2 2,P A4,M B5 B6 1,M A5 A6 1,P D5,M D1 E1 1,P A5,M A6 B6 2,M C6 B6 1,P B5 W,M B6 E6 2 1 2,P D2,M E5 E3 1 5,P F2,M D3 D2 1,P F1,M F5 F4 1,P C1,P D1 W,P F5,M D1 E1 1,M E5 E4 1,M D4 E4 1,P D3","result":"1/2-1/2","timertime":900,"timerinc":15,"rating_white":1892,"rating_black":1930,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":6,"rating_change_black":-5,"extra_time_amount":0,"extra_time_trigger":0},{"id":858067,"date":1783963235996,"size":6,"player_white":"PlutoTheBrave","player_black":"rabbitboy84","notation":"P A1,P F6,P D4,P D3,P E5,P E4,P D5,P C4 C,P B5,P C5,P C6,P D6,P E6,M C4 D4 1,P A5,M D4 D5 2,P D4 C,P C4,P C3,P B3,P B4,P C2,P E3,P C1,M C3 C4 1,M B3 B4 1,M E3 E4 1,M D5 E5 3,P B6,M D6 E6 1,P C3,P D2,P E2,M E5 E4 4,P D1,P E3,P E5 W,P F3,M E2 D2 1,P E2 W,P D6,M E2 D2 1,M E5 E6 1,P E5 W,P B3,P B1,M D4 D3 1,M E4 C4 1 5,P E4,P E2,M D3 E3 2,P F2,M E3 E2 3,P A4,P E3,P F4,P D3,M C4 C3 6,P D5,M D4 E4 1,P D4,M D2 D4 1 2,M E3 D3 1,M D4 D3 3,P D4 W,P E3,P D2 W,M C3 D3 1,M E2 E3 4,M D3 D4 1","result":"0-R","timertime":900,"timerinc":15,"rating_white":2054,"rating_black":1925,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-57,"rating_change_black":97,"extra_time_amount":0,"extra_time_trigger":0},{"id":858060,"date":1783962299364,"size":6,"player_white":"archvenison","player_black":"the1Rogue","notation":"P A1,P F6,P D4,P B4,P E5,P B5,P C4,P B3,P C3 C,P B2,P A3,P B1,M A3 B3 1,P A3 C,M C3 B3 1,P A4,P A2 W,P B6,P A5,M A3 A2 1,M B3 B5 2 1,M A2 B2 2,M B5 B4 2,P C5 W,P D5,P E4,P B5,M C5 D5 1,P F4,M E4 D4 1,P E4,P E3 W,P F3,P F2,P E2,P E1,P F1,P D2,P D3,M E3 E4 1,P E3,P C3 W,P C5,M E1 E2 1,M B4 D4 3 2","result":"R-0","timertime":900,"timerinc":15,"rating_white":1925,"rating_black":1898,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":53,"rating_change_black":-65,"extra_time_amount":0,"extra_time_trigger":0},{"id":857988,"date":1783910623011,"size":6,"player_white":"SilverPhantom","player_black":"SlateBrick","notation":"P A1,P F6,P D4,P C4,P D3,P C3,P D5,P C5 C,P D2,P E4,P D6,M C5 D5 1,P E6,P F4,P C6,P B4,P B6,M D5 D6 1,P C5,M D6 D4 1 1,P A4 C,P A3,P B3 W,P A6 W,P B5,P D6 W,P E5,M D4 D5 2,P D4,P A5,P D1,M B4 B5 1,P B4,P F5,M B4 C4 1","result":"R-0","timertime":900,"timerinc":15,"rating_white":1602,"rating_black":1525,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":156,"rating_change_black":-45,"extra_time_amount":0,"extra_time_trigger":0},{"id":857986,"date":1783907002272,"size":6,"player_white":"SlateBrick","player_black":"SilverPhantom","notation":"P A6,P F1,P D3,P C3,P D4,P C4,P D2,P D5,P C2,P B2,P B3,P B4,P A3,P E4,P C5 C,P F4,P D6,M D5 D4 1,M C5 C4 1,P A4,P D5,P E3 C,P C5,M E3 D3 1,M C4 B4 2,P C4,P B5,P A2,M C2 B2 1,P B1 W,P E5,P F5,P F6,M A2 A3 1,P A5,M A6 A5 1,P A6,M D3 C3 2,M B4 D4 1 2,P B6,P B4 W,P C6,M A6 A5 1,M C4 C5 1,M D4 D3 3,M E4 D4 1,M B4 C4 1,P B4,P E4,P E3,P E6,P E2,M E4 D4 1,P D1,P A6,P E4 W,M C4 C5 2,M B4 B5 1,M C5 B5 3,M C3 C5 1 2,P C3,M E4 D4 1,M D3 D4 1,M D3 B3 1 1,M A5 A3 1 2,P B4 W,M B5 B6 4,P C2,M D4 C4 4,P D3,M B2 B3 2,M C3 B3 2,M A3 B3 3,P C3 W,M C4 B4 1,M C4 E4 1 2,M B6 C6 5,M C3 B3 1,M B4 B3 1,P A5,M B3 B4 6,P B6,P C3,M B6 B5 1","result":"0-R","timertime":900,"timerinc":15,"rating_white":1531,"rating_black":1581,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-61,"rating_change_black":216,"extra_time_amount":0,"extra_time_trigger":0}]
            // return [{"id":860612,"date":1784999710873,"size":5,"player_white":"AaaarghBot","player_black":"Guest931","notation":"P E1,P A5,P A2,P E2,P A3,P A4,P E4,P D2,P D4,P C4 C,P C5,P D5,P D3,P E3,P C3 C,M C4 D4 1,M E4 E3 1,M E2 E3 1,M D3 E3 1,P D3 W,P C4,M D3 E3 1,P A1,M D4 C4 2,P B4,M C4 B4 3,M A5 A4 1,P A5,P C4,M B4 C4 4,P B4,M A5 A4 1,M B4 A4 1,P A5 W,P D4,M A5 A4 1,P B4,M A4 A1 1 2 2,P B3,P B5,P C2,P A5,P C1,M D5 C5 1,P A4,P D5,M D4 D5 1,M C5 D5 2,P D3,P E5,M A4 A5 1,M C4 B4 5,P C5,P C4,M C5 D5 1,P D4 W,M D5 B5 1 2,M D4 D5 1,P E4","result":"F-0","timertime":60,"timerinc":5,"rating_white":1932,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860611,"date":1784999652749,"size":5,"player_white":"CaptnUzbekistan","player_black":"CobbleBot","notation":"","result":"0-0","timertime":900,"timerinc":30,"rating_white":1000,"rating_black":1730,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860610,"date":1784999591503,"size":6,"player_white":"Guest929","player_black":"IntuitionBot","notation":"","result":"0-0","timertime":900,"timerinc":30,"rating_white":0,"rating_black":1635,"unrated":0,"tournament":0,"komi":0,"pieces":30,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860609,"date":1784999527242,"size":5,"player_white":"GravelBot","player_black":"Guest929","notation":"P A1,P E5,P D5,P B5,P D4,P D2,P C4,P B4,P A4,P B3 C,P A2,P B1,P B2,P C2,P C3 C,M C2 B2 1","result":"0-R","timertime":900,"timerinc":30,"rating_white":1396,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860608,"date":1784999459569,"size":5,"player_white":"Guest929","player_black":"GravelBot","notation":"P A1,P A3,P B1,P B2 C,P E3,P C3,P D3,P C2,P C4 C,P D2,P E2,M D2 D3 1,M C4 C3 1,P D2,M E3 D3 1,M D2 D3 1,M C3 D3 2,P B3,P D2,P B4,M D3 B3 2 3","result":"R-0","timertime":900,"timerinc":30,"rating_white":0,"rating_black":1396,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860607,"date":1784999235621,"size":5,"player_white":"GravelBot","player_black":"Guest929","notation":"P A1,P E5,P D5,P B4,P B5,P C4,P D4,P C3,P D3,P D1,P C5,P A5,P A4 C,M A5 B5 1,P E2,P C1,P C2,M C1 C2 1,M C5 C4 1,M C3 C4 1,P E1,M D1 E1 1,P C3,P C1,P D1,P D2 W,P B3,M B4 B3 1,P B4,M B3 C3 2,M B4 C4 1,M C3 C4 2,M C3 C4 1,P B4 C,M C4 C1 1 1 3,M D2 C2 1,P D2","result":"R-0","timertime":900,"timerinc":30,"rating_white":1396,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860606,"date":1784999153710,"size":5,"player_white":"Guest929","player_black":"GravelBot","notation":"P A1,P A5,P B5,P D4,P C5,P D5,P E5 C,M D5 C5 1,M B5 C5 1,P E2,P B5,P D5 C,M C5 C3 1 2,P D3,P D1,P D2,P E1,P C2,P A3,P B2,M E1 E2 1,P A2","result":"0-R","timertime":900,"timerinc":30,"rating_white":0,"rating_black":1396,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860605,"date":1784999096520,"size":5,"player_white":"GravelBot","player_black":"Guest929","notation":"P A5,P E1,P D1,P B2,P B1,P B3,P C1,P A1,P A2 C,M B2 B1 1,P C2,P C3 C,P B2","result":"R-0","timertime":900,"timerinc":30,"rating_white":1396,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860604,"date":1784999085221,"size":6,"player_white":"IntuitionBot","player_black":"Guest929","notation":"P F1","result":"1-0","timertime":900,"timerinc":30,"rating_white":1635,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":30,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860603,"date":1784998906570,"size":5,"player_white":"BeginnerBot","player_black":"Guest929","notation":"P B1,P D1,P D4,P B2,P D2,P B3,P D3 C,P D5,P C4,P C5,P E1,P B5,P B4,P A4,M B4 B3 1,P E5,M D4 D5 1,M E5 D5 1,M C4 C3 1,P A3,P E3,P A5,P A2,M D5 E5 2","result":"0-R","timertime":600,"timerinc":30,"rating_white":1116,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860602,"date":1784998801732,"size":5,"player_white":"BeginnerBot","player_black":"Guest929","notation":"P E2,P B5,P A3,P D2,P B4,P C2,P A4,P B2 C,P A2 C,P A1,P B1 W,M B2 B1 1,M A2 A1 1,P A2,P B2 W,M B1 B2 1","result":"0-R","timertime":600,"timerinc":30,"rating_white":1116,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860601,"date":1784998748445,"size":5,"player_white":"Guest929","player_black":"BeginnerBot","notation":"P A3,P B1,P C1,P A5,P C2,P A4,P C4,P A1 C,P C5,P A2","result":"0-R","timertime":600,"timerinc":30,"rating_white":0,"rating_black":1116,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860600,"date":1784998677368,"size":5,"player_white":"BeginnerBot","player_black":"Guest929","notation":"P A5,P E1,P A1,P B5,P B2,P C5,P E4,P D5,P E5 C,P C3,P E2,P D3,P E3","result":"R-0","timertime":600,"timerinc":30,"rating_white":1116,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860599,"date":1784994889930,"size":6,"player_white":"the1Rogue","player_black":"Sn0oT","notation":"P A1,P F6,P E4,P D4 C,P E3,P D3,P F4,P F5 W,P E5,P D5,P E2,P E1,P D1,P D2,P E6,M E1 E2 1,P E1,P F2,P C2 C,M F5 E5 1,P F5,M E5 E3 1 1,P F3,P F1,M C2 D2 1,P C2,M D2 E2 2,M F2 F3 1,P F2,P C3,P B2,P C1,M E2 C2 1 3,P A2,P A3,P B3,P E2,M E3 E2 2,M F2 F3 1,M C1 D1 1,P C1,P E3 W,M F3 F1 1 2,P F3,M A3 A2 1,M E2 D2 3,M C2 D2 1,P E2 W,M D2 C2 4,M A1 A2 1,P C6,P D6,P C5,P C4 W,P B5,P A3,M C2 A2 1 2,M E2 D2 1,M B2 B4 1 1,M D2 C2 2,M E6 D6 1,M D5 D6 1,P A1,M C4 B4 1,M A2 C2 2 1,M D6 B6 1 2,M C2 F2 3 2 1,M F3 F4 1,M E4 F4 1,P F3 W,M F2 F3 1","result":"R-0","timertime":900,"timerinc":15,"rating_white":1906,"rating_black":1779,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-1000,"rating_change_black":-1000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860598,"date":1784993712246,"size":6,"player_white":"Sn0oT","player_black":"the1Rogue","notation":"P A1,P F6,P D4,P B4,P C4 C,P B1,P C3,P C1,P C2,P D1,P E1,P D2,P E2,P E3,M E1 D1 1,P E1,P D3 W,P F1,M D3 D2 1,P D3 C,M D2 D1 2,P B3,M D1 B1 2 2,P B2,P C5,M D3 C3 1,P D3,P D2,P C6,M D2 D3 1,P D2,P D1 W,P F3,P A2,P B6,P F2,M E2 E3 1,M D1 C1 1,P A6,M F2 F3 1,P E4,P F4 W,P E6,M F4 E4 1,P D6","result":"R-0","timertime":900,"timerinc":15,"rating_white":1779,"rating_black":1906,"unrated":0,"tournament":1,"komi":4,"pieces":30,"capstones":1,"rating_change_white":171,"rating_change_black":-92,"extra_time_amount":0,"extra_time_trigger":0},{"id":860597,"date":1784993505644,"size":5,"player_white":"BeginnerBot","player_black":"lspace","notation":"P E1,P D1,P D2 C,P C4,P B1,P B4,P E5,P D4,P C2,P E4 C,P C5 W,P A4","result":"0-R","timertime":600,"timerinc":30,"rating_white":1117,"rating_black":1280,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-11,"rating_change_black":39,"extra_time_amount":0,"extra_time_trigger":0},{"id":860596,"date":1784993050087,"size":5,"player_white":"BeginnerBot","player_black":"lspace","notation":"P D2,P A5,P E4,P E3,P C3,P D3,P A2,P E2,P C5,P D5 C,P D4 C,P D1,P B1,M E3 E4 1,P C2,P E3,M C2 D2 1,M E2 D2 1,M C3 D3 1,M D2 D3 2,M D4 D3 1,P E2,M D3 D1 1 3,M E2 D2 1,P B4,P D4,M D1 D2 2,P E1,M D2 D4 1 3,M D2 D1 1,P B3,P E2,M D3 E3 1,M D3 E3 1,M D4 E4 4,M D5 D4 1,P E5,P D5,M C5 D5 1,M D4 D5 1,P D2,M D1 D2 2,M E4 E3 5,P C2,P B2,M C2 B2 1,M A2 B2 1,P B5 W,P A4","result":"R-0","timertime":600,"timerinc":30,"rating_white":1114,"rating_black":1284,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":29,"rating_change_black":-46,"extra_time_amount":0,"extra_time_trigger":0},{"id":860595,"date":1784990163024,"size":6,"player_white":"najma","player_black":"BerryBot","notation":"P F6,P A6,P B4,P F4,P B2,P B3,P A5,P F5,P B1,P F3,P F2 W,P E3,P C3,P E2,M F2 F3 1,P E4 C,P E1 W,P D2,M E1 E2 1,P D3,M E2 D2 2,P E2,M D2 E2 3,P D2,M E2 D2 4,P E2,M D2 E2 5,P D2,M E2 D2 6,P E2,P E1,P F1,M E1 E2 1,P B5 W,P C5 C,P C2 W,M C3 B3 1,M C2 B2 1,M C5 B5 1,P C3 W,P D4,P F2,P E1 W,P C4 W,P A4,P A3 W,P E6 W,P E5 W,P D5 W,P D6 W,P C2,P A1,P D1,P A2,P C6,P C1,P B6,M A3 B3 1,P C5,M B3 B4 2,M B5 B4 1,P A3","result":"0-F","timertime":120,"timerinc":15,"rating_white":1098,"rating_black":2543,"unrated":0,"tournament":0,"komi":4,"pieces":30,"capstones":1,"rating_change_white":0,"rating_change_black":0,"extra_time_amount":0,"extra_time_trigger":0},{"id":860594,"date":1784990102883,"size":6,"player_white":"najma","player_black":"BerryBot","notation":"P A1,P F6,P F1,P B3,P E3,P B4,P E4,P B5,P E5,P A2,P E2,P B6,P B2,P A3","result":"0-R","timertime":120,"timerinc":15,"rating_white":1098,"rating_black":2543,"unrated":0,"tournament":0,"komi":4,"pieces":30,"capstones":1,"rating_change_white":0,"rating_change_black":0,"extra_time_amount":0,"extra_time_trigger":0},{"id":860593,"date":1784989859602,"size":6,"player_white":"najma","player_black":"BerryBot","notation":"P A1,P F6,P B3,P D2,P E4,P E2,P F3,P F2,M F3 F2 1,P C2,P B2 W,P C1,M B2 B1 1,P B2,P A2 W,P D4 C,P D3 C,P C3,M D3 C3 1,P E3,P D3,P D5,M E4 E3 1,P D6,P F3,M D4 D3 1,P E4,P D4","result":"0-R","timertime":120,"timerinc":15,"rating_white":1098,"rating_black":2543,"unrated":0,"tournament":0,"komi":4,"pieces":30,"capstones":1,"rating_change_white":0,"rating_change_black":0,"extra_time_amount":0,"extra_time_trigger":0},{"id":860592,"date":1784989474856,"size":5,"player_white":"Takkerdose","player_black":"TakBappie","notation":"P B4,P B5,M B5 B4 1,P C3,P B3,P C2,P B2,P B1,M B2 B1 1,P B2 W,P C4,P E4,P A3,M B2 B3 1,P D4,M B3 B4 2,M D4 E4 1,P C1,P D4 C,P C5,M C4 C5 1,M C1 B1 1,P C1,M B1 D1 1 2,M D4 C4 1,M B4 B2 1 3,P B4,P A4 W,M B4 B3 1,M C3 B3 1,P C3,M B3 A3 3,P D3,P E1,P D2,M C2 D2 1,P C2,M B2 C2 3,M C4 C3 1,P B1 C,P A1 W,M B1 A1 1,P B1 W,P A2,M C3 C2 1,M A1 B1 1,M C2 C1 5,P C2 W,M C1 E1 1 3,M B1 C1 2,M D1 D3 1 2,M C2 D2 1,M D3 E3 2,M C1 C3 2 3,M E1 E2 2,M C3 E3 1 3,M E2 D2 1,M E3 C3 1 4,M D2 D3 4,P D4 W,M D3 E3 5,M C3 D3 4,P E5,M D4 E4 1,M E3 E2 2,M E4 E3 3,P B1,P C1,P D1,M A2 A1 1,P B5,M E3 E5 1 4,M D2 C2 1,M C1 C2 1,P C3 W,M C2 A2 2 2,P B3 W,M A3 A2 2,M B1 B2 1,M A2 B2 2,M B3 B2 1,P B3 W,M B2 D2 3 2,M E5 C5 3 2,M C2 C1 1,M C5 A5 1 3,M E2 E3 3,P B4,M E3 E4 4,M B3 B2 1,M E4 B4 1 1 3,P C5,M B4 B5 4,M B2 C2 2,M B5 D5 1 4,M C2 C1 4,M D5 C5 5,M C1 E1 2 3,M D5 E5 1,P B3,M C3 B3 1,P C3,M B3 A3 2,P C2,M A3 A1 1 3,P B3","result":"0-F","timertime":10800,"timerinc":180,"rating_white":1146,"rating_black":1196,"unrated":0,"tournament":0,"komi":1,"pieces":21,"capstones":1,"rating_change_white":-32,"rating_change_black":77,"extra_time_amount":0,"extra_time_trigger":0},{"id":860591,"date":1784989280571,"size":5,"player_white":"CobbleBot","player_black":"DirkFunk","notation":"P E5,P A4,P A3,P B5,P B4,P D5,P A5,P C5,P C3 C,M B5 A5 1,M A4 A5 1,P B5 C,P E3,P C4,P D3,P B3,M B4 B3 1","result":"R-0","timertime":900,"timerinc":30,"rating_white":1729,"rating_black":1297,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":6,"rating_change_black":-13,"extra_time_amount":0,"extra_time_trigger":0},{"id":860590,"date":1784989145699,"size":5,"player_white":"DirkFunk","player_black":"CobbleBot","notation":"P A5,P D3,P D2,P C5,P D4 C,P C3 C,P D1,M C3 D3 1,P E4,P C4,P E5,M D3 D2 2,P D3,P C3,P E3,P E2,P E1,P C1,P C2 W,M D2 C2 1","result":"0-R","timertime":900,"timerinc":30,"rating_white":1298,"rating_black":1729,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-13,"rating_change_black":6,"extra_time_amount":0,"extra_time_trigger":0},{"id":860589,"date":1784989021769,"size":5,"player_white":"CobbleBot","player_black":"DirkFunk","notation":"P E1,P B5,P B4,P C1,P A4,P A1,P B1 C,P B3 W,P B2,P D1,P A3,M B3 B4 1,P A2,M B4 A4 2,P B3,M A4 B4 3,P A4,M B4 A4 3,P B4","result":"R-0","timertime":900,"timerinc":30,"rating_white":1728,"rating_black":1299,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":6,"rating_change_black":-14,"extra_time_amount":0,"extra_time_trigger":0},{"id":860588,"date":1784987963161,"size":5,"player_white":"CobbleBot","player_black":"DirkFunk","notation":"P A5,P E2,P D2,P E3,P D1,P A4,P C1,P B2 C,P B1,M E3 E2 1,P A1,M B2 B1 1,P D3,P A3,P A2,P B2,P B3 C,M B2 A2 1,M A1 A2 1,M A3 A2 1,P A3 W,M A2 A1 4,P C3,P E1,P E3,M E1 D1 1,M C1 D1 1,M B1 D1 1 1,M D2 E2 1,M A1 C1 2 2,P A2,M D1 D3 2 2,M E2 C2 1 2,P E1,P E2,M C1 C2 3,M D2 B2 1 2,P D2 W,P C1,M D3 C3 3,P D1,M C3 C2 4,P B4,M C2 A2 1 4,P B5,M A5 B5 1,M B4 B5 1,M A2 B2 5,M C1 C2 1,M D2 E2 1,P C3,P A1,P D3,M E1 D1 1,P C1,P E1,P B4","result":"R-0","timertime":900,"timerinc":30,"rating_white":1727,"rating_black":1301,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":6,"rating_change_black":-15,"extra_time_amount":0,"extra_time_trigger":0},{"id":860587,"date":1784987377472,"size":5,"player_white":"BeginnerBot","player_black":"Guest924","notation":"P E5,P C3,P D3 C,P D5 C,P A3,P B3,P D1,M B3 C3 1,P E2,P D2,P B3,M C3 B3 2,P B4,M B3 A3 3,P B3","result":"1-0","timertime":600,"timerinc":30,"rating_white":1114,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860586,"date":1784986407758,"size":5,"player_white":"Torinku","player_black":"najma","notation":"P A5,P E1,P C3,P B3,P D3,P A3,P A4 W,P E3 W,P C4,P C2,P D2,P C1,M A4 A3 1,M C2 C3 1,P D4,M E3 D3 1,M A3 C3 1 1,P B2 C,P E3 C,P A1,M E3 D3 1,P D5,M D3 C3 1,P B1,P C5,M D5 C5 1,P E4,M D3 D4 2,P B5,M A5 B5 1,P B4 W,P E2,P D3,M E2 D2 1,M B4 B3 1,P E2,M C3 C1 2 1,M B2 C2 1,M D3 D2 1,M C2 C3 3,P D5,P B4,M C4 D4 1,P D3 W,M D4 A4 1 1 2,M D3 D4 1,P D1,P D3,M C1 B1 2,P B2 W,P A5,P E3,M B1 B2 1,P C2,M B2 B3 1","result":"0-R","timertime":600,"timerinc":20,"rating_white":1740,"rating_black":1000,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-158,"rating_change_black":986,"extra_time_amount":0,"extra_time_trigger":0},{"id":860585,"date":1784986161191,"size":6,"player_white":"Pinheadlarry","player_black":"FriendlyBot","notation":"P A6,P F6,P C4,P A4,P A3,P B6,P D4,P C6,P D6,P D5,P E5,M D5 D6 1,P E6,P E4,P D5 C,P A5,P B3,M A4 A3 1,M B3 A3 1,P B4,M A3 B3 2,M B4 B3 1,M A3 B3 1,P A4,P A3,M E4 E5 1,M D5 E5 1,P C5 C,P D3,P B4,M B3 C3 2,M B4 B3 1,M C3 B3 2,P B4,M B3 C3 5,P B3,M C3 B3 3,M B4 B3 1,M C3 B3 2,P E4 W,P B4,M E4 D4 1,P E3,P C3,M B3 C3 3,M D4 D3 2,M E5 E3 1 1,M D3 B3 1 2,M C3 C2 5,M B3 B5 1 3,P B1,M B3 B1 1 1,M C2 B2 1,P D5,M E3 E4 1,P F5,P B3,M D5 E5 1,P D5 W,M C5 D5 1","result":"0-R","timertime":900,"timerinc":30,"rating_white":1450,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":30,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860584,"date":1784986029406,"size":6,"player_white":"IntuitionBot","player_black":"relimation","notation":"P A1,P F6,P D2,P A6,P C2,P A2,P A3,P B3 C,P B2,P B5,P B1 C,P B4,P D3,P B6,M A3 A2 1,M B3 B2 1,P D4,P B3,P C1,M B2 A2 2,M B1 A1 1,M A2 B2 3,P B1,P D5,P E4,M B2 B1 3,P B2 W,P C3,P E5,M C3 C2 1,P F5,M D5 D4 1,P E3,P D1 W,M C1 C2 1,M D1 D2 1,P C3,M D2 C2 2,P D1,M C2 E2 2 3,P C2,M E2 E3 3,M E4 D4 1,P D5,P E4,M E3 E4 4,M D4 D5 2,M D2 D4 1 1,M D3 D4 1,M E4 D4 5,P C5,P C4,P E4,P E3,P D2,P D6,M D3 E3 1,M D4 E4 6,M C3 C4 1,M D4 C4 2,P D3,M D6 D5 1,M C5 D5 1,P D4 W,P F3,M D4 D3 1,P F4,M D3 E3 2,P D4,M E3 D3 3,M D4 C4 1,M B4 C4 1,P E2,P F2,M E2 E3 1,M D3 E3 3,P D4,P D3,M D4 C4 1","result":"1-0","timertime":900,"timerinc":30,"rating_white":1632,"rating_black":1551,"unrated":0,"tournament":0,"komi":0,"pieces":30,"capstones":1,"rating_change_white":29,"rating_change_black":-47,"extra_time_amount":0,"extra_time_trigger":0},{"id":860583,"date":1784985682741,"size":6,"player_white":"BerryBot","player_black":"Guest923","notation":"P A6,P F1,P E3,P B4,P F3,P A4,P E4,P B3,P F2,P A5,P E5,P E2,P E6","result":"R-0","timertime":120,"timerinc":15,"rating_white":2543,"rating_black":0,"unrated":0,"tournament":0,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860582,"date":1784985509355,"size":6,"player_white":"BerryBot","player_black":"Guest923","notation":"P A6,P F1,P E3,P A5,P B3,P A3,P A4,P B4,P E4,P A2,P C4 C,P A1,M C4 B4 1,M A5 A4 1,P A5,P B5,M A5 A4 1,P A5,P C4,M A5 A4 1,M B4 A4 2,M B5 A5 1,P B4,P B5,P D4,M B5 B4 1,P F3,P B5,M A4 B4 3","result":"R-0","timertime":120,"timerinc":15,"rating_white":2543,"rating_black":0,"unrated":0,"tournament":0,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860581,"date":1784985011757,"size":6,"player_white":"Guest923","player_black":"BerryBot","notation":"P C3,P C2,P D2,P E2,P B2,P D3 C,P A2,P B3,P E3 C,P D1,P F2,M E2 D2 1,P E2,P D4,P D5,P A3,P C4,P E4,P F4,P F3,M F2 F3 1,P E5,M C4 D4 1,P E1,P F1,P F2,M C2 D2 1,M D3 D2 1,M B2 B3 1,P C2,P D3,P B2,P F5,M D2 E2 2,M A2 B2 1,P B4,P E6,M B4 B3 1","result":"0-R","timertime":120,"timerinc":15,"rating_white":0,"rating_black":2543,"unrated":0,"tournament":0,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860580,"date":1784984791257,"size":6,"player_white":"Guest923","player_black":"BerryBot","notation":"P A1,P F6,P B2,P B4,P F5,P E3,P E6,P B5,P D6,P B6,P C6,P C3,P D3,P C5,P C2,P B3,P A6,P D2,P F3,P A3,P A2,P E2,P F2,P F4,P E4,P D4 C,P E1,M D4 D3 1,M E4 F4 1,P D1","result":"0-R","timertime":120,"timerinc":15,"rating_white":0,"rating_black":2543,"unrated":0,"tournament":0,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860579,"date":1784984660377,"size":6,"player_white":"BerryBot","player_black":"Guest923","notation":"P A6,P F6,P E4,P B4,P E3,P A4,P E2,P B3,P F5,P E6,P E1,M E6 F6 1,P E5,P E6,P D5,M E6 E5 1,M F5 E5 1,M F6 E6 2,P D6","result":"R-0","timertime":120,"timerinc":15,"rating_white":2543,"rating_black":0,"unrated":0,"tournament":0,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860578,"date":1784984519998,"size":6,"player_white":"BerryBot","player_black":"Guest923","notation":"P A6,P F6,P E4,P B4,P E3,P B3,P F4,P B2,P E2,P E6,P E1,M E6 F6 1,P D5,P A5,P D6,P D4,P E5","result":"R-0","timertime":120,"timerinc":15,"rating_white":2543,"rating_black":0,"unrated":0,"tournament":0,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860577,"date":1784984308845,"size":6,"player_white":"BerryBot","player_black":"Guest923","notation":"P A6,P B6,P B5,P C4,P B4,P B3,P C3 C,P B2,P C5,P B1,P A5,P D5,P C2,P C6,P C1,P A4,M B4 C4 1","result":"R-0","timertime":120,"timerinc":15,"rating_white":2543,"rating_black":0,"unrated":0,"tournament":0,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860576,"date":1784984186482,"size":6,"player_white":"Paco","player_black":"Tiltak_Bot","notation":"","result":"0-1","timertime":600,"timerinc":20,"rating_white":970,"rating_black":2419,"unrated":0,"tournament":0,"komi":4,"pieces":30,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":1200,"extra_time_trigger":35},{"id":860575,"date":1784983752273,"size":5,"player_white":"Paco","player_black":"BeginnerBot","notation":"P A4,P A2,P B2,P C4,P C3,P E4 C,P D4 C,P D3,P E3,P B4,P B3,M D3 E3 1,P D3,M E3 C3 1 1,M D3 C3 2,M C4 C3 1,P D3,P A3 W,P C4,M C3 B3 3,M B2 B3 1,M B4 B3 1,M C4 C3 1,P D1,M D3 C3 1,P E5,M C3 B3 3,M A3 B3 1,P E2 W,P A1,P E3,P B4,P B1,P C5,P D5,M E5 D5 1,P B2,P D3 W,P C4,M B3 B1 1 3,P C2,P E5,P C1,P B5","result":"0-R","timertime":600,"timerinc":30,"rating_white":981,"rating_black":1109,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-116,"rating_change_black":49,"extra_time_amount":0,"extra_time_trigger":0},{"id":860574,"date":1784983626475,"size":5,"player_white":"CobbleBot","player_black":"Paco","notation":"P E5,P A5,P C4,P D3,P D4,P E4,P B4,P A4,P A3,P E2,P B3,P E1,P E3 C,P C3,M E3 E4 1","result":"R-0","timertime":900,"timerinc":30,"rating_white":1727,"rating_black":982,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":2,"rating_change_black":-5,"extra_time_amount":0,"extra_time_trigger":0},{"id":860573,"date":1784981344591,"size":5,"player_white":"Guest922","player_black":"GravelBot","notation":"P A5,P D1,P C3,P C4 C,P C1,P B1,P B2,P A3,P A1,P B4,M B2 B1 1,P E1,P E2,P D4,M E2 E1 1","result":"R-0","timertime":900,"timerinc":30,"rating_white":0,"rating_black":1396,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860572,"date":1784978069893,"size":5,"player_white":"BeginnerBot","player_black":"Ejoo","notation":"P B1,P E1,P A5,P C3,P E5,P D4,P D5,P C5,P E4,P E2,P B5,P C4,M D5 C5 1,P D5 W,P D1,P B2,P C2 C,P A2,M C5 C3 1 1,P B3 C,P D3,P E3,M C3 C5 1 1,M C4 C3 2,M D3 C3 1,P D3,M C5 C4 1,P C1 W,M E4 D4 1,M D3 D4 1,P D3,M D4 C4 2,P B4,M C4 B4 3,M C3 C4 3,M D4 D3 1,P C3 W,M B4 C4 1,M B4 D4 1 1,M B3 C3 1,P E4","result":"R-0","timertime":600,"timerinc":30,"rating_white":1107,"rating_black":1106,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":26,"rating_change_black":-52,"extra_time_amount":0,"extra_time_trigger":0},{"id":860571,"date":1784977738147,"size":5,"player_white":"Ejoo","player_black":"BeginnerBot","notation":"P A1,P A5,P C3,P B4,P B2,P B1,P D1,P A3,P C2,P E5,P B3,P A2,M B2 A2 1,P B5,M B3 A3 1,P B2,P B3 C,P D2 C,P C4,P D3,P E3,P C5,P D5 W,P E4,P C1,M D3 C3 1,M C4 C3 1,M B2 C2 1,P D3","result":"R-0","timertime":600,"timerinc":30,"rating_white":1093,"rating_black":1110,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":136,"rating_change_black":-29,"extra_time_amount":0,"extra_time_trigger":0},{"id":860570,"date":1784976267671,"size":6,"player_white":"shartok","player_black":"TakticianBot","notation":"P E4,P F1,P D5,P E5,P C6,P D4,P B5,P C5,P B6,P B4","result":"0-1","timertime":1200,"timerinc":30,"rating_white":1000,"rating_black":2173,"unrated":0,"tournament":0,"komi":0,"pieces":30,"capstones":1,"rating_change_white":0,"rating_change_black":0,"extra_time_amount":0,"extra_time_trigger":0},{"id":860569,"date":1784975255801,"size":5,"player_white":"BeginnerBot","player_black":"damax","notation":"P A5,P A1,P C3,P C4,P E1,P E4,P D4 C,P B3 C,P E3,P C2,P D3,M B3 C3 1,P A4 W,P B3,P B5,P C5,M D4 C4 1,P C1,P E5 W,P E2 W,P D5,M E4 E3 1,P E4,P D2,M A4 A5 1,P A3,M E4 E3 1,P D1,P E4,M D1 E1 1,P D1,M D2 D1 1","result":"0-R","timertime":600,"timerinc":30,"rating_white":1114,"rating_black":1153,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-43,"rating_change_black":219,"extra_time_amount":0,"extra_time_trigger":0},{"id":860568,"date":1784973535305,"size":6,"player_white":"IntuitionBot","player_black":"Guest917","notation":"P A1,P F1,P E3,P A2,P D3,P A3,P D4,P E4 C,P D5,P A4,P A5 C,P A6,P F3,P B6,P B5,M B6 B5 1,P D6,P F2,P E2,M E4 E3 1,P D2,M E3 D3 2,P E3,P B6,P B4 W,P D1,P E4,P E1,M F3 F2 1","result":"R-0","timertime":900,"timerinc":30,"rating_white":1632,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":30,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860567,"date":1784973511104,"size":5,"player_white":"AaaarghBot","player_black":"Guest916","notation":"P E1,P E5,P D5,P B5,P D4,P D2,P C4 C,P B4 C,P C3,P C2,P B3,M B4 B3 1,P B2,M C2 B2 1,P B4,M B3 B4 2,P B3,M B2 B3 2,P A3,P B2,M A3 B3 1,M B2 B3 1,P C2,P C1,P B2,M B3 B1 3 2,P B3,M B4 B3 3,P B4,M B3 B4 4,P B3,P A3,M C2 B2 1,M B1 B2 2,P C2,P B1,M C2 B2 1,M B1 B2 1,M B3 B2 1,M B4 B2 1 4,P A4,M B2 B4 1 4,M B3 A3 1","result":"R-0","timertime":60,"timerinc":5,"rating_white":1932,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860566,"date":1784973452389,"size":5,"player_white":"AaaarghBot","player_black":"Guest916","notation":"P A5,P B4,P B5 C,P B2,P A4,P D5,P C4,P D4,P C3,P C2,P D3,P E3,P D2,M E3 D3 1,P D1,M C2 D2 1,M D1 D2 1,M D3 D2 2,P D3,P D1 C,P E3","result":"R-0","timertime":60,"timerinc":5,"rating_white":1932,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860565,"date":1784972992619,"size":5,"player_white":"AaaarghBot","player_black":"Guest916","notation":"P E5,P E1,P C1,P B1 C,P C2,P C4,P B2 C,P A2,P B3,P A3 W,P D1,M A3 B3 1,P A1,M B1 A1 1,P A3,M B3 A3 2,P D4,M C4 D4 1,P C4,M D4 C4 2,P B4,M C4 B4 3,P C4,P A4,P B5,P B3,P C3,M B3 C3 1,M C4 B4 1,M A4 B4 1,M B5 B4 1,P C4 W,M B4 B3 5,M A3 B3 3,M B2 B3 1,P B5 W,M B3 A3 3,P B2 W,M B3 E3 2 2 1","result":"R-0","timertime":60,"timerinc":5,"rating_white":1932,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860564,"date":1784970571520,"size":5,"player_white":"CobbleBot","player_black":"Guest920","notation":"P E5,P A1,P B1,P C1 C,P B2,P C3,P B3,P C5,P B5,P C4,P B4","result":"R-0","timertime":900,"timerinc":30,"rating_white":1727,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0},{"id":860563,"date":1784969407488,"size":5,"player_white":"AaaarghBot","player_black":"Guest916","notation":"P A1,P E5,P B5,P D4,P D5,P C5 C,P C4 C,P C2,P B4,P B2,P E4,M D4 D5 1,P D4,M D5 D4 2,M E4 D4 1,P E4 W,M D4 D2 1 2,M C2 D2 1,M D3 D2 1,P C3 W,P B3,M B2 B3 1,P E2,P D3 W,P A5,P D5,P B2,P A3,P D1,M D3 D2 1,P C1,M B3 B2 2,P B1,M A1 B1 1,M C1 B1 1,M B2 B1 3,P B2,M B1 B2 4,P A2,M A3 A2 1,P B3,P C2,M B3 B2 1,M C2 B2 1,P C2,M B2 C2 2,P B3,M D5 E5 1,M B3 B2 1,M C2 B2 3,P C2 W,M B2 B4 1 4,P C1,M D2 D4 2 2,M B2 B4 1 1,M C3 B3 1,P C3","result":"F-0","timertime":60,"timerinc":5,"rating_white":1932,"rating_black":0,"unrated":0,"tournament":0,"komi":0,"pieces":21,"capstones":1,"rating_change_white":-2000,"rating_change_black":-2000,"extra_time_amount":0,"extra_time_trigger":0}]
        // }

        let url = "https://api.playtak.com/v1/games-history?limit=50"
        for (let [option, value] of Object.entries(options)) {
            if (value != "") {
                url += `&${option}=${value}`            
            }
        }
        
        let resp = await fetch(url)
        if (!resp.ok) {
            return null
        }
        return resp.json().then((json) => {return json.items})
    }
}



export function parseMove(move: Array<string>): number {
    let sq0 = (move[1].charCodeAt(0) - 0x41) | (move[1].charCodeAt(1) - 0x31 << 3)
    if (move[0] == "P") {
        if (move.length > 2){
            return (["F","W","C"].indexOf(move[2]) << 6) | sq0
        }
        return sq0
    } else {
        let m = sq0
        let sq1 = (move[2].charCodeAt(0) - 0x41) | (move[2].charCodeAt(1) - 0x31 << 3)
        let delta = sq1 - sq0
        if ((delta & 0x7) == 0) { //vertical movement
            m |= (delta > 0 ? 1 : 3) << 6
        } else { //horizontal movement
            m |= (delta > 0 ? 0 : 2) << 6
        }

        let drops = 0
        for (let i = 3; i < move.length; i++) {
            let d = parseInt(move[i])
            drops = ((drops << 1) | 1) << (d-1)
        }
        m |= drops << 8

        return m
    }
}

function moveString(move: number): string {
    let s = ""
    let s1 = String.fromCharCode((move & 0x7) + 0x41) + String.fromCharCode(((move >> 3) & 0x7) + 0x31)
    if ((move >> 8) > 0) { //its a spread
        let drops = move >> 8 & 0xFF
        let distance = 1
        let total = 32 - Math.clz32(drops)

        drops = (drops << Math.clz32(drops) - 24) & 0x7F
        while (drops > 0) {
            let t = Math.clz32(drops) - 24
            drops = (drops << t) & 0x7F
            s += " " + t
            distance += 1
            total -= t
        }
        s += " " + total

        let m2 = move + distance * [1,8,-1,-8][move >> 6 & 0x3]
        let s2 = String.fromCharCode((m2 & 0x7) + 0x41) + String.fromCharCode(((m2 >> 3) & 0x7) + 0x31)

        s = `M ${s1} ${s2}${s}`       
    } else { //its a placement
        s = `P ${s1} ${["", "W", "C"][move >> 6]}`
    }

    return s
}