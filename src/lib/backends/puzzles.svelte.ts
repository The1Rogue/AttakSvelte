import { Game, TPSPosition } from "$lib/ingame/game.svelte";
import type { GameBackend } from "./connector.svelte";
import type { GameData } from "./playtak_stable.svelte";



type Puzzle = {
    startpos: TPSPosition
    moves: Array<number> //todo, alternate lines?
}

export const puzzle = {
    startpos: TPSPosition.fromTPS("2,x,1,x2/2,1,2,1,x/21,2,2,1C,x/2,x,2C,1,1/x,1,1,212S,x 2 12", 21, 1)[0],
    moves: [0x191, 0x40, 0x683, 0x199, 0x250]
} 

class PuzzleBackend implements GameBackend {   
    requestGame(game: GameData) {}
    
    send_move(move: number, game: Game) {
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

    requestUndo(game: Game, retract: boolean) {
        if ((game.undoReq & 1) == 1) {
            game.removeLast()
            game.undoReq = 0
        }
    }
    requestDraw(game: Game, retract: boolean) {
        //TODO!
    }
    resign(game: Game) {
        //TODO!
    }
}

export const puzzleBackend = new PuzzleBackend()

export const daily = new Game({
    id: 1,
    p1: (puzzle.startpos.ply & 1) == 0 ? "You" : "Opponent",
    p2: (puzzle.startpos.ply & 1) == 0 ? "Opponent" : "You",
    color: (puzzle.startpos.ply & 1) + 1,
    size: 5, //TODO
    time: 0,
    inc: 0,
    halfkomi: 2,
    flats: 21, //TODO
    caps: 1, //TODO
    rated: false,
    tourney: false,
    trigger: 0,
    extra: 0,
}, puzzle.startpos, puzzleBackend)