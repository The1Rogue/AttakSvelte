
import { shout, send_dm, send_room } from "$lib/backends/connector.svelte"

enum RoomType {
    Global = 0, 
    Room = 1,
    Direct = 2,
}

export let chats: {[key: string]: [RoomType, Array<[string, string]>, boolean]} = $state({})

export function addMsg(from: string, room: string, msg: string) {
    if (chats[room] == undefined) {
        if (from == room) {
            chats[room] = [RoomType.Direct, [], false]
        } else if (room == "Global") {
            chats[room] = [RoomType.Global, [], false]
        } else {
            chats[room] = [RoomType.Room, [], false]
        }
    }

    chats[room][1].push([from, msg])
    chats[room][2] = true
}

export function addRoom(room: string) {
    if (chats[room]) {return}
    chats[room] = [RoomType.Room, [], false]
}

export function addDirect(user: string) {
    if (chats[user]) {return}
    chats[user] = [RoomType.Direct, [], false]
}

export function sendChat(room: string, msg: string) {
    if (msg == "") {return}

    let type = chats[room][0]
    if (type == RoomType.Global) {
        shout(msg)
    } else if (type == RoomType.Direct) {
        send_dm(room, msg)
    } else if (type == RoomType.Room) {
        send_room(room, msg)
    } else {
        console.log(`Tried sending message in ${room}, which is unknown`)
    }
}

chats["Global"] = [RoomType.Global, [], false]
