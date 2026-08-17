
<script lang="ts">
    import Seeks from '$lib/ui/seeks.svelte'
    import Events from '$lib/ui/tourneys.svelte'
    import Login from "$lib/ui/login.svelte"
    
    import { addGame, isConnected } from '$lib/backends/connector.svelte'; 
    import Board from '$lib/ingame/board.svelte';
    import { daily } from '$lib/backends/puzzles.svelte';

</script>



<div class="main">
    {#if isConnected()}
        <Seeks/>
    {:else}
        <Login/>
    {/if}
    <Events/>

    <div class=daily onclick={() => addGame(daily)} >
        <p>Daily Puzzle</p>
        <Board game={daily} bare={true} />
    </div>
</div>


<style>
    .main {
        padding: 20px 12.5%;
        min-height: calc(100% - 40px);

        width: 75%;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-auto-flow: row;
        justify-content: space-between;
        justify-items: stretch;
        align-items: start;
        gap: 20px;
        background: var(--secondary);
    }

    @media(max-aspect-ratio: 1/1) {
        .main {
            padding: 20px 0;
            width: 100%;
            grid-template-columns: 1fr;
        }
    }

    .daily {
        background-color: var(--ui);
        border-radius: 5px;
        padding: 1px 1px 10px;
        
        p {
            margin: .25em;
        }
        &:hover {
            background-color: var(--accent);
        }
    }
</style>