<script lang="ts">
	import { resolve } from '$app/paths';
	import { tick, untrack } from 'svelte';

	import { getDesktop } from '#lib/desktop/desktop.svelte.js';
	import { hiddenFileLines, type Line } from '#lib/desktop/hidden-file.js';
	import { createKonami } from '#lib/desktop/konami.js';

	import { t } from './text.js';

	const LINE_DELAY_MS = 110;
	const BLANK_LINE_DELAY_MS = 40;
	const LOG_OUT_LABEL = '[ LOG OUT ]';

	const desk = getDesktop();
	const isKonami = createKonami();

	const lines = $derived(
		hiddenFileLines(desk.posts, desk.projects.projects, {
			name: t('desktop.name'),
			subtitle: t('subTitle'),
		}),
	);

	let overlay = $state<HTMLDivElement>();
	let shown = $state(0);
	let finished = $state(false);

	function lineDelay(line: Line): number {
		const blank = line.every((segment) => segment.text === '');

		return blank ? BLANK_LINE_DELAY_MS : LINE_DELAY_MS;
	}

	async function keepEndInView() {
		await tick();

		if (overlay) overlay.scrollTop = overlay.scrollHeight;
	}

	/** Types the file line by line, or shows it at once when motion is reduced. */
	function startTyping(all: Line[], instant: boolean): () => void {
		let timer: ReturnType<typeof setTimeout> | undefined;

		function step() {
			shown += 1;
			keepEndInView();

			timer = setTimeout(
				() => {
					if (shown >= all.length) {
						finished = true;
						keepEndInView();

						return;
					}

					step();
				},
				lineDelay(all[shown - 1]),
			);
		}

		finished = false;
		shown = 0;

		if (instant) {
			shown = all.length;
			finished = true;
		} else {
			step();
		}

		return () => clearTimeout(timer);
	}

	// Opening the file always starts the typing again from the first line.
	$effect(() => {
		if (!desk.hiddenFileOpen) return;

		return untrack(() => startTyping(lines, desk.reducedMotion));
	});

	// Focus moves into the overlay while it is open and goes back to where it was afterwards.
	$effect(() => {
		if (!desk.hiddenFileOpen) return;

		const opener = document.activeElement;

		tick().then(() => overlay?.focus());

		return () => {
			if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
		};
	});

	function keepFocusInside(event: KeyboardEvent) {
		if (event.key !== 'Tab' || !overlay) return;

		const targets = [...overlay.querySelectorAll<HTMLElement>('a[href], button')];
		const first = targets[0];
		const last = targets.at(-1);

		if (!first || !last) {
			event.preventDefault();
			overlay.focus();
		} else if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	function closeOnLink(event: MouseEvent) {
		if (event.target instanceof Element && event.target.closest('a')) desk.closeHiddenFile();
	}

	// Only listens; it never prevents the key from doing what it normally does. A wallpaper that
	// is switched off stays off, so the scenes are only tried.
	function watchForKonami(event: KeyboardEvent) {
		if (typeof event.key !== 'string' || !isKonami(event.key)) return;

		desk.barrelRoll();
		desk.tryScene('ufo');
		desk.tryScene('flock');
	}
</script>

<svelte:window onkeydown={watchForKonami} />

<button
	type="button"
	class="pi"
	aria-label={t('desktop.aria.pi')}
	title="π"
	onclick={() => desk.openHiddenFile()}>
	π
</button>

{#if desk.hiddenFileOpen}
	<div
		class="net"
		bind:this={overlay}
		role="dialog"
		aria-modal="true"
		aria-label={t('desktop.menu.scenes.hiddenFile')}
		tabindex="-1"
		onclick={closeOnLink}
		onkeydown={keepFocusInside}>
		<div class="out">
			{#each lines.slice(0, shown) as line, index (index)}
				<div class="row">
					{#each line as segment, part (part)}
						{#if segment.slug}
							<a href={resolve('/blog/[slug]', { slug: segment.slug })}>{segment.text}</a>
						{:else}
							{segment.text}
						{/if}
					{/each}
				</div>
			{/each}

			{#if finished}
				<div class="row"><span class="cur"></span></div>
			{/if}
		</div>

		{#if finished}
			<button
				type="button"
				onclick={() => desk.closeHiddenFile()}>
				{LOG_OUT_LABEL}
			</button>
		{/if}
	</div>
{/if}

<style>
	/* The pi in the corner (after the 1995 film The Net): click it and the hidden file opens. */
	.pi {
		position: absolute;
		right: 7px;
		bottom: 12px;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--k);
		font:
			700 15px/1 Georgia,
			'Noto Serif',
			serif;
		opacity: 0.5;
		cursor: pointer;
	}

	.pi:hover,
	.pi:focus-visible {
		opacity: 1;
		outline: 0;
	}

	.net {
		position: fixed;
		inset: 0;
		z-index: 950;
		padding: clamp(16px, 5vw, 60px);
		overflow: auto;
		background: #000;
		color: #7dff9b;
		font: 500 15px/1.6 var(--mono);
		text-shadow: 0 0 6px rgba(125, 255, 155, 0.5);
		animation: netin 0.7s steps(7) both;
		-webkit-user-select: text;
		user-select: text;
	}

	.net:focus {
		outline: 0;
	}

	@keyframes netin {
		0%,
		40% {
			clip-path: inset(49% 0);
			filter: brightness(6);
		}

		100% {
			clip-path: inset(0);
			filter: none;
		}
	}

	/* Scan lines over the whole screen. */
	.net::after {
		content: '';
		position: fixed;
		inset: 0;
		background: repeating-linear-gradient(transparent 0 2px, rgba(0, 0, 0, 0.3) 2px 4px);
		pointer-events: none;
	}

	.out {
		max-width: 86ch;
	}

	.row {
		min-height: 1.6em;
		overflow-wrap: anywhere;
		white-space: pre-wrap;
	}

	.net a {
		color: #fff;
	}

	.net button {
		margin-top: 22px;
		padding: 6px 16px;
		border: 2px solid currentColor;
		background: none;
		color: inherit;
		font: inherit;
		text-shadow: inherit;
		cursor: pointer;
	}

	.net button:hover,
	.net button:focus-visible {
		background: #7dff9b;
		color: #000;
		text-shadow: none;
	}

	.cur {
		display: inline-block;
		width: 0.6em;
		height: 1.1em;
		background: currentColor;
		vertical-align: -0.2em;
		animation: blink 1s steps(1) infinite;
	}

	@media (max-width: 720px) {
		.pi {
			right: 4px;
			bottom: 44px;
			width: 30px;
			height: 30px;
			font-size: 17px;
			opacity: 0.6;
		}
	}
</style>
