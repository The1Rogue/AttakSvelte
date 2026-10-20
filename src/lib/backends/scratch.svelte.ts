import { addGame, type GameBackend, type GameData } from "./connector.svelte";
import { Game } from "$lib/ingame/game.svelte";

class ScratchBackend implements GameBackend {
    requestGame(game: GameData) {
        addGame(new Game(game, this))
    }

    send_move(move: number, game: Game) {
        let currentplayer = game.currentPly() & 1
        if (game.hasRoad(1 - currentplayer)) {
            game.end(5 - currentplayer)
        } else if (game.hasRoad(currentplayer)) {
            game.end(4 + currentplayer)
        }

        if ((game.reserve_flats[0] == 0 && game.reserve_caps[0] == 0) ||
        (game.reserve_flats[1] == 0 && game.reserve_caps[1] == 0) ||
        game.open_space() == 0) {
            let [w, b] = game.flat_counts()
            if (w > (b + game.data.halfkomi / 2)) {
                game.end(2)
            } else if (w < (b + game.data.halfkomi / 2)) {
                game.end(3)
            } else {
                game.end(1)
            }
        }

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
