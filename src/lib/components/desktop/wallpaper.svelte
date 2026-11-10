<script lang="ts">
	import { flushSync, onMount, untrack } from 'svelte';

	import buildingsUrl from '#lib/assets/buildings.svg?no-inline';
	import carUrl from '#lib/assets/desktop/car.svg?no-inline';
	import cloud1Url from '#lib/assets/desktop/cloud1.svg?no-inline';
	import cloud2Url from '#lib/assets/desktop/cloud2.svg?no-inline';
	import cloud3Url from '#lib/assets/desktop/cloud3.svg?no-inline';
	import cloud4Url from '#lib/assets/desktop/cloud4.svg?no-inline';
	import dogUrl from '#lib/assets/desktop/dog.svg?no-inline';
	import houseUrl from '#lib/assets/desktop/house-alone.svg?no-inline';
	import peopleUrl from '#lib/assets/desktop/people.svg?no-inline';
	import runnerUrl from '#lib/assets/desktop/runner.svg?no-inline';
	import sunUrl from '#lib/assets/desktop/sun.svg?no-inline';
	import treesUrl from '#lib/assets/trees.svg?no-inline';
	import { getDesktop } from '#lib/desktop/desktop.svelte.js';
	import type { SceneName } from '#lib/desktop/types.js';

	type Cloud = {
		src: string;
		width: number;
		top: number;
		duration: number;
		delay: number;
		opacity: number;
		rest: number;
	};

	type Bird = {
		id: number;
		size: number;
		top: number;
		duration: number;
		delay: number;
		cycle: number;
		phase: number;
		y1: number;
		y2: number;
		y3: number;
		rest: number;
	};

	type Scene =
		| { id: number; kind: 'plane' }
		| { id: number; kind: 'balloon' }
		| { id: number; kind: 'ufo'; style: string };

	const SUN_CLICKS_NEEDED = 5;
	const SUN_CLICK_WINDOW_MS = 3000;
	const SUNSET_MS = 14000;
	const PLANE_MS = 22500;
	const BALLOON_MS = 36500;
	const UFO_MS = 13000;
	const UFO_WIDTH = 90;
	const UFO_BEAM_TOP = 32;
	const UFO_BEAM_TO_HOUSE = 130;
	const UFO_LIFT_MS = 2000;
	const UFO_LIFT_STAGGER_MS = 550;
	const UFO_DROP_MS = 900;
	const UFO_DROP_STAGGER_MS = 450;
	const UFO_LIFT_START = 0.39;
	const UFO_JOG_START = 0.24;
	const JOG_STOP_FRACTION = 0.22;
	const JOG_MIN_RUN = 60;
	const JOG_SPEED = 120;
	const FLOCK_SIZE = 7;
	const LOOP_MIN_MS = 14000;
	const LOOP_SPREAD_MS = 16000;
	const UFO_CHANCE = 0.06;
	const RANDOM_SCENES: SceneName[] = ['jog', 'plane', 'balloon', 'flock'];
	const BANNER_STRIPS = Array.from({ length: 38 }, (_, index) => index);
	const ROPE_STRIPS = Array.from({ length: 10 }, (_, index) => index);

	const CLOUDS: Cloud[] = [
		{ src: cloud1Url, width: 170, top: 10, duration: 70, delay: -8, opacity: 0.16, rest: 12 },
		{ src: cloud2Url, width: 96, top: 36, duration: 96, delay: -52, opacity: 0.11, rest: 38 },
		{ src: cloud4Url, width: 230, top: 52, duration: 130, delay: -95, opacity: 0.09, rest: 62 },
		{ src: cloud3Url, width: 120, top: 20, duration: 84, delay: -33, opacity: 0.13, rest: 48 },
		{ src: cloud2Url, width: 70, top: 66, duration: 110, delay: -70, opacity: 0.1, rest: 24 },
	];

	function makeBird(id: number, values: number[], rest = 0): Bird {
		const [size, top, duration, delay, cycle, phase, y1, y2, y3] = values;

		return { id, size, top, duration, delay, cycle, phase, y1, y2, y3, rest };
	}

	const BIRDS: Bird[] = [
		makeBird(1, [30, 26, 25, -3, 2.3, -0.2, -7, -3, -9], 18),
		makeBird(2, [22, 31, 27.5, -1.2, 1.9, -0.9, -4, -10, -5], 42),
		makeBird(3, [18, 36, 30, -6.5, 2.7, -1.6, -9, -6, -13], 66),
		makeBird(4, [24, 22, 33, -19, 2.1, -0.5, 3, -4, 1], 30),
	];

	// Deterministic, so the stars sit at the same spots on every sunset.
	const STARS = Array.from({ length: 26 }, (_, index) => ({
		id: index,
		left: (index * 37 + 11) % 97,
		top: (index * 23 + 7) % 62,
		scale: 1 + (index % 3) * 0.5,
		delay: -(index % 7) * 0.3,
	}));

	const desk = getDesktop();

	let wall = $state<HTMLDivElement>();
	let sunBox = $state<HTMLDivElement>();
	let town = $state<HTMLDivElement>();
	let stage = $state<HTMLDivElement>();
	let houseEl = $state<HTMLImageElement>();
	let peopleEl = $state<HTMLImageElement>();
	let carEl = $state<HTMLImageElement>();
	let runnerEl = $state<HTMLImageElement>();
	let dogEl = $state<HTMLImageElement>();

	let scenes = $state.raw<Scene[]>([]);
	let flock = $state.raw<Bird[]>([]);
	let jogging = $state(false);
	let ufoBusy = false;
	let sunsetting = $state(false);
	let sunDrop = $state('');

	let nextId = 0;
	let sunClicks: number[] = [];
	let timers: ReturnType<typeof setTimeout>[] = [];
	let animations: Animation[] = [];
	let loopTimer: ReturnType<typeof setTimeout> | undefined;

	function later(action: () => void, delay: number) {
		const timer = setTimeout(() => {
			timers = timers.filter((other) => other !== timer);
			action();
		}, delay);

		timers.push(timer);
	}

	function animate(
		element: HTMLElement,
		keyframes: Keyframe[],
		options: KeyframeAnimationOptions,
		onDone?: () => void,
	): Animation {
		const animation = element.animate(keyframes, options);

		animations.push(animation);
		animation.onfinish = () => {
			// An animation that keeps its end state stays listed until it is cancelled on purpose.
			if (options.fill !== 'forwards') forget(animation);

			onDone?.();
		};

		return animation;
	}

	function forget(animation: Animation) {
		animations = animations.filter((other) => other !== animation);
	}

	/** Ends everything that is running and removes every spawned element. */
	function stopAll() {
		timers.forEach(clearTimeout);
		timers = [];

		animations.forEach((animation) => animation.cancel());
		animations = [];

		scenes = [];
		flock = [];
		jogging = false;
		ufoBusy = false;
		sunsetting = false;
	}

	function spawn(scene: Scene, duration: number) {
		scenes = [...scenes, scene];
		later(() => remove(scene.id), duration);
	}

	function remove(id: number) {
		scenes = scenes.filter((scene) => scene.id !== id);
	}

	/** Scenes need the wallpaper to be laid out, so a wallpaper that was just switched on is flushed first. */
	function canPlay(): boolean {
		if (!wall || !desk.wallpaper || desk.reducedMotion || document.hidden) return false;

		flushSync();

		return true;
	}

	// ------------------------------------------------------------------ scenes

	function jog() {
		if (jogging) return;
		if (!wall || !dogEl || !runnerEl) return;

		const wallRect = wall.getBoundingClientRect();
		const dogRect = dogEl.getBoundingClientRect();
		const far = Math.max(
			JOG_MIN_RUN,
			dogRect.left - wallRect.left - wallRect.width * JOG_STOP_FRACTION,
		);
		const duration = ((far * 2) / JOG_SPEED) * 1000;

		// They turn round, run left across the town, turn again and run back to where they stood.
		const keyframes: Keyframe[] = [
			{ transform: 'translateX(0) scaleX(-1)' },
			{ transform: `translateX(${-far}px) scaleX(-1)`, offset: 0.5 },
			{ transform: `translateX(${-far}px) scaleX(1)`, offset: 0.5 },
			{ transform: 'translateX(0) scaleX(1)' },
		];

		jogging = true;
		animate(dogEl, keyframes, { duration, easing: 'linear' });
		animate(runnerEl, keyframes, { duration, easing: 'linear' }, () => {
			jogging = false;
		});
	}

	// Only one plane and one balloon are in the sky at a time; asking again while one is up is ignored.
	function isInSky(kind: 'plane' | 'balloon'): boolean {
		return scenes.some((scene) => scene.kind === kind);
	}

	function plane() {
		if (isInSky('plane')) return;

		spawn({ id: nextId++, kind: 'plane' }, PLANE_MS);
	}

	function balloon() {
		if (isInSky('balloon')) return;

		spawn({ id: nextId++, kind: 'balloon' }, BALLOON_MS);
	}

	function randomBird(index: number): Bird {
		const duration = 9 + Math.random() * 5;
		const delay = index * 0.35;
		const values = [
			14 + Math.random() * 16,
			12 + Math.random() * 40,
			duration,
			delay,
			1.5 + Math.random(),
			-Math.random() * 2,
			-6 + Math.random() * 8,
			-12 + Math.random() * 10,
			-16 + Math.random() * 12,
		];

		return makeBird(nextId++, values);
	}

	function sweepFlock() {
		const birds = Array.from({ length: FLOCK_SIZE }, (_, index) => randomBird(index));

		flock = [...flock, ...birds];

		for (const flying of birds) {
			const lifetime = (flying.duration + flying.delay) * 1000 + 200;

			later(() => {
				flock = flock.filter((other) => other.id !== flying.id);
			}, lifetime);
		}
	}

	function ufo() {
		if (ufoBusy) return;
		if (!wall || !town || !stage) return;

		const wallRect = wall.getBoundingClientRect();
		const stageRect = stage.getBoundingClientRect();
		const groundWidth = parseFloat(getComputedStyle(town).borderBottomWidth);
		const ground = town.getBoundingClientRect().bottom - groundWidth - wallRect.top;

		// It hovers over the house and the beam reaches all the way down to the ground line.
		const x = stageRect.left - wallRect.left + stageRect.width * 0.845 - UFO_WIDTH / 2;
		const y = stageRect.top - wallRect.top - UFO_BEAM_TO_HOUSE;
		const beamHeight = ground - y - UFO_BEAM_TOP;
		const style = `--ux:${x}px;--uy:${y}px;--bh:${beamHeight}px;--bw:${beamHeight * 0.95}px`;

		ufoBusy = true;
		spawn({ id: nextId++, kind: 'ufo', style }, UFO_MS + 500);

		// The runner and the dog get away; the car, the people and the house are taken up the
		// beam, then dropped back from the sky.
		later(jog, UFO_MS * UFO_JOG_START);

		const pieces = [carEl, peopleEl, houseEl];
		const lastDrop = pieces.length - 1;

		pieces.forEach((piece, index) => {
			if (piece) liftAndDrop(piece, index, { wallRect, x, y }, index === lastDrop);
		});
	}

	function liftAndDrop(
		piece: HTMLElement,
		index: number,
		saucer: { wallRect: DOMRect; x: number; y: number },
		last: boolean,
	) {
		const { wallRect, x, y } = saucer;
		const rect = piece.getBoundingClientRect();
		const dx = wallRect.left + x + UFO_WIDTH / 2 - (rect.left + rect.width / 2);
		const dy = wallRect.top + y + UFO_BEAM_TOP - 2 - rect.bottom;
		const turn = index % 2 ? 14 : -14;

		const lifted = animate(
			piece,
			[
				{ transform: 'translate(0, 0) scale(1)', opacity: 1 },
				{
					transform: `translate(${dx * 0.6}px, ${dy * 0.6}px) scale(0.6) rotate(${turn}deg)`,
					opacity: 1,
					offset: 0.6,
				},
				{ transform: `translate(${dx}px, ${dy}px) scale(0.08)`, opacity: 0 },
			],
			{
				duration: UFO_LIFT_MS,
				delay: UFO_MS * UFO_LIFT_START + index * UFO_LIFT_STAGGER_MS,
				easing: 'ease-in',
				fill: 'forwards',
			},
		);

		// The saucer is gone by now; each piece falls back from above the screen and bounces once.
		later(
			() => {
				lifted.cancel();
				forget(lifted);

				animate(
					piece,
					[
						{
							transform: `translateY(${-(rect.bottom - wallRect.top) - 80}px)`,
							easing: 'cubic-bezier(0.5, 0, 1, 0.6)',
						},
						{ transform: 'translateY(0)', offset: 0.6, easing: 'ease-out' },
						{ transform: 'translateY(-14px)', offset: 0.78, easing: 'ease-in' },
						{ transform: 'translateY(0)' },
					],
					{ duration: UFO_DROP_MS },
					last
						? () => {
								ufoBusy = false;
							}
						: undefined,
				);
			},
			UFO_MS + 2500 + index * UFO_DROP_STAGGER_MS,
		);
	}

	function sunset() {
		if (!canPlay() || sunsetting || !wall || !sunBox) return;

		const sun = sunBox.getBoundingClientRect();
		const wallRect = wall.getBoundingClientRect();

		sunDrop = `${wallRect.bottom - sun.top + 10}px`;
		sunsetting = true;
		later(() => {
			sunsetting = false;
		}, SUNSET_MS + 100);
	}

	function play(name: SceneName): boolean {
		if (!canPlay()) return false;

		switch (name) {
			case 'jog':
				jog();
				break;
			case 'plane':
				plane();
				break;
			case 'balloon':
				balloon();
				break;
			case 'flock':
				sweepFlock();
				break;
			case 'ufo':
				ufo();
				break;
		}

		return true;
	}

	// ---------------------------------------------------------------- triggers

	function pokeSun() {
		const now = Date.now();

		sunClicks = sunClicks.filter((time) => now - time < SUN_CLICK_WINDOW_MS).concat(now);

		if (sunClicks.length < SUN_CLICKS_NEEDED) return;

		sunClicks = [];
		sunset();
	}

	function playRandom() {
		if (document.hidden) return;

		const roll = Math.random();
		const name =
			roll < UFO_CHANCE ? 'ufo' : RANDOM_SCENES[Math.floor(Math.random() * RANDOM_SCENES.length)];

		play(name);
	}

	function scheduleRandom() {
		clearTimeout(loopTimer);

		loopTimer = setTimeout(
			() => {
				playRandom();
				scheduleRandom();
			},
			LOOP_MIN_MS + Math.random() * LOOP_SPREAD_MS,
		);
	}

	// A background tab animates nothing: scenes end and the random loop pauses until it is visible.
	function followVisibility() {
		if (document.hidden) {
			clearTimeout(loopTimer);
			stopAll();
		} else {
			scheduleRandom();
		}
	}

	// Switching the wallpaper off, or asking for reduced motion, ends whatever is playing.
	$effect(() => {
		if (desk.wallpaper && !desk.reducedMotion) return;

		untrack(stopAll);
	});

	onMount(() => {
		const unregister = desk.registerScenes({ play, sunset });

		scheduleRandom();

		return () => {
			unregister();
			clearTimeout(loopTimer);
			stopAll();
		};
	});
</script>

<svelte:document onvisibilitychange={followVisibility} />

{#snippet birdSvg(b: Bird, once: boolean)}
	<svg
		class="bd"
		class:once
		viewBox="-21 -14 42 24"
		style="--s:{b.size}px;--top:{b.top}%;--dur:{b.duration}s;--del:{b.delay}s;--cyc:{b.cycle}s;--ph:{b.phase}s;--y1:{b.y1}vh;--y2:{b.y2}vh;--y3:{b.y3}vh;--rest:{b.rest}%"
		aria-hidden="true">
		<g class="bob">
			<path
				class="wl"
				d="M0 0C-5-6-12-9-20-7-14-5-9-1-1 3z" />
			<path
				class="wr"
				d="M0 0C5-6 12-9 20-7 14-5 9-1 1 3z" />
			<path d="M-2.2-1.5Q0-4 2.2-1.5L1.6 4.5 3.2 8H-3.2L-1.6 4.5z" />
		</g>
	</svg>
{/snippet}

<div
	class="wall"
	bind:this={wall}
	hidden={!desk.wallpaper}
	aria-hidden="true">
	<!-- The sun is a hidden easter egg (five clicks make it set), so it is not a keyboard control. -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="sunw"
		class:set={sunsetting}
		style:--sd={sunDrop}
		bind:this={sunBox}
		onclick={pokeSun}>
		<img
			class="sun"
			src={sunUrl}
			alt=""
			draggable="false" />
	</div>

	{#each CLOUDS as cloud (`${cloud.src}-${cloud.top}`)}
		<img
			class="cl"
			src={cloud.src}
			alt=""
			draggable="false"
			style="width:{cloud.width}px;top:{cloud.top}%;animation-duration:{cloud.duration}s;animation-delay:{cloud.delay}s;opacity:{cloud.opacity};--rest:{cloud.rest}%" />
	{/each}

	{#each BIRDS as flying (flying.id)}
		{@render birdSvg(flying, false)}
	{/each}

	<div
		class="town"
		bind:this={town}>
		<img
			class="buildings"
			src={buildingsUrl}
			alt=""
			draggable="false" />
		<img
			class="trees"
			src={treesUrl}
			alt=""
			draggable="false" />
		<div
			class="hs"
			bind:this={stage}>
			<img
				class="pc house"
				bind:this={houseEl}
				src={houseUrl}
				alt=""
				draggable="false" />
			<img
				class="pc people"
				bind:this={peopleEl}
				src={peopleUrl}
				alt=""
				draggable="false" />
			<img
				class="pc car"
				bind:this={carEl}
				src={carUrl}
				alt=""
				draggable="false" />
			<img
				class="pal dog"
				class:hop={jogging}
				bind:this={dogEl}
				src={dogUrl}
				alt=""
				draggable="false" />
			<img
				class="pal run"
				class:hop={jogging}
				bind:this={runnerEl}
				src={runnerUrl}
				alt=""
				draggable="false" />
		</div>
	</div>

	{#each flock as flying (flying.id)}
		{@render birdSvg(flying, true)}
	{/each}

	{#each scenes as scene (scene.id)}
		{#if scene.kind === 'plane'}
			<div class="ev ev-plane">
				<div class="tow">
					<div class="bn">
						{#each BANNER_STRIPS as strip (strip)}
							<i style="--i:{strip}"></i>
						{/each}
					</div>
					<div class="rope">
						{#each ROPE_STRIPS as strip (strip)}
							<i style="--j:{strip}"></i>
						{/each}
					</div>
					<svg
						class="pl"
						viewBox="0 0 54 28">
						<path d="M2 15q3-5 12-5h22q10 0 14 5-5 5-14 5H10q-6 0-8-5z" />
						<path d="M22 11L15 1h7l11 10zM23 19l-6 8h6l10-8zM4 12L1 4h5l5 7z" />
						<path
							d="M36 11.5h7l3 2.5h-9z"
							fill="#fff" />
						<ellipse
							class="prop"
							cx="51.5"
							cy="15"
							rx="1.3"
							ry="8" />
					</svg>
				</div>
			</div>
		{:else if scene.kind === 'balloon'}
			<div class="ev ev-balloon">
				<svg viewBox="0 0 40 60">
					<path d="M20 2c11 0 17 8 17 17 0 10-9 17-13 23h-8C12 36 3 29 3 19 3 10 9 2 20 2z" />
					<path
						d="M14 3c-4 9-4 26 3 38M26 3c4 9 4 26-3 38"
						stroke="#fff"
						stroke-width="1.5"
						fill="none" />
					<path
						d="M15 42l1 8M25 42l-1 8"
						stroke="#000"
						fill="none" />
					<rect
						x="14"
						y="50"
						width="12"
						height="8"
						rx="1" />
				</svg>
			</div>
		{:else}
			<div
				class="ev ev-ufo"
				style={scene.style}>
				<svg viewBox="0 0 90 40">
					<path d="M27 21a18 16 0 0 1 36 0z" />
					<ellipse
						cx="45"
						cy="25"
						rx="43"
						ry="9" />
					<circle
						cx="18"
						cy="25"
						r="2.2"
						fill="#fff" />
					<circle
						cx="36"
						cy="27.5"
						r="2.2"
						fill="#fff" />
					<circle
						cx="54"
						cy="27.5"
						r="2.2"
						fill="#fff" />
					<circle
						cx="72"
						cy="25"
						r="2.2"
						fill="#fff" />
				</svg>
				<i class="beam"></i>
			</div>
		{/if}
	{/each}

	{#if sunsetting}
		<div class="ev ev-night"></div>
		<div class="ev ev-stars">
			{#each STARS as star (star.id)}
				<i
					style="left:{star.left}%;top:{star.top}%;scale:{star.scale};animation-delay:{star.delay}s"
				></i>
			{/each}
		</div>
	{/if}
</div>

<style>
	.wall {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		filter: var(--wallf, none);
	}

	/* ------------------------------------------------------------------ sky */

	.sunw {
		position: absolute;
		top: 28px;
		right: 190px;
		width: clamp(90px, 12vw, 150px);
		cursor: pointer;
		pointer-events: auto;
	}

	.sun {
		display: block;
		width: 100%;
		opacity: 0.85;
		animation: wspin 80s linear infinite;
	}

	@keyframes wspin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Sunset: the sun sinks behind the town, a few stars come out, then it rises again. */
	.sunw.set {
		animation: sunset 14s cubic-bezier(0.45, 0, 0.55, 1);
	}

	@keyframes sunset {
		0%,
		100% {
			transform: translateY(0);
		}

		32%,
		68% {
			transform: translateY(var(--sd));
		}
	}

	.ev-night {
		inset: 0;
		background: #000;
		opacity: 0;
		animation: night 14s ease-in-out forwards;
	}

	@keyframes night {
		0%,
		100% {
			opacity: 0;
		}

		32%,
		68% {
			opacity: 0.2;
		}
	}

	.ev-stars {
		inset: 0;
		opacity: 0;
		animation: stars 14s ease-in-out forwards;
	}

	@keyframes stars {
		0%,
		22%,
		78%,
		100% {
			opacity: 0;
		}

		36%,
		64% {
			opacity: 1;
		}
	}

	.ev-stars i {
		position: absolute;
		width: 5px;
		height: 5px;
		background: #000;
		clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
		animation: twinkle 1.6s ease-in-out infinite alternate;
	}

	@keyframes twinkle {
		to {
			opacity: 0.4;
			transform: scale(0.4);
		}
	}

	.cl {
		position: absolute;
		left: -240px;
		animation: drift linear infinite;
	}

	@keyframes drift {
		to {
			transform: translateX(calc(100vw + 280px));
		}
	}

	/* Birds: each has its own route, speed and wing rhythm (three beats, then a short glide). */
	.bd {
		position: absolute;
		top: var(--top);
		left: -60px;
		width: var(--s);
		overflow: visible;
		opacity: 0.82;
		animation: fly var(--dur) linear var(--del) infinite;
	}

	.bd.once {
		animation-iteration-count: 1;
		animation-fill-mode: both;
	}

	@keyframes fly {
		0% {
			transform: translate(0, 0) rotate(-4deg);
		}

		35% {
			transform: translate(38vw, var(--y1)) rotate(-7deg);
		}

		70% {
			transform: translate(76vw, var(--y2)) rotate(2deg);
		}

		100% {
			transform: translate(calc(100vw + 120px), var(--y3)) rotate(-3deg);
		}
	}

	.bd .wl,
	.bd .wr,
	.bd .bob {
		animation: var(--cyc) var(--ph) infinite both;
	}

	.bd .wl {
		animation-name: wing-left;
	}

	.bd .wr {
		animation-name: wing-right;
	}

	.bd .bob {
		animation-name: bob;
	}

	@keyframes wing-left {
		0%,
		24%,
		48% {
			transform: rotate(30deg) scaleX(0.86);
			animation-timing-function: cubic-bezier(0.5, 0, 0.9, 0.6);
		}

		10%,
		34%,
		58% {
			transform: rotate(-34deg) scaleX(0.8);
			animation-timing-function: cubic-bezier(0.2, 0.5, 0.4, 1);
		}

		72%,
		100% {
			transform: rotate(9deg) scaleX(1);
		}
	}

	@keyframes wing-right {
		0%,
		24%,
		48% {
			transform: rotate(-30deg) scaleX(0.86);
			animation-timing-function: cubic-bezier(0.5, 0, 0.9, 0.6);
		}

		10%,
		34%,
		58% {
			transform: rotate(34deg) scaleX(0.8);
			animation-timing-function: cubic-bezier(0.2, 0.5, 0.4, 1);
		}

		72%,
		100% {
			transform: rotate(-9deg) scaleX(1);
		}
	}

	@keyframes bob {
		0%,
		24%,
		48% {
			transform: translateY(1.6px);
		}

		10%,
		34%,
		58% {
			transform: translateY(-1.8px);
		}

		72% {
			transform: translateY(0);
		}

		100% {
			transform: translateY(2.2px);
		}
	}

	/* ----------------------------------------------------------------- town */

	.town {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		padding: 0 4vw;
		border-bottom: 8px solid #000;
		opacity: 0.92;
	}

	/* Everything stands one pixel into the ground line: no gap, nothing sunk. */
	.town > * {
		margin-bottom: -1px;
	}

	.buildings {
		width: clamp(110px, 15vw, 190px);
	}

	.trees {
		width: clamp(80px, 10vw, 140px);
	}

	/* The stage holds the five pieces at the places they had in the original drawing. */
	.hs {
		position: relative;
		width: clamp(170px, 24vw, 320px);
		aspect-ratio: 397 / 65;
	}

	.pal,
	.pc {
		position: absolute;
		transform-origin: 50% 100%;
	}

	.house {
		top: 0;
		left: 75.945%;
		width: 17.003%;
	}

	.people {
		top: 64.615%;
		left: 69.27%;
		width: 4.282%;
	}

	.car {
		top: 63.077%;
		left: 93.577%;
		width: 6.423%;
	}

	.run {
		top: 64.615%;
		left: 22.292%;
		width: 4.786%;
	}

	.dog {
		top: 78.462%;
		left: 0;
		width: 3.652%;
	}

	.pal.hop {
		animation: hop 0.3s cubic-bezier(0.3, 0, 0.7, 1) infinite alternate;
	}

	.pal.dog.hop {
		animation-duration: 0.22s;
	}

	@keyframes hop {
		from {
			translate: 0 0;
		}

		to {
			translate: 0 -3px;
		}
	}

	/* --------------------------------------------------------------- scenes */

	.ev {
		position: absolute;
		pointer-events: none;
	}

	@keyframes cross {
		to {
			transform: translateX(calc(100vw + 340px));
		}
	}

	@keyframes sway {
		from {
			transform: rotate(-4deg);
		}

		to {
			transform: rotate(4deg);
		}
	}

	.ev-plane {
		top: 13%;
		left: -300px;
		animation: cross 22s linear forwards;
	}

	.tow {
		display: flex;
		align-items: center;
		animation: tow-bob 3.4s ease-in-out infinite alternate;
	}

	@keyframes tow-bob {
		from {
			transform: translateY(-6px);
		}

		to {
			transform: translateY(7px);
		}
	}

	/*
	 * The banner is cut into thin strips that ride a travelling wave, so it ripples like cloth.
	 * The tail end (the lowest strip numbers) swings widest and each strip overlaps the next by
	 * 1px to avoid seams.
	 */
	.bn {
		display: flex;
		flex: none;
		width: 190px;
		height: 30px;
	}

	.bn i {
		--a: calc((38 - var(--i)) * 0.16px + 0.6px);

		flex: none;
		width: 6px;
		height: 30px;
		margin-right: -1px;
		background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 190 30'%3E%3Cpath d='M1.5 1.5h187v27H1.5l8-13.5z' fill='%23fff' stroke='%23000' stroke-width='2.5'/%3E%3Ctext x='99' y='20.500' text-anchor='middle' font-size='14' font-weight='800' font-family='Fira Sans,Verdana,sans-serif'%3EREAD THE BLOG%3C/text%3E%3C/svg%3E")
			calc(var(--i) * -5px) 0 / 190px 30px no-repeat;
		animation: wave 1s ease-in-out calc(var(--i) * -0.05s) infinite alternate;
	}

	@keyframes wave {
		from {
			transform: translateY(calc(var(--a) * -1));
		}

		to {
			transform: translateY(var(--a));
		}
	}

	/*
	 * The tow rope is cut into short pieces like the banner. The banner's wave runs along it, so it
	 * swings both above and below the straight line, widest in the middle; the plane holds its end
	 * still.
	 */
	.rope {
		display: flex;
		flex: none;
		width: 30px;
		height: 1.5px;
	}

	.rope i {
		--a: calc((9 - var(--j)) * 0.085px + var(--j) * (9 - var(--j)) * 0.1px);

		flex: none;
		width: 4px;
		height: 1.5px;
		margin-right: -1px;
		background: #000;
		animation: rope-wave 1s ease-in-out calc(-1.9s - var(--j) * 0.05s) infinite alternate;
	}

	@keyframes rope-wave {
		from {
			transform: translateY(calc(var(--a) * -1));
		}

		to {
			transform: translateY(var(--a));
		}
	}

	.pl {
		flex: none;
		width: 54px;
		overflow: visible;
		transform-origin: 10% 60%;
		animation: pitch 1.7s ease-in-out infinite alternate;
	}

	@keyframes pitch {
		from {
			transform: rotate(-2.5deg);
		}

		to {
			transform: rotate(2deg);
		}
	}

	.pl .prop {
		transform-box: fill-box;
		transform-origin: center;
		animation: prop 0.09s linear infinite alternate;
	}

	@keyframes prop {
		to {
			transform: scaleY(0.15);
		}
	}

	.ev-balloon {
		right: 11vw;
		bottom: 30px;
		width: 46px;
		animation: rise 36s linear forwards;
	}

	@keyframes rise {
		to {
			transform: translate(-32vw, -110vh);
		}
	}

	.ev-balloon svg {
		display: block;
		width: 100%;
		transform-origin: 50% 0;
		animation: sway 3s ease-in-out infinite alternate;
	}

	.ev-ufo {
		top: 0;
		left: 0;
		z-index: 2;
		width: 90px;
		animation: ufo-flight 13s ease-in-out forwards;
	}

	@keyframes ufo-flight {
		0% {
			transform: translate(-130px, 8vh);
		}

		30%,
		70% {
			transform: translate(var(--ux), var(--uy));
		}

		100% {
			transform: translate(110vw, -8vh);
		}
	}

	.ev-ufo svg {
		display: block;
		width: 100%;
		animation: sway 1.1s ease-in-out infinite alternate;
	}

	.beam {
		position: absolute;
		top: 32px;
		left: 50%;
		width: var(--bw, 130px);
		height: var(--bh, 150px);
		background: #000;
		clip-path: polygon(38% 0, 62% 0, 100% 100%, 0 100%);
		opacity: 0;
		transform: translateX(-50%);
		animation: beam 13s linear forwards;
	}

	@keyframes beam {
		0%,
		32%,
		68%,
		100% {
			opacity: 0;
		}

		37%,
		63% {
			opacity: 0.2;
		}
	}

	/* ---------------------------------------------------------------- phones */

	@media (max-width: 720px) {
		/* The icon grid fills the top of a phone screen, so the plane crosses the middle instead. */
		.ev-plane {
			top: 50%;
		}

		.sunw {
			top: auto;
			right: auto;
			bottom: 24%;
			left: 8%;
			width: 84px;
		}

		.trees {
			display: none;
		}
	}

	/*
	 * Without motion the clouds and birds would wait off screen, so they get a place in the sky.
	 * The global reduced-motion rule already stops every animation.
	 */
	@media (prefers-reduced-motion: reduce) {
		.cl,
		.bd {
			left: var(--rest);
		}
	}
</style>
