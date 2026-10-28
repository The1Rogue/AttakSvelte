

<script lang="ts">
    import { acceptGame, get_rating, timeString } from "$lib/backends/connector.svelte"

    let { seek } = $props()
    let ratingPromise = $state(get_rating(seek.p1))
</script>



<button class="seek go_button" onclick={() => acceptGame(seek.id)}>
    <p>
        {seek.p1}
    
    {#await ratingPromise}
        (???)
    {:then rating}
        ({rating})
    {:catch error}
        ( - )
    {/await}
    </p>
    <p>{seek.size}s +{seek.halfkomi/2} komi</p>
    <p>{timeString(seek)}</p>
</button>
