
<script lang="ts">
    import Board from "$lib/ingame/board.svelte"

    import { games } from "$lib/backends/connector.svelte";
    import PTN from "$lib/ingame/ptn.svelte"
    import { goto } from "$app/navigation";

    if (games.length == 0) {
        goto("/")
    }

    let selected = $state(0)
</script>


<div class="holder">
    <PTN game={Object.values(games)[selected]}/>
    <div 
        class="boards"
        style:--w={Math.ceil(Math.sqrt(Object.keys(games).length))}
        >

        {#each Object.values(games) as game}
            <div class="board">
                <Board game = {game}/>
            </div>
        {/each}
    </div>
</div>


<style>
    .holder {
        display: flex;
        height: 100%;
    }

    @media(max-aspect-ratio: 1/1) {
        .holder {
            flex-direction: column-reverse;
        }
    }

    .boards {
        margin: 10px 0px;
        display: flex;

        gap: 1vw;
        justify-content: center;
        align-items: center;
        height: calc(100% - 20px);
        flex-grow: 1;
    }

    .board {
        height: 100%;
        width: 100%;
    }

</style>
