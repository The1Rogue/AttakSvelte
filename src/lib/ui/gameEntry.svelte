<!-- svelte-ignore state_referenced_locally, non_reactive_update, a11y_click_events_have_key_events, a11y_no_static_element_interactions -->

<script lang="ts">

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    import { Game, GameStateStrings } from "$lib/ingame/game.svelte";
    import { addGame } from "$lib/backends/connector.svelte";
    import { parseMove } from "$lib/backends/playtak_stable.svelte";
    import newGame from "$lib/assets/newGame.svg"
    let { game, odd } = $props()
    
    let result = GameStateStrings.indexOf(game.result)
    let r = game.result.split("-")


    let tc = `${game.timertime / 60}'+${game.timerinc}"`
    if (game.extra_time_amount > 0) {
        tc += ` +${game.extra_time_amount/60}'@${game.extra_time_trigger}`
    }


    let rating_white = game.rating_white
    if (game.rating_change_white > -1000) {
        rating_white += game.rating_change_white > 0 ? " +" + game.rating_change_white/10 : " -" + -game.rating_change_white/10
    } 

    let rating_black = game.rating_black
    if (game.rating_change_black > -1000) {
        rating_black += game.rating_change_black > 0 ? " +" + game.rating_change_black/10 : " -" + -game.rating_change_black/10
    } 

    let datetime = new Date(game.date)
    let m: string | number = datetime.getMinutes()
    if (m < 10) {m = "0" + m}

    function load() {
        let g = new Game({
            id: -game.id, //TODO neg is just to make it realize its not a live game, should implement that seperately
            p1: game.player_white,
            p2: game.player_black,
            size: game.size,
            time: game.timertime,
            inc: game.timerinc,
            extra: game.extra_time_amount,
            trigger: game.extra_time_trigger,
            color: 3,
            halfkomi: game.komi,
            flats: game.pieces,
            caps: game.capstones,
            rated: game.unrated == 0,
            tourney: game.tournament == 1
        })

        for (const m of game.notation.split(",")) {
            if (m == "") {break}
            g.addMove(parseMove(m.split(" ")))
        }

        addGame(g)
    }

</script>

<div class={["entry", "go_button", odd ? "odd" : ""]} onclick={() => load()}>
    <p class="id">{game.id}</p>

    <p class="settings">{tc}</p>
    <p class="settings">{game.size}s +{game.komi/2} komi</p>

    <p class={["player","white",result > 1 && ((result & 1) == 0) ? "won" : ""]}>
        {game.player_white} <em style="font-size:.75em">({rating_white})</em>
        <strong style="float: right">&nbsp;{r[0]}</strong>
    </p>
    <p class={["player","black",result > 1 && ((result & 1) != 0) ? "won" : ""]}>
        {game.player_black} <em style="font-size:.75em">({rating_black})</em>
        <strong style="float: right">&nbsp;{r[1]}</strong>
    </p>

    <p class={["date"]}>
        {datetime.getFullYear()}, {months[datetime.getMonth()]} {datetime.getDate()} - {datetime.getHours()}:{m}
    </p>    

    {#if game.tournament == 1}
        <p class="type material-symbols-outlined" title="Tournament">trophy</p>
    {:else if game.unrated == 1}
        <p class="type material-symbols-outlined" title="Unrated">close</p>
    {:else}
        <!-- <p class="type material-symbols-outlined" title="Rated">star</p> -->
    {/if}
</div>


<style>
    .entry {
        display: grid;
        grid-column: 1 / -1;
        grid-template-columns: subgrid;
        grid-auto-flow: dense;
        padding: .7rem 0;

        background: var(--panel);
    }

    p {
        color: var(--textLight);
        padding: .075rem .25rem;
        margin: 0;
    }

    .id {
        grid-column: 1 / span 1;
        grid-row: 1 / 3;
        margin: auto 1vw
    }
    .settings {
        grid-column: 2 / span 1;
        margin: 0 1vw
    }
    .player {
        grid-column: 4 / span 1;
        margin: .1rem 1vw;
    }
    .won {
        margin: 0 calc(1vw - .1rem);
        border: .1rem solid var(--primary);
        border-radius: .5rem;
    }

    .date {
        margin: auto 1vw;
        grid-row: 1 / 3; 
        grid-column: 5 / span 1;
    }

    .type {
        margin: auto 1vw;
        grid-row: 1 / 3; 
        grid-column: 3 / span 1; 
    }

    @media(max-width: 45em) {
        .entry {
            font-size: .9em
        }
        .id, .date {
            display: none;
        }
    }
</style>