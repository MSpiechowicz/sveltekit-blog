<script lang="ts">
	import { onDestroy } from 'svelte';
	import translation from '#lib/translations/en-GB.json';

	type Status = 'idle' | 'copied' | 'failed';

	const RESET_AFTER_MS = 2000;

	let { getText }: { getText: () => string } = $props();

	let status = $state<Status>('idle');
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	const labels: Record<Status, string> = {
		idle: translation['blog.code.copy'],
		copied: translation['blog.code.copied'],
		failed: translation['blog.code.copy.failed'],
	};

	async function copy() {
		try {
			await navigator.clipboard.writeText(getText());
			status = 'copied';
		} catch {
			status = 'failed';
		}

		clearTimeout(resetTimer);
		resetTimer = setTimeout(() => (status = 'idle'), RESET_AFTER_MS);
	}

	onDestroy(() => clearTimeout(resetTimer));
</script>

<button
	type="button"
	class="copy"
	data-status={status}
	aria-label={labels[status]}
	title={labels[status]}
	onclick={copy}>
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.5"
		stroke-linecap="square"
		stroke-linejoin="miter"
		aria-hidden="true">
		{#if status === 'copied'}
			<path d="M20 6 9 17l-5-5" />
		{:else if status === 'failed'}
			<path d="M18 6 6 18M6 6l12 12" />
		{:else}
			<rect
				x="9"
				y="9"
				width="12"
				height="12" />
			<path d="M5 15H3V3h12v2" />
		{/if}
	</svg>
	<span
		class="sr"
		aria-live="polite">{status === 'idle' ? '' : labels[status]}</span>
</button>

<style>
	/* A small ink-bordered box in the top-right corner of the code block (which is position: relative). */
	.copy {
		position: absolute;
		top: 0;
		right: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border: 0;
		border-bottom: 2px solid var(--k);
		border-left: 2px solid var(--k);
		background: var(--w);
		color: var(--k);
		cursor: pointer;
	}

	.copy:hover,
	.copy:focus-visible {
		background: var(--k);
		color: var(--w);
		outline: 0;
	}

	.copy:focus-visible {
		box-shadow: inset 0 0 0 2px var(--w);
	}

	.copy[data-status='copied'] {
		background: var(--sel);
		color: var(--selfg);
	}

	.copy[data-status='failed'] {
		border-left-style: dashed;
		border-bottom-style: dashed;
		background: var(--k);
		color: var(--w);
	}

	svg {
		width: 16px;
		height: 16px;
	}

	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
