
import { goto } from "$app/navigation"
import { Game } from "$lib/ingame/game.svelte"
import { addToast } from "$lib/ui/toast.svelte"
import { PlaytakStable } from "./playtak_stable.svelte"

enum Color {
    Neither = 0,
    White = 1,
    Black = 2,
    Both = 3
}

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

export interface Backend {
    name: string,
    username: string,

    attempt_login: (username: string, password: string) => boolean,
    disconnect: () => void,

    search: (game: GameData) => void,
    acceptGame: (id: number) => void,
    spectate: (id: number) => void,
    send_move: (move: number, gameID: number) => void,

    requestUndo: (id: number, retract: boolean) => void,
    requestDraw: (id: number, retract: boolean) => void,
    resign: (id: number) => void,

    shout: (msg: string) => void,
    send_dm: (user: string, msg: string) => void,
    send_room: (room: string, msg: string) => void,
    leave_room: (room: string) => void,

    get_rating: (user: string) => Promise<number>,
    get_history: (options: Object) => Promise<Array<Object>>,
}

const backends: Array<Backend> = [new PlaytakStable()]

let active_backend: number = $state(-1)

let rating_cache: {[key: string]: number} = {}
export let games: Array<Game>                      = $state([])
export let ongoing: {[key: number]: GameData}      = $state({})
export let player_seeks: {[key: number]: GameData} = $state({})
export let bot_seeks: {[key: number]: GameData}    = $state({})

export function getUsername(): string {
    if (active_backend < 0) {return ""}
    return backends[active_backend].username
}

export function isConnected(): boolean {
    return active_backend >= 0
}

export function connect(backend: number, username: string, password: string) {
    if (active_backend >= 0) {
        return //TODO
    }

    if (backends[backend].attempt_login(username, password)) {
        active_backend = backend
    } else {
        addToast("Failed To Login", true) //TODO toast already added by backend itself?
    }
}

export function disconnect() {
    if (active_backend < 0) { return }

    games.length = 0
    for (const id in ongoing) {delete ongoing[id]}
    for (const id in player_seeks) {delete player_seeks[id]}
    for (const id in bot_seeks) {delete bot_seeks[id]}

    //clean rating cache? seems inpractical but might be needed if switching backend    
    
    goto("/")

    backends[active_backend].disconnect()
    active_backend = -1
}

export function addGame(game: Game) {
    //TODO checks for  //this comment left by me at one point seems unfinished... not sure what im supposed to be checking....

    if (games.find((e) => e.data.id == game.data.id && e.backend == game.backend)) {
        goto("/game")
        return //replace instead??
    }

    games.push(game)
    goto("/game")
}

export function getGame(id: number): Game | undefined {
    return games.find((e) => e.data.id == id)
}

export function closeGame(id: number) {
    let idx = games.findIndex((e) => e.data.id == id)
    if (idx < 0) {return }
    games.splice(idx, 1)
    if ( games.length <= 0 ) {
        goto("/")
    }
}

export function requestUndo(id: number, retract: boolean) {
    if (id <= 0) {return}
    let g = getGame(id)
    if (g == undefined) {return}
    g.undoReq ^= 2

    backends[active_backend].requestUndo(id, retract)
}

export function requestDraw(id: number, retract: boolean) {
    if (id <= 0) {return}
    let g = getGame(id)
    if (g == undefined) {return}
    g.drawReq ^= 2
    backends[active_backend].requestDraw(id, retract)
}

export function resign(id: number) {
    backends[active_backend].resign(id)
}

export function shout(msg: string) {
    backends[active_backend].shout(msg)
}

export function send_dm(user: string, msg: string) {
    backends[active_backend].send_dm(user, msg)
}

export function send_room(room: string, msg: string) {
    backends[active_backend].send_room(room, msg)
}

export function leave_room(room: string) {
    backends[active_backend].leave_room(room)
}

export function search(game: GameData) {
    backends[active_backend].search(game)
}

export function acceptGame(id: number) {
    backends[active_backend].acceptGame(id)
}

export function spectate(id: number) {
    if (games.find((e) => e.data.id == id)) {return}
    backends[active_backend].spectate(id)
}

export async function get_rating(user: string) {
    let r = rating_cache[user]
    if (r == undefined) {
        r = await backends[active_backend].get_rating(user)
        rating_cache[user] = r
    }
    return r
}

export async function get_history(options: Object) {
    return backends[0].get_history(options)
    // return backends[active_backend].get_history()
}