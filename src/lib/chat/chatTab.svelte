
<script lang="ts">
    import { chats } from "$lib/chat/chats.svelte"
    import Chat from "$lib/chat/chat.svelte"


</script>

<div id="chat">
    <details class="sidebutton">
    <summary>
        <!-- <svg viewBox="0 0 24 24"><path d="M20,2A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H6L2,22V4C2,2.89 2.9,2 4,2H20M11,6V9H8V11H11V14H13V11H16V9H13V6H11Z"></path></svg> -->
        <p class="material-symbols-outlined">chat</p>
        {#if Object.values(chats).some((chat) => chat[2])}
            <div class="notif"></div>
        {/if}
    </summary>
    </details>
    <div>
        {#each Object.entries(chats) as [room, chat] (room)}
            <Chat room={room} chat={chat}/>
        {/each}
    </div>
</div>

<style>
#chat {
    z-index: 100;
    position: fixed;
    display: flex;
    right: 0;
    bottom: 5vh;
    overflow:hidden;
    align-items: end;
    pointer-events: none;
}

#chat > div {
    display: flex;
    flex-direction: column;
    pointer-events: all;
    width: 0;
    background: var(--ui);
    border-style: solid;
    border-radius: 5px;
    border-width: 0;
    border-color: var(--accent);
    height: 80vh;
    transition: width 400ms ease-out, border 0s linear 400ms;
}


#chat > .sidebutton[open] + div {
    width: min(24em, calc(100vw - 50px));
    border-width: 1px;
    transition: width 400ms ease-out, border 0s linear;
}

#chat > .sidebutton > summary {
    pointer-events: all;
    margin: 10px 0;
    border-radius: 5px 0 0 5px;
    height: 32px;
    background: var(--primary);
    list-style: none;
    padding: 3px;
    transition: padding var(--animSpeed);
    p {
        color: var(--textDark);
        font-size: 2em;
        margin: calc(16px - .5em) 2px;
    }
}

#chat > .sidebutton > summary:hover {
    padding-right: 10px;
    background: var(--accent);
    p {
        color: var(--textLight);
    }
}

.notif {
    border: solid 5px #ff0000;
    border-radius: 50%;
    width: 0;
    height: 0;
    position: absolute;
    bottom: 42px;
    left: 0px;
}


</style>