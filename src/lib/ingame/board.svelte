<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_consider_explicit_label -->


<script lang="ts">
    import { theme } from "$lib/theme.svelte";
    
    let { game } = $props()  
</script>


<div class="holder" style:--size={game.data.size} onfocusout={() => {if (!this.matches(":focus-within")) game.deselect()}}>
    <div class="board" role="none">
        {#each {length: game.data.size}, c}
                {#each {length: game.data.size}, r}
                    <div 
                        class={["outersq",
                            ((c ^ r) & 1) == 1 && theme.board.checker ? "odd": "even",
                            "ring" + (Math.max(Math.trunc(Math.abs(game.data.size/2 - .5 - c)), Math.trunc(Math.abs(game.data.size/2 - .5 - r))) + 1)
                        ]}
                    >
                    <button 
                        class={["innersq",
                            ((c ^ r) & 1) == 1 && theme.board.checker ? "even": "odd",
                            "ring" + (Math.max(Math.trunc(Math.abs(game.data.size/2 - .5 - c)), Math.trunc(Math.abs(game.data.size/2 - .5 - r))) + 1)
                        ]}
                    
                    
                        onclick={() => game.clickPile(r, game.data.size - 1 - c)} 
                        oncontextmenu={(e) => {e.preventDefault(); game.rclickPile(r, game.data.size - 1 - c)}}
                        title=""
                        >
                        {#if c == game.data.size - 1}
                            <p class="colLabel">{String.fromCharCode(r + 0x61)}</p>
                        {/if}
                        {#if r == 0}
                            <p class="rowLabel">{game.data.size - c}</p>
                        {/if}
                    </button>
                    </div>
                {/each}
        {/each}
        {#each game.pieces as piece, i (piece.id)}
            <button
                onclick={() => game.clickReserve(piece.type)}
                oncontextmenu={(e) => {e.preventDefault(); game.rclickReserve()}}
                class={["piece",
                    piece.selected ? "selected" : "",
                    (i&1) == 0 ? 'white' : 'black',
                    ["flat", "wall", "cap"][piece.type],
                    game.highlight.includes(i) ? "highlight" : "",
                    piece.position >= 0 ? "" : "reserve",
                    piece.position >= 0 && piece.height < (game.board[piece.position].length - game.data.size) ? "overflow" : ""
                ]}

                style:--x={piece.position & 0x7}
                style:--y={piece.position >> 3}
                style:--z={piece.position >= 0 ? piece.height : ((i>>1) - game.data.caps) / (game.data.caps + game.data.flats)}
                style:--h={piece.position >= 0 ? game.board[piece.position].length : 0}
            ></button>
        {/each} 
    </div>
    <div class="reserveHolder"
        tabindex="-1"
        onclick={() => game.clickReserveBar()}
        oncontextmenu={(e) => {e.preventDefault(); game.rclickReserve()}}
        >
    </div>
</div>

<style>
    .reserveHolder {
        background-color: var(--board_reserves);
        aspect-ratio: var(--size) / .75;
        border-radius: 0 0 5px 5px;
    }

    .board {
        background: var(--board_reserves);
        position: relative;
        display: grid;
        grid-template-rows: repeat(var(--size), 1fr);
        grid-template-columns: repeat(var(--size), 1fr);

        aspect-ratio: 1;

        .piece {
            pointer-events: none;
            position: absolute;
            width: calc(50% / var(--size));
            z-index: var(--z);
            font-size: min(calc(2vh / (var(--size) + .75)), calc(2.5vw / var(--size)));

            bottom: calc(100% * (var(--y) + .25 + (var(--z) + min(0, var(--size) - var(--h))) * .06) / var(--size));
            left: calc(100% * (var(--x) + .25) / var(--size));
            border-width: var(--piece_border);
            border-style: solid;
            transition: var(--anim_speed);
            box-shadow: 0 calc(var(--piece_border)/2 + .4em) calc(var(--piece_border) + .6em) var(--shadow);

            &.overflow {
                bottom: calc(100% * (var(--y) + .25 + var(--z) * .06) / var(--size));
                z-index: calc(var(--z) + var(--size));
                left: calc(100% * (var(--x) + .75) / var(--size));
                width: calc(15% / var(--size))
            }

        }

        .selected {
            z-index: calc(100 + var(--z));
            translate: 0 -100%;
        }
        
        .reserve {
            pointer-events: all;
            bottom: calc(100% * -.625 / var(--size));
        }

        .reserve.white {
            left: calc(100% - 50% / var(--size) - 50.75% - 50% * (.98 - 2/var(--size)) * var(--z));
        }
        .reserve.white.cap{
            left: calc(-.25% - 50% * var(--z))
        }
        .reserve.black {
            left: calc(50.75% + 50% * (.98 - 2/var(--size)) * var(--z));
        }
        .reserve.black.cap {
            left: calc(100% - 50% / var(--size) + .25% + 50% * var(--z));
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

    .outersq {
        aspect-ratio: 1;
    }
    .outersq.odd {
        background: var(--board_light);
    }
    .outersq.even {
        background: var(--board_dark);
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
        &.ring3 {
            background: color-mix(in srgb, var(--ring3) var(--ring_opacity), var(--board_light) calc(100% - var(--ring_opacity)));
        }
        &.ring4 {
            background: color-mix(in srgb, var(--ring4) var(--ring_opacity), var(--board_light) calc(100% - var(--ring_opacity)));
        }
    }

    .innersq.even {
        &.ring1 {
            background: color-mix(in srgb, var(--ring1) var(--ring_opacity), var(--board_dark) calc(100% - var(--ring_opacity)));
        }
        &.ring2 {
            background: color-mix(in srgb, var(--ring2) var(--ring_opacity), var(--board_dark) calc(100% - var(--ring_opacity)));
        }
        &.ring3 {
            background: color-mix(in srgb, var(--ring3) var(--ring_opacity), var(--board_dark) calc(100% - var(--ring_opacity)));
        }
        &.ring4 {
            background: color-mix(in srgb, var(--ring4) var(--ring_opacity), var(--board_dark) calc(100% - var(--ring_opacity)));
        }
    }


    .colLabel {
        padding: 1px 2px;
        margin: 0;
        font-size: min(1.5vh, 2vw);
        grid-area: 3/3/3/3;
        color: var(--text_light);        
    }
    .rowLabel {
        padding: 1px 2px;
        margin: 0;
        font-size: min(1.5vh, 2vw);
        grid-area: 1/1/1/1;
        color: var(--text_light)
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
        transform-origin: 9.8% 0%;
        rotate: -45deg;
    }
    .wall.white {
        transform-origin: 90.2% 0%;
        rotate: 45deg;
    }
    .wall.selected {
        translate: 0 -300%;
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