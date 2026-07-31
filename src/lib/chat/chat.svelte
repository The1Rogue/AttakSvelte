
<script lang="ts">
    import { leave_room } from "$lib/backends/connector.svelte";
    import { sendChat, chats } from "$lib/chat/chats.svelte";
	import { tick } from 'svelte';

    let {room, chat} = $props()
    let current_msg = $state("")
    let open = $state(false) //todo this aint enough

    let div: HTMLElement;

    function hash(s: string) {
        let hash = 0;
        for (const char of s) {
            hash = (hash << 5) - hash + char.charCodeAt(0);
            hash &= 0xFF; // Constrain to 32bit integer
        }
        return hash;
    }

    $effect.pre(()=>{
        chat[1].length
        if (!div) return

		if (div.offsetHeight + div.scrollTop > div.scrollHeight - 20) {
			tick().then(() => {
				div.scrollTo(0, div.scrollHeight);
                chat[2] = false;
			});
		}
    })
</script>


<details class="room">
    <summary onclick={() => {open = !open}}>
        {chat[0] == 1 ? room.split("-").join(" vs. ") : room}
        <div style="flex-grow:1;"></div>
        {#if chat[2] && !open}<div class="notif"></div>{/if}
        
        {#if chat[0] != 0}
            <button class="close material-symbols-outlined" onclick={() => {
                delete chats[room]
                if (chat[0] == 1) {
                    leave_room(room)
                }
            }}>close</button>
        {/if}
    </summary>
</details>
<div bind:this={div} style:max-height={open ? "100%" : "0"}>
    <p></p>
    {#each chat[1] as [user, msg]}
        <p>&lt<strong style="color: hsl({hash(user)} 100% 65%)">{user}</strong>&gt {msg}</p>
    {/each}
    <form onsubmit={(e) => {
            e.preventDefault()
            sendChat(room, current_msg)
            current_msg = ""
            setTimeout(() => {this[0].focus()}, 10) //maintain focus on input
        }}>
        <input placeholder=">" bind:value={current_msg}/>
        <button class="material-symbols-outlined">Send</button>
    </form> 
</div>
<style>

.room > summary {
    display: flex;
    padding: .3em 1em;
    list-style: none;
    color: var(--textLight);
    background: var(--accent);
    border-radius: 5px;
}

.room[open] > summary {
    color: var(--textDark);
    background: var(--primary);
    border-radius: 5px 5px 0 0;
}

.room + div {
    flex-grow: 1;
    height: 0;
    color: var(--textLight);
    overflow-y: scroll;
    transition: max-height .4s ease-in-out;
    display: flex;
    flex-direction: column;
}


.room + div > p {
    margin: .15em .15em;
}

.room + div :nth-last-child(2) {
    flex-grow: 1;
}

.room + div > form {
    position: sticky;
    bottom: 0;
    width: 100%;
    border-width: 0;

    display: flex;
    input {
        background-color: var(--accent);
        border-radius: 5px 0 0 5px;
    }
    button {
        border-width: 0 0 1px;
        border-radius: 0 5px 5px 0;
        padding: .3em;
        font-size: 1em;
    }
}

.notif {
    border: solid 5px #ff0000;
    border-radius: 50%;
    width: 0;
    height: 0;
}

.close {
    font-size: 1em;
}


</style>