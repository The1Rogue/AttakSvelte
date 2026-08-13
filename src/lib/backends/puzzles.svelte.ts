import { Game, TPSPosition } from "$lib/ingame/game.svelte";
import {type Backend } from "./connector.svelte";
import type { GameData } from "./playtak_stable.svelte";



type Puzzle = {
    startpos: string
    moves: Array<number> //todo, alternate lines?
}

export const puzzle = {
    startpos: TPSPosition.fromTPS("2,x,1,x2/2,1,2,1,x/21,2,2,1C,x/2,x,2C,1,1/x,1,1,212S,x 2 12", 21, 1)[0],
    moves: [0x191, 0x40, 0x683, 0x199, 0x250]
} 

//theres a lot of redundant fluff here, perhaps i could simplify?
//possible splits: chatbackend, onlinebackend, historybackend
export class PuzzleBackend implements Backend {
    name = "Puzzle"
    username = ""

    attempt_login(username: string, password: string): boolean {return true}
    disconnect() {}

    search(game: GameData){}
    acceptGame(id: number){}
    spectate(id: number){}
    send_move(move: number, game: Game){
        let l = game.history.length
        if (move == puzzle.moves[l - 1]) {
            if (l == puzzle.moves.length) {
                game.end(game.data.color + 5)
            } else {
                game.addMove(puzzle.moves[l])
            }
        } else {
            game.undoReq |= 1
        }
    }
    requestUndo(game: Game, retract: boolean){
        if ((game.undoReq & 1) == 1) {
            game.removeLast()
            game.undoReq = 0
        }
    }
    requestDraw(game: Game, retract: boolean){
        //TODO!
    }
    resign(game: Game){
        //TODO!
    }

    shout(msg: string){}
    send_dm(user: string, msg: string){}
    send_room(room: string, msg: string){}
    leave_room(room: string){}

    async get_rating(user: string) {return 0}
    async get_history(options: Object) {return []}
}

