
<script lang="ts">
    import Seeks from '$lib/ui/seeks.svelte'
    import Events from '$lib/ui/tourneys.svelte'
    import Login from "$lib/ui/login.svelte"

    // import { isConnected } from "$lib/socket.svelte"
    import { isConnected } from '$lib/backends/connector.svelte'; 

</script>



<div class="main">
    {#if isConnected()}
        <Seeks/>
    {:else}
        <Login/>
    {/if}
    <Events/>
</div>


<style>
    .main {
        overflow-x: hidden;
        overflow-y: scroll;
        padding: 20px 12.5%;
        height: calc(100% - 40px);
        width: 75%;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-auto-flow: row;
        justify-content: space-between;
        justify-items: stretch;
        align-items: start;
        gap: 20px;
        scrollbar-width: none;
    }

    @media(max-aspect-ratio: 1/1) {
        .main {
            padding: 20px 0;
            width: 100%;
            grid-template-columns: 1fr;
        }
    }
</style>