
<script lang="ts">
    // import { attempt_connect } from "$lib/socket.svelte"
    import { connect } from "$lib/backends/connector.svelte";

    let registerState = $state(false)
    let username: string = $state("")
    let password: string = $state("")
    let email: string = $state("")

    function login() {
        localStorage.setItem("username", username);
        localStorage.setItem("pass", password);
        connect(username, password)
    }

    function loginGuest() {
        localStorage.setItem("username", "Guest");
        let token = ""
        if (window.crypto) {
            const a = new Uint32Array(4)
            crypto.getRandomValues(a)
            console.log("found crypto: " + a)
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 5; j++) {
                    token += String.fromCharCode(97 + a[i] % 26)
                    a[i] = Math.floor(a[i]/26)
                }
            }
        } else {
            console.log("crypto not found! using guest without token!")
        }
        localStorage.setItem("pass", token);
        connect("Guest", token)
    }

    function register() {
        console.log("attempting register")
    }

</script>


<div class="loginholder"> 
    {#if registerState}
        <label class="input_label" for="username">
            Username:
            <input type="text" id="username" name="username" bind:value={username}/>
        </label>
        <label class="input_label" for="email">
            Email:
            <input type="email" id="email" name="email" bind:value={email}/>
        </label>
        
        <button class="main rounded_button" onclick={register}> Register > </button>
        <button class="small rounded_button" onclick={() => registerState = false}> Login </button>
    {:else}
        <label class="input_label" for="username">
            Username:
            <input type="text" id="username" name="username" autocomplete="username" bind:value={username}/>
        </label>
        <label class="input_label" for="password">
            Password:
            <input type="password" id="password" name="password" autocomplete="current-password" bind:value={password}/>
        </label>

        <button class="main rounded_button" onclick={login}> Login > </button>
        <div>
            <button class="small rounded_button" onclick={loginGuest}> Guest login </button>
            <button class="small rounded_button" onclick={() => registerState = true}> Register </button>
        </div>
        
    {/if}
</div>

<style>
    .loginholder {
        background: var(--panel);
        color: var(--textLight);
        border: 1px solid var(--ui);
        padding: 20px;
        border-radius: 5px;

        display: flex;
        flex-direction: column;
        align-items: start;
        justify-content: center;
        gap: 10px;
    }


    label {
        width: 100%;
        font-size: 1.8em;
        display: flex;
    }

    input {
        width: 0;
        flex-grow: 1;
        font-size: .8em;
    }

    .small {
        font-size: .8em;
        padding: 2px 5px;
    }

    .main {
        font-size: 1.8em;
        padding: 4px 12px
    }

    .main + div {
        align-self: flex-end;
    }

</style>