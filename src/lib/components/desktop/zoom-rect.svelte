<script lang="ts">
	import { onDestroy } from 'svelte';

	const DURATION_MS = 330;

	let node = $state<HTMLElement>();
	let timer: ReturnType<typeof setTimeout> | undefined;
	let settleRun: (() => void) | undefined;

	function place(rect: DOMRect) {
		if (!node) return;

		node.style.left = `${rect.left}px`;
		node.style.top = `${rect.top}px`;
		node.style.width = `${rect.width}px`;
		node.style.height = `${rect.height}px`;
	}

	function settle() {
		clearTimeout(timer);
		timer = undefined;

		if (node) node.hidden = true;

		settleRun?.();
		settleRun = undefined;
	}

	/** Draws the dotted rectangle growing from one rectangle to another; resolves when it is done. */
	export function play(from: DOMRect, to: DOMRect): Promise<void> {
		if (!node) return Promise.resolve();

		settle();

		node.hidden = false;
		place(from);
		void node.offsetWidth;
		place(to);

		return new Promise((resolve) => {
			settleRun = resolve;
			timer = setTimeout(settle, DURATION_MS);
		});
	}

	onDestroy(settle);
</script>

<div
	class="zoom"
	bind:this={node}
	aria-hidden="true"
	hidden>
</div>

<style>
	.zoom {
		position: fixed;
		z-index: 800;
		border: 2px dotted var(--k);
		pointer-events: none;
		transition: all 0.32s steps(6);
	}

	@media (max-width: 720px) {
		.zoom {
			display: none;
		}
	}
</style>
