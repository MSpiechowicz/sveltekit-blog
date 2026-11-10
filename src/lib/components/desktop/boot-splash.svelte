<script lang="ts">
	import { getDesktop } from '#lib/desktop/desktop.svelte.js';

	import { t } from './text.js';

	const desk = getDesktop();

	// The splash dismisses itself with a CSS animation, so it never blocks a visitor without
	// JavaScript; the script only records that it has been seen.
	function finishBoot(event: AnimationEvent) {
		if (event.target !== event.currentTarget) return;

		desk.markBooted();
	}

	function animationsFinished(node: HTMLElement): boolean {
		const animations = node.getAnimations();

		return (
			animations.length > 0 && animations.every((animation) => animation.playState === 'finished')
		);
	}

	// Covers the cases where animationend cannot be heard: reduced motion hides the splash, and a
	// slow hydration may start after the animation has already ended.
	function watchBoot(node: HTMLElement) {
		if (desk.reducedMotion || animationsFinished(node)) desk.markBooted();
	}

	// A restart plays the splash again even though this tab already carries html.booted.
	$effect(() => {
		if (desk.bootKey > 0) document.documentElement.classList.remove('booted');
	});
</script>

{#if !desk.bootDone}
	{#key desk.bootKey}
		<div
			class="boot"
			onanimationend={finishBoot}
			{@attach watchBoot}>
			<div class="card">
				<svg
					viewBox="0 0 32 32"
					aria-hidden="true">
					<rect
						x="6"
						y="3"
						width="20"
						height="23"
						rx="2" />
					<rect
						x="9"
						y="6"
						width="14"
						height="11" />
					<path
						d="M13 9v3M19 9v3M16 10v4h-1M13 14.500q3 2 6 0M9 21h6M8 26h16v3H8z"
						fill="none" />
				</svg>
				<p>{t('desktop.boot.welcome')}</p>
				<i></i>
			</div>
		</div>
	{/key}
{/if}

<style>
	.boot {
		position: fixed;
		inset: 0;
		z-index: 999;
		display: grid;
		place-content: center;
		background: var(--desk) var(--deskpat) 0 0 / 4px 4px;
		animation: bye 0.2s 1.5s steps(2) forwards;
	}

	:global(html.booted) .boot {
		display: none;
	}

	.card {
		padding: 26px 40px;
		border: 2px solid var(--k);
		background: var(--w);
		box-shadow: 3px 3px 0 var(--k);
		text-align: center;
	}

	.card p {
		margin: 8px 0 0;
	}

	svg {
		width: 64px;
		height: 64px;
		fill: var(--w);
		stroke: var(--k);
		stroke-width: 1.6;
	}

	i {
		display: block;
		width: 220px;
		height: 14px;
		margin-top: 12px;
		border: 2px solid var(--k);
		background: linear-gradient(var(--k), var(--k)) no-repeat 0 0 / 0% 100%;
		animation: load 1.3s steps(9) forwards;
	}

	@keyframes load {
		to {
			background-size: 100% 100%;
		}
	}

	@keyframes bye {
		to {
			opacity: 0;
			visibility: hidden;
		}
	}
</style>
