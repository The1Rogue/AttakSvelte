<script lang="ts">
    // import { addGame, data, send} from '$lib/socket.svelte'
    import type { GameData } from "$lib/backends/connector.svelte"
    import { addGame, search, player_seeks, bot_seeks, ongoing, spectate } from "$lib/backends/connector.svelte";

    import Seek from "$lib/ui/seek.svelte"

    import { Game } from "$lib/ingame/game.svelte"
    import { goto } from '$app/navigation';

    const times = [[20,15], [15,10], [10,20], [5,5], [3,5], [1,5]]

    let scratchSize = $state(6);

    let size = $state(6)
    let time = $state(1)
    let gametype = $state(1)
    let opponent = $state("")

    function createScratch() {
        addGame(new Game({
            id: 0,
            p1: "White",
            p2: "Black",
            color: 3,
            size: scratchSize,
            time: 0,
            inc: 0,
            halfkomi: 0,
            flats: [10, 15, 21, 30, 40, 50][scratchSize - 3],
            caps: (scratchSize - 3) >> 1,
            rated: false,
            tourney: false,
            trigger: 0,
            extra: 0,
        }))
    }

    function createSeek() {
        let flats = [10, 15, 21, 30, 40, 50][size-3]
        let caps =  [0, 0, 1, 1, 2, 2][size-3]

        let game: GameData = {
            id: 0,
            p1: "",
            p2: opponent,
            color: 3,
            size: size,
            time: times[time][0] * 60,
            inc: times[time][1],
            halfkomi: 4,
            flats: flats,
            caps: caps,
            rated: gametype != 0,
            tourney: gametype == 2,
            trigger: 0,
            extra: 0,
        }
        search(game)

        // send(`Seek ${size} ${times[time][0] * 60} ${times[time][1]} A 4 ${flats} ${caps} ${gametype == 0 ? 1 : 0} ${gametype == 2 ? 1 : 0} 0 0 ${opponent}`)
    }
</script>



<div id="seeks">
    <details name="seeks" style="--n: 1">
        <summary class="subitem tab">Create Game</summary>
        <div class="splitlist ui_panel">
            <input type="text" placeholder="opponent" bind:value={opponent}/> 
            <label class="input_label">Game Type:<select bind:value={gametype}>
                <option value={1}>Rated</option>
                <option value={0}>Unrated</option>
                <option value={2}>Tournament</option>
            </select></label>

            <p>size</p><p>time controls</p>

            <label class="radioinp"><input type="radio" name="size" value={3} bind:group={size}/>3x3</label>
            <label class="radioinp"><input type="radio" name="time" value={0} bind:group={time}/>20+15</label>           
            <label class="radioinp"><input type="radio" name="size" value={4} bind:group={size}/>4x4</label>
            <label class="radioinp"><input type="radio" name="time" value={1} bind:group={time}/>15+10</label>
            <label class="radioinp"><input type="radio" name="size" value={5} bind:group={size}/>5x5</label>
            <label class="radioinp"><input type="radio" name="time" value={2} bind:group={time}/>10+20</label>
            <label class="radioinp"><input type="radio" name="size" value={6} bind:group={size} checked/>6x6</label>
            <label class="radioinp"><input type="radio" name="time" value={3} bind:group={time}/>5+5</label>
            <label class="radioinp"><input type="radio" name="size" value={7} bind:group={size}/>7x7</label>
            <label class="radioinp"><input type="radio" name="time" value={4} bind:group={time}/>3+5</label>
            <label class="radioinp"><input type="radio" name="size" value={8} bind:group={size}/>8x8</label>
            <label class="radioinp"><input type="radio" name="time" value={5} bind:group={time}/>1+5</label>

            <button class="go_button" onclick={createSeek}>Search</button>
            <button class="go_button" onclick={() => goto("/newGame")}>Advanced</button>
        </div>
    </details>
    <details name="seeks" open style="--n: 2">
        <summary class="subitem tab">Lobby ({Object.keys(player_seeks).length} | {Object.keys(bot_seeks).length})</summary>
        <div class="list ui_panel" style:--columns=3>
            <h3 class="section">Player Games</h3>
            {#each Object.entries(player_seeks) as [i, seek] (i)}
                <Seek seek={seek}/>
            {:else}
                <p>-</p>
            {/each}
            
            <h3 class="section">Bot Games</h3>
            {#each Object.entries(bot_seeks) as [i, seek] (i)}
                <Seek seek={seek}/>
            {:else}
                <p>-</p>
            {/each} 
        </div>
    </details>
    <details name="seeks" style="--n: 3">
        <summary class="subitem tab">Spectate ({Object.keys(ongoing).length})</summary>
        <div class="list ui_panel" style:--columns=3>
            <h3 class="section">Ongoing Games</h3>
            {#each Object.entries(ongoing) as [i, seek] (i)}
                <button class="seek go_button" style:--columns=2 onclick={() => spectate(parseInt(i))}> 
                    <p>{seek.p1} - {seek.p2}</p>
                    <p>{seek.size}s +{seek.halfkomi/2} komi</p>
                    <p>{seek.time / 60}'+{seek.inc}"
                    {#if seek.extra > 0}
                        + {seek.extra/60}@{seek.trigger}
                    {/if}
                    </p>
                </button>
            {:else}
                <p>-</p>
            {/each} 
        </div>
    </details>
</div>

<style>

#seeks {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: auto 1fr;

    width: 100%;
    margin: 1% 0;
}

details {
    display: grid;
    grid-template-columns: subgrid;
    grid-template-rows: subgrid;
    grid-column: 1 / -1;
    grid-row: 1 / span 3;
}

details::details-content {
    grid-row: 2; /* position in the second row */
    grid-column: 1 / -1; /* cover all three columns */
    padding: 0;
    z-index: 1;
    overflow: scroll;
}

details:not([open])::details-content {
    display: none;
}

.splitlist {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-auto-flow: row;
    grid-auto-rows: 1fr;
    border-style: solid;
    border-color: var(--ui);
    border-radius: 5px;
    border-width: 10px 1px;
    gap: 0 1px;

    p {
        padding: .2em 1em;
        margin: 0;
        border: solid var(--ui);
        border-width: 2px 0;
    }

}

label {
    padding: .5em 1em
}

.radioinp input {
    visibility:hidden;
}

.radioinp:hover {
    background: var(--accent);
}

.radioinp:has(input:checked) {
    background-color: var(--primary);
    color: var(--textDark)
}


</style>