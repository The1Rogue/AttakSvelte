<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_missing_attribute, a11y_no_noninteractive_element_interactions, a11y_consider_explicit_label -->
 
<script lang="ts">
	import favicon from '$lib/assets/Attak.svg';
	import '$lib/assets/global.css'

	import Chat from '$lib/chat/chatTab.svelte';
	import { toasts } from '$lib/ui/toast.svelte';
	import { currentTheme, animationSpeed } from "$lib/theme.svelte"
	import { connect, disconnect, games, getUsername, isConnected } from "$lib/backends/connector.svelte"

	import { fade } from "svelte/transition";
	import { page } from '$app/state';
	import { goto } from '$app/navigation';


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
	style:--primary={currentTheme.colors.primary}
	style:--secondary={currentTheme.colors.secondary}
	style:--ui={currentTheme.colors.ui}
	style:--accent={currentTheme.colors.accent}
	style:--panel={currentTheme.colors.panel}

	style:--boardLight={currentTheme.colors.board1}
	style:--boardDark={currentTheme.colors.board2}
	style:--boardReserves={currentTheme.colors.board3}
	style:--boardGap={currentTheme.boardStyle > 0 ? 2 * currentTheme.boardStyle-1 : 0}%
	style:--boardRound={currentTheme.boardStyle > 0 ? 4*(currentTheme.boardStyle-1) : -50/3 * currentTheme.boardStyle}%
	style:--pieceBorder={currentTheme.stoneborder * .5}em


	style:--player1={currentTheme.colors.player1}
	style:--player1road={currentTheme.colors.player1road}
	style:--player1flat={currentTheme.colors.player1flat}
	style:--player1noble={currentTheme.colors.player1special}
	style:--player1border={currentTheme.colors.player1border}

	style:--player2={currentTheme.colors.player2}
	style:--player2road={currentTheme.colors.player2road}
	style:--player2flat={currentTheme.colors.player2flat}
	style:--player2noble={currentTheme.colors.player2special}
	style:--player2border={currentTheme.colors.player2border}

	style:--ring1={currentTheme.rings > 0 ? currentTheme.colors.ring1 : "#0000"}
	style:--ring2={currentTheme.rings > 1 ? currentTheme.colors.ring2 : "#0000"}
	style:--ring3={currentTheme.rings > 2 ? currentTheme.colors.ring3 : "#0000"}
	style:--ring4={currentTheme.rings > 3 ? currentTheme.colors.ring4 : "#0000"}
	style:--ringOpacity={currentTheme.rings > 0 ? currentTheme.ringOpacity : 0}%

	style:--textLight={currentTheme.colors.textLight}
	style:--textDark={currentTheme.colors.textDark}
	style:--shadow={currentTheme.colors.umbra}
	style:--animSpeed={animationSpeed.speed}ms
	style:background=var(--secondary)
>
<header>
	<a href="/"><img src={favicon} alt="logo"/><h1>Attak</h1></a>
	<!-- <a href="/"><img src={logo} alt="logo"/></a> -->



	{#if w > 500}
		<div style="flex-grow: 1"></div>

		<a href="/history" class="headbutton material-symbols-outlined" title="settings">
				cloud
		</a>

		<a href="/settings" class="headbutton material-symbols-outlined" title="settings">
				settings
		</a>

		<!-- <svg style="margin-right:0" id="player-opp-img" class="playerimg iswhite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
				<defs>
										<path id="head" d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path>
										<clipPath id="insidehead"><use xlink:href="#head"></use></clipPath>
				</defs>
				<use xlink:href="#head" clip-path="url(#insidehead)"></use>
		</svg> -->
		<button onclick={disconnect}>
				{getUsername()}
		</button>
	{:else}
		<button onclick={() => menu = !menu} class="material-symbols-outlined">menu</button>
	{/if}
</header>
{#if menu}
<div class=menu>
	<button onclick={() => {goto("/history"); menu=false}}><i class="material-symbols-outlined">cloud</i> games database</button>
	<button onclick={() => {goto("/settings"); menu=false}}><i class="material-symbols-outlined">settings</i> settings</button>
	<button onclick={() => {disconnect(); menu=false}}><i class="material-symbols-outlined">logout</i> log out</button>
</div>
{/if}

<div class="mainbody">
	{@render children()}
</div>

{#if page.url.pathname != "/game" && Object.keys(games).length > 0}
	<a class="boardpopup material-symbols-outlined" href="/game">
			<!-- <svg class="navicon" viewBox="0 0 24 24"><path d="M19 17H22V19H19V22H17V19H14V17H17V14H19V17M8 16H12V12H8V16M12 12H16V8H12V12M2 2V22H13.54C13 21.42 12.63 20.74 12.36 20H8V16H4V12H8V8H4V4H8V8H12V4H16V8H20V12.36C20.74 12.63 21.42 13 22 13.54V2H2Z"></path></svg> -->
			grid_on
	</a>
{/if}

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
	color: var(--textLight);
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
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: var(--ui);

	height: 50px;
	width: 100%;
}

header > * {
	display: flex;
	margin: 0 1vw;
	padding: 0 1vw;
	height: 100%;
	align-items: center;
	color: var(--textLight);
	background: 0;
	border: none;
}

/* @media(max-width: 750px) {
	header > * + * {
			display: none;
	}
} */

.menu {
	position: absolute;
	top: 50px;
	width: 100%;
	z-index: 101;
	display: flex;
	flex-direction: column;
	height: 100%;
	button {
			background: var(--accent);
			color: var(--textLight);
			border: none;
			padding: .75em;
			font-size: 1.2em;
			i {
					vertical-align: middle;
			}
	}
	button:hover {
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
	background: #00ff3FAF;
	z-index: 101;
	color: var(--textDark)
}

.error {
	background: indianred;
}

.mainbody {
	height: calc(100vh - 50px);
}

.boardpopup {
	z-index: 2;
	position: fixed;
	left: 0;
	top: 15%;
	height: 32px;
	background: var(--primary);
	margin: 10px 0;
	padding: 3px;
	border-radius: 0 5px 5px 0;
	transition: padding var(--animSpeed);
	color: var(--textDark);
	font-size: 2em;
}

.boardpopup:hover {
	background: var(--accent);
	padding-left: 10px;
	color: var(--textLight);
}

</style>