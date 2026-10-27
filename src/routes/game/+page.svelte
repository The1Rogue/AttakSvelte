
<script lang="ts">
    import { games } from "$lib/backends/connector.svelte";
    import PTN from "$lib/ingame/ptn.svelte";
    import { goto } from "$app/navigation";

    if (games.length == 0) {
        goto("/")
    }

    let selected = $state(0)
    let selected_second = $state(1)

    let w = $state(1)
    let h = $state(1)
    let ratio = $derived(w/h)
</script>

<svelte:window bind:outerHeight={h} bind:outerWidth={w}/>

<div class="holder">
{#if games.length <=1 }
    <PTN game={games[0]} small={ratio <= 1}></PTN>
{:else if ratio > 1.2} 
<!-- perhaps we can extend this beyond 2 dynamically (.6 ratio per game or smth) though not really required-->
    <PTN game={games[selected]} small={ratio <= 2}></PTN>
    <PTN game={games[selected_second]} small={ratio <= 2}></PTN>
    
{:else}
    <PTN game={games[selected]} small={ratio <= 1.5}></PTN>
{/if}

</div>

<style>
    .holder {
        display: flex;
        height: calc(100% - 20px);
        padding: 10px 0px;
        gap: 1vw;
    }
</style>
