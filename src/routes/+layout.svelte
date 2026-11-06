<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_missing_attribute, a11y_no_noninteractive_element_interactions, a11y_consider_explicit_label -->
 
<script lang="ts">
	import favicon from '$lib/assets/Attak.svg';
	import '$lib/assets/global.css'

	import Chat from '$lib/chat/chatTab.svelte';
	import { toasts } from '$lib/ui/toast.svelte';
	import { theme, settings, colorString } from "$lib/theme.svelte"
	import { ACTIVE_BACKEND, connect, disconnect, games, getUsername, isConnected, timeString } from "$lib/backends/connector.svelte"

	import { fade } from "svelte/transition";
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
    import { addDirect } from '$lib/chat/chats.svelte';


	let { children } = $props();

	if ((!isConnected()) && localStorage.getItem("username") != undefined) {
		connect(localStorage.getItem("username") || "", localStorage.getItem("pass") || "")
	}

	let w = $state(1)
	let menu = $state(false)

</script>

<svelte:window bind:outerWidth={w}/>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>


<div
	style:--primary={colorString(theme.ui.primary)}
	style:--secondary={colorString(theme.ui.secondary)}
	style:--ui={colorString(theme.ui.ui)}
	style:--accent={colorString(theme.ui.accent)}
	style:--panel={colorString(theme.ui.panel)}
	style:--text_light={colorString(theme.ui.text_light)}
	style:--text_dark={colorString(theme.ui.text_dark)}

	style:--notif={"#00FF3FAF"}
	style:--warn={"#CD5C5CAF"}

	style:--board_light={colorString(theme.board.light)}
	style:--board_dark={colorString(theme.board.dark)}
	style:--board_reserves={colorString(theme.board.reserves)}
	style:--board_gap={theme.board.style > 0 ? 2 * theme.board.style-1 : 0}%
	style:--board_round={theme.board.style > 0 ? 4*(theme.board.style-1) : -50/3 * theme.board.style}%
	
	style:--piece_border={theme.pieces.border_width * .5}em
	style:--white={colorString(theme.pieces.white)}
	style:--white_border={colorString(theme.pieces.white_border)}
	style:--black={colorString(theme.pieces.black)}
	style:--black_border={colorString(theme.pieces.black_border)}

	style:--ring1={theme.board.rings > 0 ? colorString(theme.board.ring1) : "#0000"}
	style:--ring2={theme.board.rings > 1 ? colorString(theme.board.ring2) : "#0000"}
	style:--ring3={theme.board.rings > 2 ? colorString(theme.board.ring3) : "#0000"}
	style:--ring4={theme.board.rings > 3 ? colorString(theme.board.ring4) : "#0000"}
	style:--ring_opacity={theme.board.rings > 0 ? theme.board.ring_opacity : 0}%

	style:--shadow={colorString(theme.pieces.shadow)}
	style:--anim_speed={settings.animation_speed}ms
	style:background=var(--secondary)
>
<header>
	<a href="/"><img src={favicon} alt="logo"/><h1>Attak</h1></a>
	<!-- <a href="/"><img src={logo} alt="logo"/></a> -->

	{#if w > 500}
		<div style="flex-grow: 1"></div>

		<details>
			<summary class=material-symbols-outlined>group</summary>
			<div class="float online" onfocusout={() => this.open = false}>
				{#each ACTIVE_BACKEND.online as user}
					{#if user != ACTIVE_BACKEND.username}
						<div>
							<p>{user}</p>
							<button class="material-symbols-outlined" onclick={() => addDirect(user)}>chat_add_on</button>
							<button class="material-symbols-outlined" onclick={() => console.log(user)}>swords</button>
						</div>
					{/if}
				{/each}
			</div>
		</details>

		<a href="/history" class="headbutton material-symbols-outlined" title="settings">
				cloud
		</a>

		<a href="/settings" class="headbutton material-symbols-outlined" title="settings">
				settings
		</a>

		<button onclick={disconnect}>
				{getUsername()}
		</button>
	{:else}
		<button onclick={() => menu = !menu} class="material-symbols-outlined">menu</button>
	{/if}
</header>
{#if menu && w <= 500}
<div class=menu>
	<details>
		<summary><i class=material-symbols-outlined>group</i> Online Players</summary>
		<div class="online">
			{#each ACTIVE_BACKEND.online as user}
				{#if user != ACTIVE_BACKEND.username}
					<div>
						<p>{user}</p>
						<button class="material-symbols-outlined" onclick={() => addDirect(user)}>chat_add_on</button>
						<button class="material-symbols-outlined" onclick={() => console.log(user)}>swords</button>
					</div>
				{/if}
			{/each}
		</div>
	</details>
	<button onclick={() => {goto("/history"); menu=false}}><i class="material-symbols-outlined">cloud</i> games database</button>
	<button onclick={() => {goto("/settings"); menu=false}}><i class="material-symbols-outlined">settings</i> settings</button>
	<button onclick={() => {disconnect(); menu=false}}><i class="material-symbols-outlined">logout</i> log out</button>
</div>
{/if}

<div class="mainbody">
	{@render children()}
</div>

<div class="tabs">
	{#if page.url.pathname != "/game" && Object.keys(games).length > 0}
		<a class="boardpopup material-symbols-outlined" href="/game">
				<!-- <svg class="navicon" viewBox="0 0 24 24"><path d="M19 17H22V19H19V22H17V19H14V17H17V14H19V17M8 16H12V12H8V16M12 12H16V8H12V12M2 2V22H13.54C13 21.42 12.63 20.74 12.36 20H8V16H4V12H8V8H4V4H8V8H12V4H16V8H20V12.36C20.74 12.63 21.42 13 22 13.54V2H2Z"></path></svg> -->
				grid_on
		</a>
	{/if}

	{#if ACTIVE_BACKEND.outgoingSeek != undefined}
	<!-- {#if true} -->
		<div class="outgoingseek" onclick={() => ACTIVE_BACKEND.removeSeek()}>
			<p>&nbsp{ACTIVE_BACKEND.outgoingSeek.p2} {ACTIVE_BACKEND.outgoingSeek.size}s +{ACTIVE_BACKEND.outgoingSeek.halfkomi / 2} komi {timeString(ACTIVE_BACKEND.outgoingSeek)}&nbsp</p>
			<em class="material-symbols-outlined">progress_activity</em>
		</div>
	{/if}
</div>

<Chat/>

<div class="toasts">
    {#each toasts as toast}
        <div class="toast {toast[1] ? 'error': ''}" transition:fade>
                {toast[0]}
        </div>
    {/each}
</div>
</div>


<style>

a {
	color: var(--text_light);
	text-decoration: none;
}

h1 {
	margin:0;
}

img {
	margin: 0 10px 0 0 ;
	height: 100%;
	display: inline-block;
}

header {
	position: sticky;
	top: 0;
	z-index: 100;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: var(--ui);

	height: 50px;
	width: 100%;
	padding: 0 1vw;
	box-sizing: border-box;
	gap: 1vw;
}

header > * {
	display: flex;
	padding: 0 1vw;
	height: 100%;
	align-items: center;
	color: var(--text_light);
	background: 0;
	border: none;
}

.float {
	position: fixed;
	top: 50px;
	right: 0;
	width: 20em;
}

.online {
	background: var(--accent);
	padding: .5rem;
	border-radius: 5px;
	display: flex;
	flex-direction: column;
	gap: 2px;
	div {
		display: flex;
		background: var(--panel);
		padding: .1rem .5rem;
	}
	p {
		flex-grow: 1;
		margin: auto;
	}
	button {
		border: none;
		padding: 5px 10px;
		background: none;
		&:hover {
			background: var(--accent);
		}
	}
}

.menu {
	position: absolute;
	top: 50px;
	width: 100%;
	z-index: 101;
	display: flex;
	flex-direction: column;
	height: 100%;
	> * {
		background: var(--accent);
		color: var(--text_light);
		border: none;
		padding: .75em;
		font-size: 1.2em;
		summary {
			list-style: none;
			text-align: center;
		}

		i {
			vertical-align: middle;
		}
	}
	> *:hover {
			background: var(--ui);
	}
}

header > :not(div):hover {
	cursor: pointer;
	background: var(--accent);
}

.toasts {
	position: fixed;
	bottom: 10%;
	left: 50%;
	transform: translate(-50%, 0);
}

.toast {
	font-size: 2em;
	margin: 5px;
	padding: 3px 10px;
	border-radius: 20px;
	background: var(--notif);
	z-index: 101;
	color: var(--text_dark)
}

.error {
	background: var(--warn);
}

.mainbody {
	height: calc(100vh - 50px);
}

.tabs {
	z-index: 2;
	display: flex;
	flex-direction: column;
	position: fixed;
	left: 0;
	top: 15%;
	align-items: start;
	
}

.boardpopup {
	height: 32px;
	background: var(--primary);
	margin: 10px 0;
	padding: 3px;
	border-radius: 0 5px 5px 0;
	transition: padding var(--animSpeed);
	color: var(--text_dark);
	font-size: 2rem;
}

.boardpopup:hover {
	background: var(--accent);
	padding-left: 10px;
	color: var(--text_light);
}

.outgoingseek {
	background: var(--primary);
	font-size: 0;
	border-radius: 0 5px 5px 0;
	transition: padding var(--animSpeed);
	color: var(--text_dark);
	overflow: hidden;
	> p {
		font-size: 1rem;
		height: 1rem;
		padding: .5rem 0;
		transition: max-width calc(2 * var(--anim_speed));
		overflow: hidden;
		display: inline-block;
		max-width: 0;
		margin: 0;
		color: inherit;
	}
	&:hover {
		background: var(--accent);
		padding-left: 10px;
		color: var(--text_light);
		> p {
			max-width: 20rem;
		}
	}
	em {
		padding: 3px;
		font-size: 2rem;
		color: inherit;
		animation: 2s ease-in-out 1s infinite normal none running rotate;
	}
}


@keyframes rotate {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}


</style>