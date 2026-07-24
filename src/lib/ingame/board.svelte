<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_consider_explicit_label -->


<script lang="ts">

    import GameEnd from "$lib/ingame/gameEnd.svelte"
    import { currentTheme } from "$lib/theme.svelte";
    
    let { game } = $props()  


    function onKeyDown(e: KeyboardEvent) {
        switch(e.keyCode) {
            case 8:
                game.reset()
                break;
            case 37:
                game.undo()
                break;
            case 39:
                game.do()
                break;
        }
    }

    let timew = $derived((game.timew / 60000 | 0) + ":" + ("" + ((game.timew / 1000 | 0) % 60)).padStart(2, "0"))
    let timeb = $derived((game.timeb / 60000 | 0) + ":" + ("" + ((game.timeb / 1000 | 0) % 60)).padStart(2, "0"))

    let showMenu = $derived(game.gameState > 0)
</script>


    <!-- <PTN game={game}/> -->
<div class="holder" style:--size={game.data.size} onfocusout={() => {if (!this.matches(":focus-within")) game.deselect()}} onkeydown={onKeyDown}>

    {#if showMenu}
        <GameEnd game={game} hide={() => showMenu = false}/>
    {/if}

    <div class="head">
        <p class={["pwhite", (game.history.length & 1) == 0 ? "active" : ""]}>{game.data.p1} - {timew}</p>
        <p class={["pblack", (game.history.length & 1) == 1 ? "active" : ""]}>{timeb} - {game.data.p2}</p>
        <i class="fill-primary material-symbols-outlined" onclick={() => showMenu = true}>menu</i>
        <!-- <svg viewBox="0 0 448 512" class="fill-primary" onclick={() => showMenu = true}>
            <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"></path>
        </svg> -->
    </div>
    <div class="board" role="none">
        {#each {length: game.data.size}, c}
                {#each {length: game.data.size}, r}
                    <div 
                        class={["outersq",
                            ((c ^ r) & 1) == 1 && currentTheme.boardChecker ? "odd": "even",
                            "ring" + (Math.max(Math.trunc(Math.abs(game.data.size/2 - .5 - c)), Math.trunc(Math.abs(game.data.size/2 - .5 - r))) + 1)
                        ]}
                    >
                    <button 
                        class={["innersq",
                            ((c ^ r) & 1) == 1 && currentTheme.boardChecker ? "even": "odd",
                            "ring" + (Math.max(Math.trunc(Math.abs(game.data.size/2 - .5 - c)), Math.trunc(Math.abs(game.data.size/2 - .5 - r))) + 1)
                        ]}
                    
                    
                        onclick={() => game.clickPile(r, game.data.size - 1 - c)} title=""
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
                    onclick={() => game.clickReserve((i&1) + 1, piece.type == 2 ? 2 : 0 )}
                    class={["piece",
                        piece.selected ? "selected" : "",
                        (i&1) == 0 ? 'white' : 'black',
                        ["flat", "wall", "cap"][piece.type],
                        (game.highlight.indexOf(i) > -1) ? "highlight" : "",
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
    <div class="reserveHolder" tabindex="-1" onclick={() => game.clickReserveBar()}>
    </div>
</div>
<style>
    .holder {
        margin: auto;
        position: relative;
        display: flex;
        flex-direction: column;

        aspect-ratio: var(--size)/calc(var(--size) + 1);
        max-height: 100%;
    }

    /* .holder:focus-within {
        border: 3px solid var(--secondary);
        border-radius: 10px;
    }
     */

    .head {
        display: flex;
        justify-content: space-between;
        align-items: stretch;
        border-radius: 5px 5px 0 0;
        background: var(--primary);
    }
    p {
        flex-grow: 1;
        font-size: 1.5em;
        margin: 0;
        padding: 1px 5px;
        overflow: hidden;
    }

    i {
        font-size: 2em;
        padding: 3px;
    }

    .pwhite {
        border: solid var(--player1);
        border-width: 1px 1px 4px 1px;
        background-color: var(--player1);
        color: var(--player2);
        border-radius: 5px 0px 0px 0px;
    }
    
    .pblack {
        border: solid var(--player2);
        border-width: 1px 1px 4px 1px;
        background-color: var(--player2);
        color: var(--player1);
        text-align: end;
    }

    .active {
        border: solid var(--primary);
        border-width: 1px 1px 4px 1px;
    }

    .reserveHolder {
        background-color: var(--boardReserves);
        aspect-ratio: var(--size) / .75;
        border-radius: 0 0 5px 5px;
    }

    .board {
        grid-area: 2 / 1 / 3 / 3;
        background: var(--boardReserves);
        position: relative;
        display: grid;
        grid-template-rows: repeat(var(--size), 1fr);
        grid-template-columns: repeat(var(--size), 1fr);

        aspect-ratio: 1;
        max-height: 100%;
        max-width: 100%;

        .piece {
            pointer-events: none;
            position: absolute;
            width: calc(50% / var(--size));
            z-index: var(--z);
            font-size: min(calc(2vh / (var(--size) + .75)), calc(2.5vw / var(--size)));

            bottom: calc(100% * (var(--y) + .25 + (var(--z) + min(0, var(--size) - var(--h))) * .06) / var(--size));
            left: calc(100% * (var(--x) + .25) / var(--size));
            border-width: var(--pieceBorder);
            border-style: solid;
            transition: var(--animSpeed);
            box-shadow: 0 calc(var(--pieceBorder)/2 + .4em) calc(var(--pieceBorder) + .6em) var(--shadow);

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
            border-width: max(1em, var(--pieceBorder));
        }

    }

    .innersq {
        display: grid;
        grid-template-columns: min-content auto min-content;
        grid-template-rows: min-content auto min-content;
        aspect-ratio: 1;
        width: calc(100% - 2*var(--boardGap));
        border: none;
        margin: var(--boardGap);
        border-radius: var(--boardRound);
        transition: background var(--animSpeed);
    }

    .outersq {
        aspect-ratio: 1;
    }
    .outersq.odd {
        background: var(--boardLight);
    }
    .outersq.even {
        background: var(--boardDark);
    }

    .innersq:hover {
        background: var(--boardReserves) !important;
    }

    .innersq.odd {
        &.ring1 {
            background: color-mix(in srgb, var(--ring1) var(--ringOpacity), var(--boardLight) calc(100% - var(--ringOpacity)));
        }
        &.ring2 {
            background: color-mix(in srgb, var(--ring2) var(--ringOpacity), var(--boardLight) calc(100% - var(--ringOpacity)));
        }
        &.ring3 {
            background: color-mix(in srgb, var(--ring3) var(--ringOpacity), var(--boardLight) calc(100% - var(--ringOpacity)));
        }
        &.ring4 {
            background: color-mix(in srgb, var(--ring4) var(--ringOpacity), var(--boardLight) calc(100% - var(--ringOpacity)));
        }
    }

    .innersq.even {
        &.ring1 {
            background: color-mix(in srgb, var(--ring1) var(--ringOpacity), var(--boardDark) calc(100% - var(--ringOpacity)));
        }
        &.ring2 {
            background: color-mix(in srgb, var(--ring2) var(--ringOpacity), var(--boardDark) calc(100% - var(--ringOpacity)));
        }
        &.ring3 {
            background: color-mix(in srgb, var(--ring3) var(--ringOpacity), var(--boardDark) calc(100% - var(--ringOpacity)));
        }
        &.ring4 {
            background: color-mix(in srgb, var(--ring4) var(--ringOpacity), var(--boardDark) calc(100% - var(--ringOpacity)));
        }
    }



    .colLabel {
        padding: 1px 2px;
        /* font-size: 120%; */
        font-size: min(1.5vh, 2vw);

        grid-area: 3/3/3/3;
        color: var(--textLight);        
    }
    .rowLabel {
        padding: 1px 2px;
        font-size: min(1.5vh, 2vw);
        grid-area: 1/1/1/1;
        color: var(--textLight)
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
        background: var(--player1noble);
        border-color: var(--player1border);
        &.flat {
            background: var(--player1flat);
        }
    }

    .black {
        background: var(--player2noble);
        border-color: var(--player2border);
        &.flat {
            background: var(--player2flat);
        }
    }




</style>