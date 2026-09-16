
<script lang="ts">
    import { goto } from "$app/navigation";
    import { addGame, search, type GameData } from "$lib/backends/connector.svelte";
    import { GameStateStrings } from "$lib/backends/playtak_stable.svelte";

    import { Game, parsePtn, TPSPosition } from "$lib/ingame/game.svelte"
    import { addToast } from "$lib/ui/toast.svelte";


    const ptnRegex = /(?:[SFC]?[a-g][1-8](?![<+\->])|[1-8]?[a-g][1-8][<+\->][1-8]*\*?)/g
    const commentRegex = /{[^{]*}|[0-9]+\./g //also includes move numbering

    let settings: GameData = $state({
        id: 0,
        p1: "",
        p2: "",
        color: 3,
        size: 6,
        time: 600,
        inc: 15,
        scaling_inc: false,
        halfkomi: 4,
        opening: 1,
        flats: 30,
        caps: 1,
        rated: true,
        tourney: false,
        trigger: 0,
        extra: 0,
    })


    let gametype = $state(0)
    let komi = $state(2)
    let time = $state(10)
    let ptn = $state("")

    const defaultflats = [10, 15, 21, 30, 40, 50]

    $effect(
        () => {
            settings.flats = defaultflats[settings.size - 3]
            settings.caps = (settings.size - 3) >> 1
        }
    )


    function createSeek() {
        settings.halfkomi = komi * 2
        settings.rated = gametype != 0
        settings.tourney = gametype == 2
        settings.time = time * 60
        search(settings)
        goto("/")
    }

    function createScratch() {
        if (ptn == "") {
            addGame(new Game({
                id: 0,
                p1: "White",
                p2: "Black",
                size: settings.size,
                time: 0,
                inc: 0,
                scaling_inc: false,
                extra: 0,
                trigger: 0,
                color: 3,
                halfkomi: komi * 2,
                opening: 1,
                flats: settings.flats,
                caps: settings.caps,
                rated: false,
                tourney: false
            }, undefined))

        } else {
            let result = 0
            let tps = undefined

            let gameData: GameData = {
                id: 0,
                p1: "White",
                p2: "Black",
                size: -1,
                time: 0,
                inc: 0,
                scaling_inc: false,
                extra: 0,
                trigger: 0,
                color: 3,
                halfkomi: 0,
                opening: 1,
                flats: -1,
                caps: -1,
                rated: false,
                tourney: false
            }

            let ptn2 = ptn

            while (ptn2.startsWith("[")) {
                let i = ptn2.indexOf("]")
                let head = ptn2.slice(1, i)
                ptn2 = ptn2.slice(i + 1).trimStart()

                if (head.startsWith("Player1")) {
                    gameData.p1 = head.slice(9,-1)
                } else if (head.startsWith("Player2")) {
                    gameData.p2 = head.slice(9,-1)
                } else if (head.startsWith("Size")) {
                    gameData.size = parseInt(head.slice(6,-1))
                } else if (head.startsWith("Komi")) {
                    gameData.halfkomi = parseFloat(head.slice(6,-1)) * 2
                } else if (head.startsWith("Flats")) {
                    gameData.flats = parseInt(head.slice(7, -1))
                } else if (head.startsWith("Caps")) {
                    gameData.caps = parseInt(head.slice(6, -1))
                } else if (head.startsWith("Opening")) {
                    gameData.opening = ["no-swap", "swap", "double black stack"].indexOf(head.slice(9, -1))
                    if (gameData.opening == -1) {
                        addToast("unsupported opening!", true)
                        return
                    }
                } else if (head.startsWith("Clock")) {
                    //TODO
                } else if (head.startsWith("TPS")) {
                    tps = head.slice(5,-1)

                } else if (head.startsWith("Result")) {
                    result = GameStateStrings.indexOf(head.slice(8,-1))
                }
            }

            
            let startPos
            if (tps != undefined) {
                [startPos, gameData.size] = TPSPosition.fromTPS(tps, settings.flats, settings.caps)
                if (startPos == undefined) {
                    addToast("Invalid TPS", true)
                    return
                }
            }

            else if (!(gameData.size >= 3 && gameData.size <= 8)) {
                addToast("Could not determine board size", true)
                return
            }
            if (gameData.flats < 0) {
                gameData.flats = defaultflats[gameData.size-3]
            }
            if (gameData.caps < 0) {
                gameData.caps = (gameData.size - 3) >> 1
            }

            ptn2 = ptn2.replaceAll(commentRegex, "")
            let moves = ptn2.matchAll(ptnRegex)

            let game = new Game(gameData, startPos)
            game.gameState = result

            for (let move of moves) {
                let m = parsePtn(move[0])
                game.addMove(m)
            }

            addGame(game)
        }
    }


</script>

<div id="seekbox">

    <details open name="a" style="--n: 1">
        <summary class="subitem">
            Lobby Game
        </summary>
        <div class="ui_panel">
            <label>Opponent: <br/><input bind:value={settings.p2} type=text title="opponent who may accept to seek, leave blank to allow anyone to accept"/></label>
            <label>Your Color: <br/><select class="rounded_button" bind:value={settings.color}>
                <option value={3}>Random</option>
                <option value={1}>White</option>
                <option value={2}>Black</option>
            </select></label>

            <!-- presets -->

            <label>Board Size:<br/><select class="rounded_button" bind:value={settings.size}>
                <option value={3}>3x3</option>
                <option value={4}>4x4</option>
                <option value={5}>5x5</option>
                <option value={6}>6x6</option>
                <option value={7}>7x7</option>
                <option value={8}>8x8</option>
            </select></label>
            <br/>
            <label>Game Type: <br/><select class="rounded_button" bind:value={gametype} title="whether the game is rated or not, tournament is the same as rated, just used by automated systems to recognize tournament games">
                <option value={0}>Rated</option>
                <option value={1}>Unrated</option>
                <option value={2}>Tournament</option>
            </select></label>

            <label>Komi: <br/><input type=number min=0 max=4 step=.5 bind:value={komi} title="a flat score added for black when the game ends on flats"/></label>


            <label>Time: (minutes)<br/><input type=number min=1 max=180 bind:value={time}/></label>
            <label>Increment: (seconds)<br/><input type=number min=0 max=180 bind:value={settings.inc}/></label>
            <label>Extra Time: (minutes)<br/><input type=number min=0 max=60 bind:value={settings.extra} title="extra time added once at the trigger move"/></label>
            <label>Trigger: <br/><input type=number min=0 max=60 step=5 bind:value={settings.trigger} title="when extra time is given"/></label>
            <label>Flats: <br/><input type=number min=10 max=80 bind:value={settings.flats}/></label>
            <label>Capstones: <br/><input type=number min=0 max=5 bind:value={settings.caps}/></label>
          
            <label>Opening: <br/><select class="rounded_button" bind:value={settings.opening}>
                <!-- <option value={0}>no-swap</option> -->
                 <option value={1}>swap</option>
                 <option value={2}>double black stack</option>
            </select></label>
            
            <label>Scaling Increment: <br/><input type=checkbox bind:checked={settings.scaling_inc} title="scale the increment by the current move"/></label>

            <button class="rounded_button" onclick={() => createSeek()}>Create Seek</button>
        </div>

    </details>

    <details name="a" style="--n: 2">
        <summary>
            Analysis Board
        </summary>
        <div>            
            <label>Board Size:<br/><select class="rounded_button" bind:value={settings.size}>
                <option value={3}>3x3</option>
                <option value={4}>4x4</option>
                <option value={5}>5x5</option>
                <option value={6}>6x6</option>
                <option value={7}>7x7</option>
                <option value={8}>8x8</option>
            </select></label>
            <label>Komi: <br/><input type=number min=0 max=4 step=.5 bind:value={komi} title="a flat score added for black when the game ends on flats"/></label>
            <label>Flats: <br/><input type=number min=10 max=80 bind:value={settings.flats}/></label>
            <label>Capstones: <br/><input type=number min=0 max=5 bind:value={settings.caps}/></label>

            <label for=ptn >PTN/TPS:</label><textarea id=ptn rows=10 bind:value={ptn}></textarea>
            <button class="rounded_button" onclick={() => createScratch()}>Create Game</button>
        </div>
    </details>
</div>

<style>

#seekbox {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: auto 1fr;

    width: 50%;
    padding: 1% 25%;
}


@media(max-aspect-ratio: 1/1) {
    #seekbox {
        width: 100%;
        padding: 20px 0;
    }
}

details {
    display: grid;
    grid-template-columns: subgrid;
    grid-template-rows: subgrid;
    grid-column: 1 / -1;
    grid-row: 1 / span 2;
}

details::details-content {
    grid-row: 2; /* position in the second row */
    grid-column: 1 / -1; /* cover all three columns */
    padding: 0;
    z-index: 1;
    overflow: scroll;
}

details:not([open])::details-content {
        display: none;
}

summary {
    z-index: 1;
    grid-column: var(--n) / span 1;
    grid-row: 1;
    padding: 3px;
    margin: 0px 10px;
    border-style: none;
    background: var(--panel);
    border-radius: 5px 5px 0px 0px;
    color: var(--text_light);
    cursor: pointer;
    text-align: center;
    list-style: none;
}


details[open] summary {
    background: var(--ui);
    color: var(--primary);
    border: solid var(--primary);
    border-width: 0 0 2px;
    padding: 3px;
    pointer-events: none;
}


details div {
    display: grid;
    grid-template-columns: 1fr 1fr;

    background: var(--panel);
    border-style: solid;
    border-color: var(--ui);
    border-radius: 5px;
    border-width: 10px 1px;
    color: var(--text_light);
}

label {
    margin: .5em;
    * {
        padding: .2em !important;
        width: calc(100% - 1em);
    }
}

textarea {
    grid-column: 1 / 3;
    resize: none;
    margin: 0 1em 1em;
}

button {
    grid-column: 1 / 3;
    margin: 1em;

    padding: .5em;
}
</style>