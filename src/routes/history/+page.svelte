
<script lang="ts">
    import { get_history } from "$lib/backends/connector.svelte";
    import GameEntry from "$lib/ui/gameEntry.svelte";



    let options = $state({
        id: "",
        player_white: "",
        player_black: "",
        mirror: true,
        game_result: "",
        type: "",
        size: "",
        komi: "",
        startDate: "",
        endDate: ""
    })

    let gamesPromise = $state(get_history({}))


    function applyFilters() {
        gamesPromise = get_history(options)
    }


</script>

<div class="holder">

    <details>
    <summary><i class="material-symbols-outlined">filter_list</i>Filters</summary>
    <div class="filters">
    <label class="input_label">ID: <input type=text bind:value={options.id}/></label>
        
    <br/>

    <label class="input_label">White: <input type=text bind:value={options.player_white}/></label>
    <label class="input_label">Black: <input type=text bind:value={options.player_black}/></label>
    <label class="input_label">Mirror: <input type=checkbox bind:checked={options.mirror}/></label>

    <br/>

    <label class="input_label">Result: <select bind:value={options.game_result}>
        <option value=""> -- </option>
        <option value="X-0"> X-0 </option>
        <option value="R-0"> R-0 </option>
        <option value="F-0"> F-0 </option>
        <option value="1-0"> 1-0 </option>
        <option value="1/2-1/2"> 1/2-1/2 </option>
        <option value="0-X"> 0-X </option>
        <option value="0-R"> 0-R </option>
        <option value="0-F"> 0-F </option>
        <option value="0-1"> 0-1 </option>
    </select></label>
    <label class="input_label">Type: <select bind:value={options["type"]}>
        <option value=""> -- </option>
        <option value="tournament"> Tournament </option>
        <option value="normal"> Rated </option>
        <option value="unrated"> Unrated </option>
    </select></label>

    <br/>

    <label class="input_label">Size: <select bind:value={options.size}>
        <option value=""> -- </option>
        <option value=3> 3x3 </option>
        <option value=4> 4x4 </option>
        <option value=5> 5x5 </option>
        <option value=6> 6x6 </option>
        <option value=7> 7x7 </option>
        <option value=8> 8x8 </option>
    </select></label>

    <label class="input_label">Komi: <select bind:value={options.komi}>
        <option value=""> -- </option>
        <option value=0> 0 </option>
        <option value=1> 0.5 </option>
        <option value=2> 1 </option>
        <option value=3> 1.5 </option>
        <option value=4> 2 </option>
        <option value=5> 2.5 </option>
        <option value=6> 3 </option>
        <option value=7> 3.5 </option>
        <option value=8> 4 </option>

    </select></label>

    <br/>
    <label class="input_label">After: <input type=date bind:value={options["startDate"]}/></label>
    <label class="input_label">Before: <input type=date bind:value={options["endDate"]}/></label>

    <br/>

    <button onclick={() => applyFilters()}>Search</button>
    </div>
    </details>

    {#await gamesPromise}
        <p>Loading...</p>
    {:then games}
        <div class="entries list ui_panel" style:--columns=5>
        {#each games as game, i}
            <GameEntry game={game} odd={(i & 1) == 1}/>
        {/each}
        </div>
    {/await}
</div>


<style>
    .holder {
        margin: 2em 0;
        display: flex;
        gap: 2em;
        justify-content: center;
        align-items: flex-start;
        background: var(--secondary);
    }

    details {
        background: var(--panel);
        border-radius: 1em;
        padding: .25em 1em .5em;
        position: sticky;
        top: 2em;
    }

    .filters {
        padding: .5em 0;
        display:flex;
        flex-direction: column;

        label, button {
            margin: .2em;
        }
        br {
            margin: 1em;
        }
    }

    summary {
        list-style: none;
        margin: .25em 0;
    }

    .entries {
        gap: .1em 0;
        background: var(--ui);
        align-self: stretch;
    }

    @media(max-width: 45em) {
        .holder {
            flex-direction: column;
        }

        details {
            position: static;
            align-self: stretch;
        }
    }
</style>