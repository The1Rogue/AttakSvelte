
<!-- svelte-ignore a11y_click_events_have_key_events -->

<script lang="ts">
    import { games } from "$lib/backends/connector.svelte";
    import PTN from "$lib/ingame/ptn.svelte";
    import { goto } from "$app/navigation";

    if (games.length == 0) {
        goto("/")
    }

    let selected = $state(0)
    let selected_second = $state(1)

    $effect(() => {
        selected = Math.min(selected, games.length-1);
        selected_second = Math.min(selected_second, games.length-1);
        if (selected == selected_second) {
            selected_second -= 1
        }
    })

    let w = $state(1)
    let h = $state(1)
    let ratio = $derived(w/h)

    function selectGame(i: number) {
        if (selected_second != i) {
            selected = i;
        }
    }

    function selectSecondGame(e: Event, i: number) {
        if (selected != i) {
            selected_second = i;
        }
        e.preventDefault()
    }
</script>

<svelte:window bind:outerHeight={h} bind:outerWidth={w}/>

<div class="holder">
    {#if games.length <=1 }
    <PTN game={games[0]} small={ratio <= 1}></PTN>
    {:else if ratio > 1.2} 
    <!-- perhaps we can extend this beyond 2 dynamically (.6 ratio per game or smth) though not really required-->
    <PTN game={games[Math.min(selected, games.length-1)]} small={ratio <= 2}></PTN>
    <PTN game={games[Math.min(selected_second, games.length-1)]} small={ratio <= 2}></PTN>
    
    {:else}
    <PTN game={games[Math.min(selected, games.length-1)]} small={ratio <= 1.5}></PTN>
    {/if}
</div>

{#if (games.length > 1 && ratio < 1.2) || games.length > 2}
<div class="selector">
    {#each games as game, i}
        {#if game.data.color == 3}
        <div class="gametab analysis material-symbols-outlined" 
        onclick={() => selectGame(i)}
        oncontextmenu={(e) => selectSecondGame(e, i)}>
            Search<p>&nbsp{game.data.p1} - {game.data.p2}</p>
        </div>
        {:else if game.data.color == 0}
        <div class="gametab spectate material-symbols-outlined" 
        onclick={() => selectGame(i)}
        oncontextmenu={(e) => selectSecondGame(e, i)}>
            Visibility<p>&nbsp{game.data.p1} - {game.data.p2}</p>
        </div>
        {:else if (game.data.color - 1) == (game.currentPly() & 1)}
        <div class="gametab activeturn material-symbols-outlined" 
        onclick={() => selectGame(i)}
        oncontextmenu={(e) => selectSecondGame(e, i)}>
            grid_on<p>&nbsp{game.data.p1} - {game.data.p2}</p>
        </div>
        {:else}
        <div class="gametab waitturn material-symbols-outlined" 
        onclick={() => selectGame(i)}
        oncontextmenu={(e) => selectSecondGame(e, i)}>
            grid_on<p>&nbsp{game.data.p1} - {game.data.p2}</p>
        </div>
        {/if}
    {/each}
</div>
{/if}

<style>
    .holder {
        display: flex;
        height: calc(100% - 20px);
        padding: 10px 0px;
        gap: 1vw;
    }

    .selector {
        position: absolute;
        display: flex;
        flex-direction: column;
        right: 0;
        top: 100px;
        gap: .1rem;
        align-items: end;
    }

    .gametab {
        font-size: 1rem;
        padding: .25rem;
        min-width: 10px;
        min-height: 10px;
        border-radius: 5px 0 0 5px;
        z-index: 100;
        > p {
            transition: max-width calc(var(--anim_speed));
            max-width: 0;
            overflow: hidden;
            display: inline-block;
            margin: 0;
            color: inherit;
        }
        &:hover > p {
            max-width: 12rem;
        }
    }

    .analysis, .spectate {
        background-color: var(--ui);
        color: var(--text_light);
    }
    .activeturn {
        background-color: var(--notif);
        color: var(--text_dark);
    }
    .waitturn {
        background-color: var(--primary);
        color: var(--text_dark);
    }
</style>
