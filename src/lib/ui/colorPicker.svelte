
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_autofocus, state_referenced_locally -->

<script lang="ts">
    import { colorString } from "$lib/theme.svelte";


    let { color = $bindable() } = $props()

    let pickerOpen = $state(false)


    let v = $state(0)
    let h = $state(0)
    let c = 0
    let min = Math.min(color[0], color[1], color[2])
    if (color[0] > color[1] && color[0] > color[2]) {
        v = color[0] / 255
        c = color[0] - min
        h = c == 0 ? 0 : (((color[1] - color[2]) / c) % 6) / 6
    } else if (color[1] > color[2]) {
        v = color[1] / 255
        c = color[1] - min
        h = c == 0 ? 0 : (((color[2] - color[0]) / c) + 2) / 6
    } else {
        v = color[2] / 255
        c = color[2] - min
        h = c == 0 ? 0 : (((color[0] - color[1]) / c) + 4) / 6
    }
    
    let s = $state(v == 0 ? 0 : c / 255 / v)


    function recalc() {
        let k1 = (1 + h*6) % 6
        let k3 = (3 + h*6) % 6
        let k5 = (5 + h*6) % 6

        color[0] = (v - v*s*Math.max(0, Math.min(k5, 4-k5, 1))) * 255
        color[1] = (v - v*s*Math.max(0, Math.min(k3, 4-k3, 1))) * 255
        color[2] = (v - v*s*Math.max(0, Math.min(k1, 4-k1, 1))) * 255
    }


    function clickSV(event: any) {
        if (event.buttons == 0) return
        s = 1 - event.offsetX / event.target.width.baseVal.value
        v = 1 - event.offsetY / event.target.height.baseVal.value        
        recalc()
    } 
    function clickH(event: any) {
        if (event.buttons == 0) return
        h = event.offsetX / event.target.clientWidth
        recalc()
    }

    function clickA(event: any) {
        if (event.buttons == 0) return
        color[3] = 255 - 255 * event.offsetX / event.target.clientWidth
    }
</script>

<div onclick={() => pickerOpen = true} class="preview" style:background={colorString(color)}></div>

{#if pickerOpen}
<div class="picker" autofocus tabindex="0" onfocusout={() => pickerOpen = false}>
    <svg width="30vh" height="30vh" onmousedown={clickSV} onmousemove={clickSV}>
        <defs>
            <linearGradient id="saturation" gradientTransform="rotate(0)">
                <stop offset="0"  stop-color="hsl({h}turn, 100%, 50%)" />
                <stop offset="100%" stop-color="#FFFFFF" />
            </linearGradient>
            <linearGradient id="value" gradientTransform="rotate(90)">
                <stop offset="0"  stop-color="#FFFFFF" />
                <stop offset="100%" stop-color="#000000" />
            </linearGradient>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url('#saturation')" />
        <rect x="0" y="0" width="100%" height="100%" fill="url('#value')" style="mix-blend-mode: multiply" />


        <circle cx="{100 - 100 * s}%" cy="{100 - 100 * v}%" r="3" fill="#0000" stroke="#fff"/>
    </svg>

    <div class="hue slider" onmousedown={clickH} onmousemove={clickH}>
        <div class="circle" style:left={`${h*100}%`}></div>
    </div>

    <div class="alpha slider" onmousedown={clickA} onmousemove={clickA}>
        <div class="circle" style:left={`${100 - color[3] / 2.55}%`}></div>
    </div>
</div>
{/if}

<style>

    svg * {
        pointer-events: none;
    }

    .picker {
        position: fixed;
        right: 10%;
        top: 50%;
        transform: translateY(-50%);
        z-index: 100;
        background: var(--panel);
        padding: 1em;
        border: 2px solid var(--primary);
        border-radius: .5em;
    }

    .preview {
        align-self: stretch;
        margin: 2px;
        border-radius: 15%;
        aspect-ratio: 1;
    }

    .slider {
        position: relative;
        width: 100%;
        height: 10px;
        background: #fff7;
        margin: 10px 0;
        border-radius: 1em;
    }

    .hue {
        background: linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000);
    }

    .alpha {
        background: linear-gradient(to right, #ffff, #fff0) ;
    }

    .circle {
        position: absolute;
        top: calc(-10% - 2px);
        height: 120%;
        transform: translateX(-50%);
        aspect-ratio: 1;
        border: 2px solid #fff;
        pointer-events: none;
        border-radius: 50%;
    }

</style>