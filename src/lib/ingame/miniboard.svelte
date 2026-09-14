<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_consider_explicit_label -->

<script lang="ts">
    import { theme } from "$lib/theme.svelte";
</script>



<div class="board">
    <div class="outersq {theme.board.checker ? "odd": "even"} ring2"><button class="innersq {theme.board.checker ? "even": "odd"} ring2"></button></div>
    <div class="outersq even ring2"><button class="innersq odd ring2"></button></div>
    <div class="outersq even ring2"><button class="innersq odd ring2"></button></div>
    <div class="outersq {theme.board.checker ? "odd": "even"} ring1"><button class="innersq {theme.board.checker ? "even": "odd"} ring1"></button></div>

    <button type="button" title=""
        class="piece white flat"
        style:--x={0}
        style:--y={1}
        style:--z={0}
    ></button>
    <button type="button" title=""
        class="piece white flat"
        style:--x={0}
        style:--y={1}
        style:--z={1}
    ></button>
        <button type="button" title=""
        class="piece black flat"
        style:--x={0}
        style:--y={1}
        style:--z={2}
    ></button>
    <button type="button" title=""
        class="piece black cap"
        style:--x={0}
        style:--y={1}
        style:--z={3}
    ></button>

    <button type="button" title=""
        class="piece black flat"
        style:--x={1}
        style:--y={1}
        style:--z={0}
    ></button>
    <button type="button" title=""
        class="piece black flat"
        style:--x={1}
        style:--y={1}
        style:--z={1}
    ></button>
    <button type="button" title=""
        class="piece white wall"
        style:--x={1}
        style:--y={1}
        style:--z={2}
    ></button>

    <button type="button" title=""
        class="piece white flat"
        style:--x={0}
        style:--y={0}
        style:--z={0}
    ></button>
    <button type="button" title=""
        class="piece black wall highlight"
        style:--x={0}
        style:--y={0}
        style:--z={1}
    ></button>

    <button type="button" title=""
        class="piece white flat highlight"
        style:--x={1}
        style:--y={0}
        style:--z={0}
    ></button>
</div>

<style>
    .board {
        background: var(--board_reserves);
        position: relative;
        display: grid;
        grid-template-rows: 1fr 1fr;
        grid-template-columns: 1fr 1fr;

        aspect-ratio: 1;
        max-height: 100%;
        max-width: 100%;

        .piece {
            pointer-events: none;
            position: absolute;
            width: 25%;
            z-index: var(--z);

            bottom: calc(100% * (var(--y) + .25 + var(--z) * .05) / 2);
            left: calc(100% * (var(--x) + .25) / 2);
            font-size: min(calc(2vh / (4.75)), calc(2.5vw / 6));

            border-width: var(--piece_border);
            border-style: solid;
            transition: var(--anim_speed);
            box-shadow: 0 calc(var(--piece_border)/2 + .4em) calc(var(--piece_border) + .6em) var(--shadow);
        }

        .highlight {
            border-color: var(--primary);
            border-width: max(1em, var(--piece_border));
        }

    }

    .innersq {
        display: grid;
        grid-template-columns: min-content auto min-content;
        grid-template-rows: min-content auto min-content;
        aspect-ratio: 1;
        width: calc(100% - 2*var(--board_gap));
        border: none;
        margin: var(--board_gap);
        border-radius: var(--board_round);
        transition: background var(--anim_speed);
    }

    .innersq:hover {
        background: var(--board_reserves) !important;
    }

    .innersq.odd {
        &.ring1 {
            background: color-mix(in srgb, var(--ring1) var(--ring_opacity), var(--board_light) calc(100% - var(--ring_opacity)));
        }
        &.ring2 {
            background: color-mix(in srgb, var(--ring2) var(--ring_opacity), var(--board_light) calc(100% - var(--ring_opacity)));
        }
    }

    .innersq.even {
        &.ring1 {
            background: color-mix(in srgb, var(--ring1) var(--ring_opacity), var(--board_dark) calc(100% - var(--ring_opacity)));
        }
        &.ring2 {
            background: color-mix(in srgb, var(--ring2) var(--ring_opacity), var(--board_dark) calc(100% - var(--ring_opacity)));
        }
    }

    .outersq {
        aspect-ratio: 1;
    }
    .outersq.odd {
        background: var(--board_light);
    }
    .outersq.even {
        background: var(--board_dark);
    }

    .flat {
        aspect-ratio: 1;
        border-radius: 10%;
    }
    .cap {
        aspect-ratio: 1;
        border-radius: 50%;
    }
    .wall {
        aspect-ratio: 3;
        border-radius: 10% / 30%;
    }
    .wall.black {
        rotate: 45deg;
        transform-origin: 90.2% 0%;
    }
    .wall.white {
        transform-origin: 9.8% 0%;
        rotate: -45deg;
    }
    .white {
        background: var(--white);
        border-color: var(--white_border);
    }

    .black {
        background: var(--black);
        border-color: var(--black_border);
    }



</style>