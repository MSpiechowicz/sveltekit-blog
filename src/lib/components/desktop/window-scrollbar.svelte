<script lang="ts">
	import { onDestroy } from 'svelte';

	const THUMB_SIZE_PX = 20;
	const ARROW_STEP_PX = 32;
	const HOLD_INTERVAL_MS = 70;
	const PAGE_FRACTION = 0.9;

	let { target }: { target?: HTMLElement } = $props();

	let track = $state<HTMLElement>();
	let thumb = $state<HTMLElement>();
	let scrollable = $state(false);
	let thumbTop = $state(0);

	let holdTimer: ReturnType<typeof setInterval> | undefined;
	let thumbDrag: { pointerId: number; grabOffset: number } | null = null;

	function maxScroll(element: HTMLElement): number {
		return element.scrollHeight - element.clientHeight;
	}

	function update() {
		if (!target || !track) return;

		const max = maxScroll(target);

		scrollable = max > 1;
		thumbTop = max > 0 ? (target.scrollTop / max) * (track.clientHeight - THUMB_SIZE_PX) : 0;
	}

	// Follows the scrolled element: scrolling, resizing and any change to its content.
	$effect(() => {
		const element = target;
		if (!element) return;

		const resizeObserver = new ResizeObserver(update);
		const mutationObserver = new MutationObserver(update);

		resizeObserver.observe(element);
		mutationObserver.observe(element, { childList: true, subtree: true });
		element.addEventListener('scroll', update, { passive: true });
		update();

		return () => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			element.removeEventListener('scroll', update);
		};
	});

	function stopHold() {
		clearInterval(holdTimer);
		holdTimer = undefined;
	}

	function startHold(direction: -1 | 1) {
		const step = () => target?.scrollBy({ top: direction * ARROW_STEP_PX });

		stopHold();
		step();
		holdTimer = setInterval(step, HOLD_INTERVAL_MS);
	}

	function pageTrack(event: PointerEvent) {
		if (!target || !thumb || event.target !== track) return;

		const above = event.clientY < thumb.getBoundingClientRect().top;

		target.scrollBy({ top: (above ? -1 : 1) * target.clientHeight * PAGE_FRACTION });
	}

	function startThumbDrag(event: PointerEvent) {
		if (!thumb) return;

		thumb.setPointerCapture(event.pointerId);
		thumbDrag = {
			pointerId: event.pointerId,
			grabOffset: event.clientY - thumb.getBoundingClientRect().top,
		};
	}

	function moveThumb(event: PointerEvent) {
		if (!thumbDrag || !target || !track) return;

		const room = track.clientHeight - THUMB_SIZE_PX;
		if (room <= 0) return;

		const position = event.clientY - thumbDrag.grabOffset - track.getBoundingClientRect().top;

		target.scrollTop = (position / room) * maxScroll(target);
	}

	function endThumbDrag() {
		thumbDrag = null;
	}

	onDestroy(stopHold);
</script>

<svelte:window
	onpointerup={stopHold}
	onpointercancel={stopHold} />

<div
	class="sb"
	class:off={!scrollable}>
	<button
		type="button"
		tabindex="-1"
		aria-hidden="true"
		onpointerdown={() => startHold(-1)}>
		▲
	</button>
	<div
		class="trk"
		role="presentation"
		bind:this={track}
		onpointerdown={pageTrack}>
		<i
			class="th"
			role="presentation"
			bind:this={thumb}
			style:top="{thumbTop}px"
			onpointerdown={startThumbDrag}
			onpointermove={moveThumb}
			onpointerup={endThumbDrag}
			onpointercancel={endThumbDrag}></i>
	</div>
	<button
		type="button"
		tabindex="-1"
		aria-hidden="true"
		onpointerdown={() => startHold(1)}>
		▼
	</button>
	<i class="corner"></i>
</div>

<style>
	.sb {
		display: flex;
		flex: none;
		flex-direction: column;
		width: 20px;
		border-left: 2px solid var(--k);
	}

	.sb button {
		display: grid;
		flex: none;
		place-items: center;
		height: 20px;
		padding: 0;
		border: 0;
		background: var(--w);
		font-size: 9px;
		cursor: pointer;
	}

	.sb button:first-child {
		border-bottom: 2px solid var(--k);
	}

	.sb button:last-of-type {
		border-top: 2px solid var(--k);
	}

	.sb button:active {
		background: var(--k);
		color: var(--w);
	}

	.trk {
		position: relative;
		flex: 1;
		background: var(--w) var(--dither) 0 0 / 2px 2px;
		cursor: pointer;
	}

	.th {
		position: absolute;
		right: 0;
		left: 0;
		height: 20px;
		border-block: 2px solid var(--k);
		background: var(--w);
		cursor: grab;
		touch-action: none;
	}

	.corner {
		flex: none;
		height: 18px;
		border-top: 2px solid var(--k);
	}

	.off .trk {
		background: var(--w);
		cursor: default;
	}

	.off .th {
		display: none;
	}

	.off button {
		opacity: 0.35;
	}

	@media (max-width: 720px) {
		.sb {
			display: none;
		}
	}
</style>
