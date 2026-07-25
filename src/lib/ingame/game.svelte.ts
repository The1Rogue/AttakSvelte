
// import type { GameData } from "$lib/socket.svelte"
// import { send, addGame, games} from "$lib/socket.svelte"

import type { GameData } from "$lib/backends/connector.svelte"
import { clientMove } from "$lib/backends/connector.svelte"

//move: number
//
//0x0003F   << 0    position
//0x000C0   << 6    direction
//0x0FF00   << 8    drops
//0x10000   << 16   smash flag
//0x000C0   << 6    piece type  

enum Color {
    Neither = 0,
    White = 1,
    Black = 2,
    Both = 3
}

enum GameState {
    Ongoing,
    Draw,
    FlatWinWhite,
    FlatWinBlack,
    RoadWinWhite,
    RoadWinBlack,
    DefaultWinWhite,
    DefaultWinBlack,
}
export const GameStateStrings = ["0-0", "1/2-1/2", "F-0", "0-F", "R-0", "0-R", "1-0", "0-1"]

enum State {
    None,
    Reserve,
    Pile,
}

enum PieceType {
    Flat,
    Wall,
    Cap,
    FlatOverflow
}

enum Direction {
    None = 0,
    Up = 8,
    Right = 1,
    Down = -8,
    Left = -1
}

type Piece = {
    id: number,
    type: PieceType,
    selected: boolean,
    position: number,
    height: number,
}

export class Game {
    // startPos: 
    data: GameData
    pieces: Array<Piece>
    board: Array<Array<number>>

    gameState: GameState = $state(GameState.Ongoing)

    state: State = State.None
    selectedReserve: number = -1
    selectedPile: Array<number> = []
    startingTile: number = 0
    totals: number = 0
    drops: number = 0
    delta: Direction = Direction.None

    reserve_flats: [number, number] = [0, 0]
    reserve_caps: [number, number] = [0,0]

    history: Array<number> = $state([])
    currentView: number = $state(0)

    timew: number = $state(0)
    timeb: number = $state(0)

    drawReq: number = $state(0)
    undoReq: number = $state(0)

    timer: number = -1;

    highlight: Array<number> = $state([])

    constructor(info: GameData) {
        this.data = info
        this.reserve_flats = [info.flats, info.flats]
        this.reserve_caps = [info.caps, info.caps]

        this.pieces = $state(new Array(info.flats * 2 + info.caps * 2).fill(0).map((_, i) => {
            let type = i < info.caps * 2 ? PieceType.Cap : PieceType.Flat
            return {id: i, type: type, selected: false, position: -1, height: 0}
        }))

        this.board = $state(new Array(8 * 8).fill(0).map(_ => []))
    }

    static idx(x: number, y: number): number { return x | (y << 3)}

    highlightMove(move: number) {
        this.highlight.length = 0
        let idx = move & 0x3F
        if ((move >> 8) == 0) {
            this.highlight.push(this.board[idx][0])
        } else {
            let drops = move >> 8 & 0xFF
            let delta = [1, 8, -1, -8][move >> 6 & 0x3]
            let total = 32 - Math.clz32(drops)              
            drops = (drops << Math.clz32(drops) - 24) & 0x7F
            while (drops > 0) {
                idx += delta
                let t = Math.clz32(drops) - 24
                drops = (drops << t) & 0x7F
                this.highlight.push(...this.board[idx].slice(-t))
                total -= t
            }
            idx += delta
            this.highlight.push(...this.board[idx].slice(-total))
        }
    }

    tick() {
        if (this.gameState != GameState.Ongoing) {clearInterval(this.timer)}
        if ((this.history.length & 1) == 0) {
            this.timew = Math.max(0, this.timew - 1000)
        } else {
            this.timeb = Math.max(0, this.timeb - 1000)
        }
    }

    sendMove(move: number) {
        this.currentView++
        this.history.push(move)
        if (this.data.id > 0) {
            clientMove(move, this.data.id)
        }

        if (this.timer < 0) {
            this.timer = window.setInterval(this.tick.bind(this), 1000)
        }
        this.highlightMove(move)
    }

    addMove(move: number) {
        this.undoReq = 0
        this.history.push(move)
        if (this.timer < 0) {
            this.timer = window.setInterval(this.tick.bind(this), 1000)
        }

        if (this.currentView == this.history.length - 1) {
            this.goto(this.history.length)
        }
    }

    removeLast() {
        this.undoReq = 0
        if (this.currentView == this.history.length) {
            this.undo()
        }
        this.history.pop()
    }

    goto(idx: number) {
        if (idx > this.currentView) {
            while (this.currentView < idx) {
                this.do()
            }
        } else {
            while (this.currentView > idx) {
                this.undo()
            }
        }
    }

    reset() {
        this.reserve_flats = [this.data.flats, this.data.flats]
        this.reserve_caps = [this.data.caps, this.data.caps]

        this.pieces = new Array(this.data.flats * 2 + this.data.caps * 2).fill(0).map((_, i) => {
            let type = i < this.data.caps * 2 ? PieceType.Cap : PieceType.Flat
            return {id: i, type: type, selected: false, position: -1, height: 0}
        })

        this.board = new Array(8 * 8).fill(0).map(_ => [])
        this.currentView = 0
    }

    do() {
        if (this.currentView == this.history.length) {return}
        let move = this.history[this.currentView++]
        let idx = move & 0x3F
        this.highlight.length = 0
        if ((move >> 8) > 0) { //its a spread
            let drops = move >> 8 & 0xFF
            let total = 32 - Math.clz32(drops)
            let hand = this.board[idx].slice(-total)
            this.highlight.push(...this.board[idx].slice(-total))
            this.board[idx] = this.board[idx].slice(0, -total)
            let delta = [1, 8, -1, -8][move >> 6 & 0x3]
            for (let i = total-1; i >= 0; i--) {
                if ((drops >> i & 1) == 1) {
                    idx += delta
                }
                let p = hand.shift() ?? 0
                this.pieces[p].height = this.board[idx].length
                this.board[idx].push(p)
                this.pieces[p].position = idx
            }

            let p = this.pieces[this.board[idx][this.board[idx].length - 2]]
            if (p != undefined && p.type == PieceType.Wall) {
                p.type = PieceType.Flat
                this.history[this.currentView - 1] |= 1<<16 //mark smash for future undos
            }

        } else { //its a placement
            let color = (this.currentView & 1) ^ (this.currentView <= 2 ? 0 : 1)
            let id = 0
            if ((move >> 6) == 2) { 
                id = this.reserve_caps[color]-- * 2 + color - 2
            } else {
                id = (this.data.caps + this.reserve_flats[color]--) * 2 + color - 2
            }
            this.highlight.push(id)
            this.pieces[id].position = idx
            this.board[idx] = [id]
            if ((move >> 6) == 1) {
                this.pieces[id].type = PieceType.Wall
            }
        }
    }

    undo() {
        this.deselect()
        if (this.currentView == 0) {return}
        let move = this.history[--this.currentView]
        let idx = move & 0x3F

        if ((move >> 8) > 0) { //its a spread
            let drops = move >> 8 & 0xFF                    
            let total = 32 - Math.clz32(drops)              
            let delta = [1, 8, -1, -8][move >> 6 & 0x3]     
            let current = idx + delta                       

            drops = (drops << Math.clz32(drops) - 24) & 0x7F
            while (drops > 0) {
                let t = Math.clz32(drops) - 24
                drops = (drops << t) & 0x7F
                let hand = this.board[current].slice(-t)
                hand.forEach((piece, i) => {
                    this.pieces[piece].position = idx
                    this.pieces[piece].height = this.board[idx].length + i
                });
                this.board[idx].push(...hand)
                this.board[current] = this.board[current].slice(0, -t)
                total -= t
                current += delta
            }
            let hand = this.board[current].slice(-total)
            hand.forEach((piece, i) => {
                this.pieces[piece].position = idx
                this.pieces[piece].height = this.board[idx].length + i
            });
            this.board[idx].push(...hand)
            this.board[current] = this.board[current].slice(0, -total)

            if ((move >> 16) == 1) {
                this.pieces[this.board[current][this.board[current].length-1]].type = PieceType.Wall
            }

        } else { //its a placement
            let p = this.board[idx][0]
            this.board[idx] = []
            if (this.pieces[p].type == PieceType.Cap){
                this.reserve_caps[p & 1]++
            } else {
                this.reserve_flats[p & 1]++
            }
            if (this.pieces[p].type == PieceType.Wall) {
                this.pieces[p].type = PieceType.Flat
            }
            this.pieces[p].position = -1
            this.pieces[p].height = 0
        }

        //find highlights
        if (this.currentView > 0) {
            this.highlightMove(this.history[this.currentView - 1])
        } else {
            this.highlight.length = 0   
        }
    }

    canPlay(): boolean {
        //viewing last ply and controls current player
        return this.currentView == this.history.length && ((this.data.color >> (this.currentPly() & 1)) & 1) == 1
    }

    currentPly(): number {
        return this.history.length
    }

    deselect() {
        if (this.state == State.Reserve) {
            this.pieces[this.selectedReserve].selected = false
            if (this.pieces[this.selectedReserve].type == PieceType.Wall) {
                this.pieces[this.selectedReserve].type = PieceType.Flat
            }

        } else if (this.state == State.Pile) {
            this.selectedPile.forEach((i, idx) => {
                this.pieces[i].selected = false
                this.pieces[i].position = this.startingTile
                this.pieces[i].height = this.board[this.startingTile].length - this.selectedPile.length + idx
            })
        }
        this.state = State.None
    }

    moveAndDrop(): boolean {
        let distance = (((this.drops & 0x7F) * 0x204081 & 0x1111111) % 0xF) + (this.drops >> 7)
        let currentTile = this.startingTile + this.delta * distance
        if ((currentTile & 0x7) == 0x7 && this.delta == 1 || (currentTile & 0x7) == 0 && this.delta == -1) {return false;} //prevent connecting left/right side of board


        let next = currentTile + this.delta
        let smash = false

        if (this.board[next].length > 0) {
            let toppiece = this.pieces[this.board[next][this.board[next].length - 1]].type

            if (toppiece == PieceType.Wall && this.pieces[this.selectedPile[this.totals]].type == PieceType.Cap) {
                smash = true
                this.pieces[this.board[next][this.board[next].length - 1]].type = PieceType.Flat
            } else if (toppiece != PieceType.Flat) {
                //cant move, noble in the way
                return false
            }
        }

        this.pieces[this.selectedPile[this.totals]].selected = false
        for (let i = this.totals; i < this.selectedPile.length; i++) {
            this.pieces[this.selectedPile[i]].position = next
            this.pieces[this.selectedPile[i]].height = this.board[next].length + i - this.totals
        }
        this.totals += 1
        this.drops |= 1 << (this.selectedPile.length - this.totals)
        if (this.totals == this.selectedPile.length) {
            this.state = State.None
            this.board[this.startingTile] = this.board[this.startingTile].slice(0, -this.totals)
            for (let i of this.selectedPile) {
                this.board[this.pieces[i].position].push(i)
            }
            this.sendMove(((smash ? 1 : 0) << 16) | (this.drops << 8) | ([1,8,-1,-8].indexOf(this.delta) << 6) | this.startingTile)
        }
        return true
    }

    clickReserveBar() {
        if (!this.canPlay()) {return;}
        let c = this.currentPly()
        this.clickReserve(((c & 1) ^ (c < 2 ? 1 : 0)) + 1, PieceType.Flat)
    }

    clickReserve(color: Color, type: PieceType) {
        if (!this.canPlay()) {return;}

        let c = this.currentPly()

        if ((color != (c % 2 + 1)) != (c < 2)) { // correct color + swap opening
            this.deselect()
            return
        }

        if (type == PieceType.Cap && c < 2) {
            this.deselect()
            return
        }

        let id = (type == PieceType.Cap ? this.reserve_caps[color - 1] : this.data.caps + this.reserve_flats[color - 1]) * 2 + color - 3

        if (this.state == State.None) {
            this.state = State.Reserve
            this.selectedReserve = id
            this.pieces[id].selected = true

        } else if (this.state == State.Reserve) {
            if (this.selectedReserve == id) {
                if (type == PieceType.Cap || c < 2) {
                    this.deselect()
                } else if (this.pieces[id].type == PieceType.Wall) {
                    this.deselect()
                } else {
                    this.pieces[id].type = PieceType.Wall
                }
            } else {
                this.deselect()
                this.selectedReserve = id
                this.pieces[id].selected = true
                this.state = State.Reserve
            }

        } else {
            this.deselect()
            this.selectedReserve = id
            this.pieces[id].selected = true
            this.state = State.Reserve
        }
    }

    clickPile(x: number, y: number) {
        //TODO prevent pickup turn 1
        if (!this.canPlay()) {return;}

        let idx = Game.idx(x, y)
        let pile = this.board[idx]


        if (this.state == State.None) {
            if (pile.length == 0 || this.currentPly() < 2) { return }
            if ((pile[pile.length - 1] & 1) != (this.currentPly() & 1)) { return }

            this.state = State.Pile
            this.selectedPile = pile.slice(-this.data.size)
            this.startingTile = idx
            this.totals = 0
            this.drops = 0
            this.delta = Direction.None
            for (let i of this.selectedPile) {
                this.pieces[i].selected = true
            }
        }
        else if (this.state == State.Reserve) {
            if (pile.length == 0) {
                this.pieces[this.selectedReserve].selected = false
                this.state = State.None
                this.board[idx] = [this.selectedReserve]
                this.pieces[this.selectedReserve].position = idx
                this.pieces[this.selectedReserve].height = 0
                if (this.pieces[this.selectedReserve].type == PieceType.Cap) {
                    this.reserve_caps[this.selectedReserve & 1] -= 1
                } else {
                    this.reserve_flats[this.selectedReserve & 1] -= 1
                }
                
                this.sendMove((this.pieces[this.selectedReserve].type << 6) | idx)
                    
            } else {
                this.deselect()
                this.state = State.Pile
                this.selectedPile = pile.slice(-this.data.size)
                this.startingTile = idx
                this.totals = 0
                this.drops = 0
                for (let i of this.selectedPile) {
                    this.pieces[i].selected = true
                }
            }
        }
        else {
            //counts 1 bits set, just 6 ops (no for loop needed)
            //1 bits represent stack moves
            let distance = (((this.drops & 0x7F) * 0x204081 & 0x1111111) % 0xF) + (this.drops >> 7)
            let currentTile = this.startingTile + this.delta * distance

            if (idx == currentTile && this.delta == Direction.None) {
                this.pieces[this.selectedPile.shift() ?? 0].selected = false
                if (this.selectedPile.length == 0) {
                    this.state = State.None
                    //TODO cleanup?
                }

            } else if (idx == currentTile) {
                //TODO drop without move
                this.pieces[this.selectedPile[this.totals]].selected = false
                this.totals += 1
                if (this.totals == this.selectedPile.length) {
                    this.state = State.None
                    this.board[this.startingTile] = this.board[this.startingTile].slice(0, -this.totals)
                    for (let i of this.selectedPile) {
                        this.pieces[i].height = this.board[this.pieces[i].position].length
                        this.board[this.pieces[i].position].push(i)
                    }
                    this.sendMove((this.drops << 8) | ([1,8,-1,-8].indexOf(this.delta) << 6) | this.startingTile)
                }

            } else if (idx == currentTile + this.delta) {
                if (!this.moveAndDrop()) {
                    this.deselect()
                }

            } else if (this.delta == Direction.None && [1,8,-1,-8].includes(idx - this.startingTile)) {
                this.delta = idx - this.startingTile
                if (!this.moveAndDrop()) {
                    this.delta = Direction.None
                    this.deselect()
                }

            } else {
                //invalid position
                this.deselect()
            }
        }
    }
}

export function moveString(move: number): string {
    let s = String.fromCharCode((move & 0x7) + 0x61) + String.fromCharCode(((move >> 3) & 0x7) + 0x31)

    if ((move >> 8) > 0) { //its a spread
        s += [">", "+", "<", "-"][move >> 6 & 0x3]
        let drops = move >> 8 & 0xFF
        let total = 32 - Math.clz32(drops)
        if (total > 1) {s = total + s}

        drops = (drops << Math.clz32(drops) - 24) & 0x7F
        if (drops != 0) {
            while (drops > 0) {
                let t = Math.clz32(drops) - 24
                drops = (drops << t) & 0x7F
                s += t
                total -= t
            }
            s += total
        }

        if (move >> 16 == 1) {
            s += "*"
        }
        
    } else { //its a placement
        s = ["", "S", "C"][move >> 6] + s
    }

    return s
}

export function parsePtn(s: string): number {
    let start = s.charCodeAt(0)
    let sq
    if (start > 0x60 && start < 0x68) {//a-h
        let x = start - 0x61
        let y = s.charCodeAt(1) - 0x31
        sq = x | (y << 3)
    } else {
        let x = s.charCodeAt(1) - 0x61
        let y = s.charCodeAt(2) - 0x31
        sq = x | (y << 3)
        s = s.slice(1)
    }



    if (start == 0x53) {//S
        return sq | (PieceType.Wall << 6)
    } else if (start == 0x43) {//C
        return sq | (PieceType.Cap << 6)
    } else if (s.length == 2) {
        return sq | (PieceType.Flat << 6)
    } else {
        let dir = [">","+","<","-"].indexOf(s.charAt(2))
        
        if (s.charAt(s.length - 1) == "*") {
            sq |= 1 << 16
            s = s.slice(0, -1)
        }

        let drops = 0
        if (s.length == 3) {
            if (start < 0x40) {
                drops = 1 << (start - 0x31)
            } else {
                drops = 1
            }
        } else {
            let total = 0
            for (let i = 3; i < s.length; i++) {
                let c = s.charCodeAt(i) - 0x30
                drops |= 1 << 8-total
                total += c
            }
            drops = (drops >> (9-total)) & 0xFF
        }
      
        return sq | (dir << 6) | (drops << 8)
    }

    return 0
}

// addGame( new Game({
//     id: 0,
//     p1: "White",
//     p2: "Black",
//     size: 6,
//     time: 0,
//     inc: 0,
//     extra: 0,
//     trigger: 0,
//     color: 3,
//     halfkomi: 2,
//     flats: 30,
//     caps: 1,
//     rated: false,
//     tourney: false
// }))


// let moves: Array<string> = [
// "f6", "e6",
// "d4", "d3",
// "e4", "f4",
// "f5", "Ce5",
// "f3", "d5",
// "c4", "c5",
// "b4", "b5",
// "a4", "e5-",
// "Ce5", "a5",
// "e5<", "a5-",
// "e5", "c3",
// "a5", "2e4<",
// "e4", "e3",
// "f2", "b3",
// "f1", "e3+",
// "f3+", "Sf3",
// "c6", "f3+",
// "a5-", "2f4+",
// "e5-", "3d4>",
// "2d5>11*", "e3",
// "a3", "a2",
// "a3>", "a5",
// "c6-", "Sd5",
// "d6", "b2",
// "3f5-12", "4e4>",
// "2f3<11", "e2",
// "f5+"]

// for (let move of moves) {
//     let m = parsePtn(move)
//     games[0].addMove(m)
// }
