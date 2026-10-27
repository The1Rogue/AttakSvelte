<script lang="ts">
    let { game, small } = $props()
    import { moveString } from "$lib/ingame/game.svelte"
    import Board from "./board.svelte";
    import GameInfo from "./gameInfo.svelte";

    let startply = game.startPos == undefined ? 0 : game.startPos.ply

    let showMenu = $derived(game.gameState > 0)
    let timew = $derived((game.timew / 60000 | 0) + ":" + ("" + ((game.timew / 1000 | 0) % 60)).padStart(2, "0"))
    let timeb = $derived((game.timeb / 60000 | 0) + ":" + ("" + ((game.timeb / 1000 | 0) % 60)).padStart(2, "0"))

    function undoButton() {
        if (game.history.length <= 0) {return}
        game.undoReq ^= 2
        game.backend.requestUndo(game, (game.undoReq & 2) == 0)
    }

    function drawButton() {
        game.drawReq ^= 2
        game.backend.requestDraw(game, (game.drawReq & 2) == 0)
    }

    function onKeyDown(e: KeyboardEvent) {
        switch(e.keyCode) {
            case 8:
                game.reset()
                break;
            case 37:
                game.undo()
                break;
            case 39:
                game.do()
                break;
        }
    }

</script>

<div class="holder" style:--size={game.data.size} style:flex-direction={small ? "column": "row-reverse"} tabindex=0 onkeydown={onKeyDown}>
    <div class="left">
        <div class="slot">
            <div class="head">
                {#if game.timew > 0 || game.timeb > 0}
                    <p class={["pwhite", (game.currentPly() & 1) == 0 ? "active" : ""]}>{game.data.p1} - {timew}</p>
                    <p class={["pblack", (game.currentPly() & 1) == 1 ? "active" : ""]}>{timeb} - {game.data.p2}</p>
                {:else}
                    <p class={["pwhite", (game.currentPly() & 1) == 0 ? "active" : ""]}>{game.data.p1}</p>
                    <p class={["pblack", (game.currentPly() & 1) == 1 ? "active" : ""]}>{game.data.p2}</p>
                {/if}
                <i class="fill-primary material-symbols-outlined" onclick={() => showMenu = !showMenu}>menu</i>
            </div>

            <div class="board">
                {#if showMenu}
                    <GameInfo game={game} hide={() => {showMenu = false}}/>
                {/if}
                <Board game={game}/>
            </div>
        </div>
    </div>
    <div class="right">
        <div class="metabuttons">
            {#if game.data.color != 0}
                <button class="material-symbols-outlined rounded_button" style:background={["", "#5397f4", "#9F7F00", ""][game.undoReq]} onclick={() => undoButton()}>undo</button>
                <button class="material-symbols-outlined rounded_button" onclick={() => game.backend.resign(game)}>flag</button>
                <button class="material-symbols-outlined rounded_button" style:background={["", "#5397f4", "#9F7F00", ""][game.drawReq]} onclick={() => drawButton()}>handshake</button>
            {/if}
        </div>

        <div class={["ptn", small ? "small" : "large"]}>
            {#if small}
                <button class="material-symbols-outlined rounded_button" onclick={() => game.reset()}>keyboard_double_arrow_left</button>
                <button class="material-symbols-outlined rounded_button" onclick={() => game.undo()}>keyboard_arrow_left</button>
                {#if game.currentView > 0}
                    <p class={["ply", "past", (((game.currentView + startply & 1) == 0) == game.currentView + startply <= 2) ? "white" : "black"]}>
                        &nbsp{(game.currentView + startply + 1 >> 1)}. {moveString(game.history[game.currentView - 1])}&nbsp
                    </p>
                {:else}
                    <p class={["ply", "past", (game.currentView + startply & 1) == 1 ? "white" : "black"]}> &nbsp{(startply + 1) >> 1}. -&nbsp </p>
                {/if}
                <button class="material-symbols-outlined rounded_button" onclick={() => game.do()}>keyboard_arrow_right</button>
                <button class="material-symbols-outlined rounded_button" onclick={() => game.goto(game.history.length)}>keyboard_double_arrow_right</button>
            {:else}
                {#each game.history as ply, i}
                    {#if (i + startply & 1) == 0}
                    <p> {(i + startply >> 1) + 1}. </p>
                    {/if}
                    <button onclick={() => game.goto(i+1)} class={[
                        "ply",
                        (i + startply < 2 && game.data.opening != 0) == (((i + startply) & 1) == 0) ? "black" : "white",
                        i >= game.currentView ? 'future' : 'past'
                    ]}
                    style:grid-column="{((i + startply) & 1) + 2} / span 1">
                        {moveString(ply)}
                    </button>
                {/each}
            {/if}
        </div> 
    </div>
</div>


<style>
    .holder {
        display:flex;
        width: 100%;
        gap: 1rem;
    }

    .left {
        flex-grow: 1;
        container-type: size;
    }

    .right {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .slot {
        margin: 0 auto;
        --head: calc(2rem + 7px);
        width: min(100cqw, calc((100cqh - var(--head)) * (var(--size) / (var(--size) + .75))));
        height: min(100cqh, calc(100cqw * (1 + .75 / var(--size))));
    }

    .board {
        position: relative;
        aspect-ratio: calc(var(--size) / (var(--size) + .75));
        width: 100%;
    }

    .head {
        display: flex;
        border-radius: 5px 5px 0 0;
        background: var(--primary);
    }

    .pwhite, .pblack {
        flex-grow: 1;
        font-size: 1.5rem;
        line-height: 2rem;
        margin: 0;
        padding: 1px 5px;
        overflow: hidden;
        border: solid;
        border-width: 1px 1px 4px 1px;
    }

    .pwhite {
        border-color: var(--white);
        background-color: var(--white);
        color: var(--black);
        border-radius: 5px 0px 0px 0px;
    }
    
    .pblack {
        border-color: var(--black);
        background-color: var(--black);
        color: var(--white);
        text-align: end;
    }

    .active {
        border-color: var(--primary);
    }

    i {
        font-size: 2em;
        padding: 3px;
    }

    .metabuttons {
        background: var(--panel);
        border-radius: .7em;
        margin: 0 3px;
        display: flex;
        padding: 1px;

        button {
            margin: 2px;
            flex-grow: 1;
            border-radius: .35em;
            font-size: 2em;
            padding: 0 .2em;
        }
    }

    .ptn {
        flex-grow: 1;
        background: var(--panel);
        border-radius: .7em;
        margin: 0 3px;
    }

    .small {
        display: flex;
        justify-content: space-around;
        padding: 1px;
        > * {
            flex-grow: 1;
            margin: 2px;
            border-radius: .35em;
        }
    }

    .large {
        min-width: 10vw;
        display: grid;
        grid-template-columns: auto 1fr 1fr;
        align-content: start;
        overflow-y: scroll;  
        padding: .1em;
    }

    p {
        color: var(--text_light);
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

    .white {
        border-color: var(--white_border);

        &.past {
            background: var(--white);
            color: var(--black);
        }
        &.future {
            background: 0;
            color: var(--text_light);
        }
    }

    .black {
        border-color: var(--black_border);

        &.past {
            background: var(--black);
            color: var(--white);
        }
        &.future {
            background: 0;
            color: var(--text_light);
        }
    }

    .future:hover {
        background: var(--accent);
    }
</style>