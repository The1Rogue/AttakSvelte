<!-- svelte-ignore a11y_click_events_have_key_events --> <!-- svelte-ignore a11y_no_static_element_interactions -->

<script lang="ts">
    import { GameStateStrings } from "$lib/ingame/game.svelte"
    import { closeGame } from "$lib/backends/connector.svelte";

    import { addToast } from "$lib/ui/toast.svelte";
    let { game, hide } = $props()
</script>

<div class="overlay" onclick={hide}>
    <div class="endBox">
        {#if game.gameState == 0}
            <p>Game is Ongoing</p>
        {:else}
            <p>Game Ended: {GameStateStrings[game.gameState]}<br/>
            {#if game.gameState == 1}
                it's a draw
            {:else if (game.gameState & 1) == 0}
                {game.data.p1} won!
            {:else}
                {game.data.p2} won!
            {/if}
            </p>
        {/if}
        {#if game.data.id > 0}
            <button class="rounded_button" onclick={() => {navigator.clipboard.writeText(game.data.id); addToast("Game ID copied!", false)}} title="click to copy">Game ID: {game.data.id}</button>
        {/if}
        <button class="rounded_button" onclick={() => closeGame(game.data.id)}> Close Game </button>
    </div>
</div>

<style>
    .overlay {
        position: absolute;
        z-index: 100;

        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        /* background-color: #5F5F5F7F; */
        background-color: var(--panel);
        border-radius: 5px;
    }


    .endBox {
        background-color: var(--ui);
        color: var(--textLight);
        padding: 10px;
        border-radius: 10px;
    }

    p {
        font-size: 1.4em;
        margin: .1em .4em .4em;
    }
</style>