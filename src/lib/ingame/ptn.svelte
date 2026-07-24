<script lang="ts">
    import { requestDraw, requestUndo, resign } from "$lib/backends/connector.svelte";
    let { game } = $props()
    import { moveString } from "$lib/ingame/game.svelte"
    let w = $state(1)
    let h = $state(1)
    let a = $derived(w / h)



    function undoButton() {
        if (game.history.size <= 0) {return}
        if (game.data.color == 3) {
            game.removeLast()
        } else if (game.data.id <= 0) {
            //TODO
        } else {
            requestUndo(game.data.id, (game.undoReq & 2) != 0)
        }
    }

    function resignButton() {
        if (game.data.id > 0) {
            resign(game.data.id)
        }
    }

    function drawButton() {
        if (game.data.id > 0) {
            requestDraw(game.data.id, (game.drawReq & 2) != 0)
        }
    }

</script>

<svelte:window bind:outerHeight={h} bind:outerWidth={w}/>

<div class="holder">
{#if game.data.color != 0}
    <div class="metabuttons">
        <button class="material-symbols-outlined" style:background={["", "#5397f4", "#9F7F00", ""][game.undoReq]} onclick={() => undoButton()}>undo</button>
        <button class="material-symbols-outlined" onclick={() => resignButton()}>flag</button>
        <button class="material-symbols-outlined" style:background={["", "#5397f4", "#9F7F00", ""][game.drawReq]} onclick={() => drawButton()}>handshake</button>
    </div>
{/if}
{#if a > 1}
    <div class="large navigator">
        {#each game.history as ply, i}
            {#if (i & 1) == 0}
            <p> {(i >> 1) + 1}. </p>
            {/if}
            <button onclick={() => game.goto(i+1)} class={[
                "ply",
                (i < 2) == ((i & 1) == 0) ? "black" : "white",
                i >= game.currentView ? 'future' : 'past'
            ]}>
                {moveString(ply)}
            </button>
        {/each}
    </div>
{:else}
    <div class="small navigator">
        <button class="material-symbols-outlined" onclick={() => game.reset()}>keyboard_double_arrow_left</button>
        <button class="material-symbols-outlined" onclick={() => game.undo()}>keyboard_arrow_left</button>
        {#if game.currentView > 0}
            <p class={["ply", "past", (((game.currentView & 1) == 0) == game.currentView <= 2) ? "white" : "black"]}>
                &nbsp{(game.currentView + 1 >> 1)}. {moveString(game.history[game.currentView - 1])}&nbsp
            </p>
        {:else}
            <p class={["ply", "past", (game.currentView & 1) == 0 ? "white" : "black"]}> &nbsp1. -&nbsp </p>
        {/if}
        <button class="material-symbols-outlined" onclick={() => game.do()}>keyboard_arrow_right</button>
        <button class="material-symbols-outlined" onclick={() => game.goto(game.history.length)}>keyboard_double_arrow_right</button>
    </div>
{/if}
</div>

<style>
    .holder {
        display: flex;
        flex-direction: column;
    }

    .metabuttons {
        background: var(--panel);
        border-radius: .7em;
        margin: 3px 3px 0;
        display: flex;
        padding: 1px;


        button {
            font-size: 2em;
            padding: 0 .2em;
        }
    }
 
    .small {
        display: flex;
        justify-content: space-around;
        padding: 1px;
    }

    .large {
        flex-grow: 1;
        min-width: 10vw;
        display: grid;
        grid-template-columns: auto 1fr 1fr;
        align-content: start;
        overflow: scroll;  
        padding: .1em;
    }

    .navigator {
        background: var(--panel);
        border-radius: .7em;
        margin: 3px;
    }

    button {
        margin: 2px;
        flex-grow: 1;
        border-radius: .35em;
    }

    p {
        color: var(--textLight);
        margin: auto 5px;
        line-height: 1;
    }


    .ply {
        min-width: 20%;
        text-align: center;
        margin: 2px;
        padding: 4px 3px;
        border-radius: .5em;
        border-width: 1px;
        border-style: solid;
    }

    .white.past {
        border-color: var(--player1);
        background: var(--player1);
        color: var(--player2);
    }
    .white.future {
        border-color: var(--player1);
        background: 0;
        color: var(--textLight);
    }

    .black.past {
        border-color: var(--player2);
        background: var(--player2);
        color: var(--player1);
    }
    .black.future {
        border-color: var(--player2);
        background: 0;
        color: var(--textLight);
    }

    .future:hover {
        background: var(--accent);
    }


</style>