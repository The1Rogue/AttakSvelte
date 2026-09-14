<script lang="ts">
    import { addToast } from "$lib/ui/toast.svelte";
    import { settings, theme, builtInThemes } from "$lib/theme.svelte";
    import Miniboard from "$lib/ingame/miniboard.svelte";
    import ColorPicker from "$lib/ui/colorPicker.svelte";
    import { onNavigate } from "$app/navigation";

    let oldPass = $state("")
    let newPass = $state("")
    let newPass2 = $state("")



    onNavigate(save)


    function save() {
        localStorage.setItem("theme", JSON.stringify(theme))
        localStorage.setItem("settings", JSON.stringify(settings))
    }

</script>

<svelte:window onbeforeunload={save}/>

<div class="settings">  
    <div class="category ui_panel">
        <div class="miniboard">
            <Miniboard/>
        </div>
        <h2>Theme</h2>

        <select class="presets rounded_button" onchange={(event) => {if (event.target.value != -1) {Object.assign(theme, builtInThemes[event.target.value])}}}>
            <option value={-1}>-- presets --</option>
            {#each builtInThemes as theme, i}
                <option value={i}>{theme.name}</option>
            {/each}
        </select>

        <details>
            <summary>UI</summary>
            <label>Primary <ColorPicker bind:color={theme.ui.primary} /></label>
            <label>Secondary <ColorPicker bind:color={theme.ui.secondary} /></label>
            <label>UI <ColorPicker bind:color={theme.ui.ui} /></label>
            <label>Accent <ColorPicker bind:color={theme.ui.accent} /></label>
            <label>Panel <ColorPicker bind:color={theme.ui.panel} /></label>
            <label>Light Text <ColorPicker bind:color={theme.ui.text_light} /></label>
            <label>Dark Text <ColorPicker bind:color={theme.ui.text_dark} /></label>
        </details>

        <details>
            <summary>Pieces</summary>
            <label>Border Width <input type="range" min=0 max=5 step=1 bind:value={theme.pieces.border_width} /></label>
            <label>Player 1 <ColorPicker bind:color={theme.pieces.white} /></label>
            <label>Player 1 Border <ColorPicker bind:color={theme.pieces.white_border} /></label>
            <label>Player 2 <ColorPicker bind:color={theme.pieces.black} /></label>
            <label>Player 2 Border <ColorPicker bind:color={theme.pieces.black_border} /></label>
            <label>Shadow <ColorPicker bind:color={theme.pieces.shadow} /></label>
        </details>
        
        <details>
            <summary>Board</summary>

            <label>Board Style <select class="rounded_button" bind:value={theme.board.style}>
                <option value={0}>Blank</option>
                <option value={-1}>Diamonds Small</option>
                <option value={-2}>Diamonds Medium</option>
                <option value={-3}>Diamonds Large</option>
                <option value={1}>Grid Small</option>
                <option value={2}>Grid Medium</option>
                <option value={3}>Grid Large</option>
            </select></label>
            <label>Checkered <input type="checkbox" bind:checked={theme.board.checker}/></label>
            <label>Board Primary <ColorPicker bind:color={theme.board.light} /></label>
            <label>Board Secondary <ColorPicker bind:color={theme.board.dark} /></label>
            <label>Board Tray <ColorPicker bind:color={theme.board.reserves} /></label>
        </details>



        <!-- <Settings settings={theme} /> -->
    </div>

    <div class="category ui_panel">
        <h2>Settings</h2>

        <label>Animation speed <div><input style="" type="range" min=0 max=500 step=25 bind:value={settings.animation_speed}/> {settings.animation_speed}ms</div></label>
        <label>Fast inputs <input type="checkbox" bind:checked={settings.fast_moves}/></label>

        <!-- <Settings settings={settings} /> -->
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
                <button class="rounded_button">Save</button>
            </form>
        </div>
    </div>

</div>

<style>
    .settings {
        display: flex;
        flex-direction: column;
        overflow-y: scroll;
        background: var(--secondary);
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

    .miniboard {
        float: inline-end;
        aspect-ratio: 1;
        width: max(25vw, 15vh);
        ~ details {
            max-width: calc(100% - 3em - max(25vw, 15vh))
        }
    }

    details, .presets {
        border: 2px solid var(--primary);
        border-radius: .5em;
        margin: .5em;
        padding: .25em .5em; 
    }

    summary {
        list-style: none;
    }

    details::details-content {
        padding: 0 2em;
        display: flex;
        flex-direction: column;
    }

    label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 2.5em;
        * {
            height: 100%;
            vertical-align:-.5em;
        }
    }

</style>