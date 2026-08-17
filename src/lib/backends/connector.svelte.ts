
import { goto } from "$app/navigation"
import { Game } from "$lib/ingame/game.svelte"
import { addToast } from "$lib/ui/toast.svelte"
import { playtakStableBackend } from "./playtak_stable.svelte"

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

export interface ChatBackend {
    shout: (msg: string) => void,
    send_dm: (user: string, msg: string) => void,
    send_room: (room: string, msg: string) => void,
    leave_room: (room: string) => void,
}

export interface OnlineBackend {
    username: string,
    connected: boolean,

    attempt_login: (username: string, password: string) => boolean,
    disconnect: () => void,

    acceptGame: (id: number) => void,
    spectate: (id: number) => void,
    
    get_rating: (user: string) => Promise<number>,
    get_history: (options: Object) => Promise<Array<Object>>,
}

export interface GameBackend {
    requestGame: (game: GameData) => void,
    send_move: (move: number, game: Game) => void,

    requestUndo: (game: Game, retract: boolean) => void,
    requestDraw: (game: Game, retract: boolean) => void,
    resign: (game: Game) => void,
}


const ACTIVE_BACKEND = playtakStableBackend

// const backends: Array<OnlineBackend> = [playtakStableBackend]

// let active_backend: number = $state(-1)

let rating_cache: {[key: string]: number} = {}
export let games: Array<Game>                      = $state([])
export let ongoing: {[key: number]: GameData}      = $state({})
export let player_seeks: {[key: number]: GameData} = $state({})
export let bot_seeks: {[key: number]: GameData}    = $state({})

export function getUsername(): string {
    return ACTIVE_BACKEND.username
}

export function isConnected(): boolean {
    return ACTIVE_BACKEND.connected
}

export function connect(username: string, password: string) {
    if (isConnected()) {
        addToast("You are already connected", false)
        return
    }

    if (!ACTIVE_BACKEND.attempt_login(username, password)) {
        addToast("Failed To Login", true) //TODO toast already added by backend itself?
    }
}

export function disconnect() {
    if (!ACTIVE_BACKEND.connected) { return }

    games.length = 0
    for (const id in ongoing) {delete ongoing[id]}
    for (const id in player_seeks) {delete player_seeks[id]}
    for (const id in bot_seeks) {delete bot_seeks[id]}

    //clean rating cache?
    
    goto("/")

    ACTIVE_BACKEND.disconnect()
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

export function shout(msg: string) {
    playtakStableBackend.shout(msg)
}

export function send_dm(user: string, msg: string) {
    playtakStableBackend.send_dm(user, msg)
}

export function send_room(room: string, msg: string) {
    playtakStableBackend.send_room(room, msg)
}

export function leave_room(room: string) {
    playtakStableBackend.leave_room(room)
}

export function search(game: GameData) {
    ACTIVE_BACKEND.requestGame(game)
}

export function acceptGame(id: number) {
    ACTIVE_BACKEND.acceptGame(id)
}

export function spectate(id: number) {
    if (games.find((e) => e.data.id == id)) {return}
    ACTIVE_BACKEND.spectate(id)
}

export async function get_rating(user: string) {
    let r = rating_cache[user]
    if (r == undefined) {
        r = await ACTIVE_BACKEND.get_rating(user)
        rating_cache[user] = r
    }
    return r
}

export async function get_history(options: Object) {
    return ACTIVE_BACKEND.get_history(options)
}