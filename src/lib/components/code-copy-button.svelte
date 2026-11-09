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
	class={[
		'absolute top-0 right-0 inline-flex size-11 cursor-pointer items-center justify-center rounded-bl-md bg-primary transition-colors hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:outline-none focus-visible:ring-inset',
		status === 'failed' ? 'text-red-400' : 'text-primary-foreground',
	]}
	aria-label={labels[status]}
	title={labels[status]}
	onclick={copy}>
	<svg
		class="size-4"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true">
		{#if status === 'copied'}
			<path d="M20 6 9 17l-5-5" />
		{:else if status === 'failed'}
			<path d="M18 6 6 18M6 6l12 12" />
		{:else}
			<rect
				x="9"
				y="9"
				width="13"
				height="13"
				rx="2" />
			<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
		{/if}
	</svg>
	<span
		class="sr-only"
		aria-live="polite">{status === 'idle' ? '' : labels[status]}</span>
</button>
