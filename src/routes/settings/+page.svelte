<script lang="ts">
    // import { send } from "$lib/socket.svelte"
    import { addToast } from "$lib/ui/toast.svelte";
    import { animationSpeed, builtInThemes, applyThemeString} from "$lib/theme.svelte";
    import Miniboard from "$lib/ingame/miniboard.svelte";

    let oldPass = $state("")
    let newPass = $state("")
    let newPass2 = $state("")
    let selectedTheme = $state(-1)
    let customTheme = $state("")


    function setTheme(theme: string) {
        applyThemeString(theme)
        localStorage.setItem("theme", theme)
    }

</script>


<div class="settings">  
    <div class="category ui_panel" style="min-height:25vw">
        <div class="miniboard">
            <Miniboard/>
        </div>
        <h2>UI settings</h2>

        <div class="setting">
            <h3>theme:</h3>
            <select bind:value={selectedTheme} onchange={() => setTheme(builtInThemes[selectedTheme][1])}>
                {#each builtInThemes as theme, i}
                    <option value={i}>{theme[0]}</option>
                {/each}
            </select>
            <!-- <button onclick={() => {localStorage.setItem("theme", builtInThemes[selectedTheme][1]); reloadTheme()}}> Save {builtInThemes[selectedTheme][0]} </button> -->
        </div>
        <div class="setting">
            <h3>import custom theme:</h3>
            <textarea placeholder="custom theme" bind:value={customTheme}></textarea>
            <button onclick={() => setTheme(customTheme)}>Apply</button>
        </div>
        <div class="setting">
            <h3>animation speed:</h3>
            <input type="range" bind:value={animationSpeed.speed} name="animSpeed" min="100" max="500" step="10"/>
            <label for="animSpeed">{animationSpeed.speed}ms</label>
        </div>
    </div>


    <div class="category ui_panel">
        <h2>Profile settings</h2>
        <div class=setting>
            <h3>change password:</h3>
            <form onsubmit={() => {
                if (newPass == newPass2) {
                    addToast("complain to the1Rogue about implementing this", true)
                    // send(`ChangePassword ${oldPass} ${newPass}`)
                    oldPass = ""    
                } else {
                    addToast("Passwords don't match", true)
                }
                newPass = ""
                newPass2 = ""
                }}>
                <input bind:value={oldPass} type="password" placeholder="old password" autocomplete="current-password"/>
                <input bind:value={newPass} type="password" placeholder="new password" autocomplete="new-password"/>
                <input bind:value={newPass2} type="password" placeholder="repeat new password" autocomplete="new-password"/>
                <button>Save</button>
            </form>
        </div>
    </div>

</div>

<style>
    .settings {
        display: flex;
        flex-direction: column;
        overflow-y: scroll;
        height: 100%;
    }

    .category {
        margin: 1em;
        padding: 1em;
    }

    h2 {
        margin: 0;
    }

    h3 {
        margin: 1em 0em .25em;
    }

    .setting {
        display:grid;
        grid-template-rows: auto auto;
        grid-auto-flow: column;
        justify-content: start;
        align-items: center;
        h3 {
            grid-row: 1 / 2;
        }
        * {
            grid-row: 2 / 3;
        }
    }


    .miniboard {
        float: right;
        aspect-ratio: 1;
        width: max(25vw, 15vh);
    }


</style>