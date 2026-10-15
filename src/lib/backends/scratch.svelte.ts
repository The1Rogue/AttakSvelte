import { addGame, type GameBackend, type GameData } from "./connector.svelte";
import { Game } from "$lib/ingame/game.svelte";

class ScratchBackend implements GameBackend {
    requestGame(game: GameData) {
        addGame(new Game(game, this))
    }

    send_move(move: number, game: Game) {
        //TODO game end checks
    }

    requestUndo(game: Game, retract: boolean) {
        game.removeLast()
    }

    requestDraw(game: Game, retract: boolean) {
        game.end(1)
    }

    resign(game: Game) {
        game.end((game.currentPly() & 1) == 0 ? 7 : 6)
    }
    
}

export const scratchBackend = new ScratchBackend()
