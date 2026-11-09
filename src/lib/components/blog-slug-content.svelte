<script lang="ts">
	import { mount, unmount } from 'svelte';
	import CodeCopyButton from '#lib/components/code-copy-button.svelte';
	import type { Data } from '#lib/types.js';

	let { data }: { data?: Data } = $props();

	let container = $state<HTMLDivElement>();

	// Article code comes from mdsvex as plain HTML, so the buttons are added once it is on the page.
	$effect(() => {
		if (!container || !data?.content) {
			return;
		}

		const buttons = Array.from(container.querySelectorAll('pre > code')).map((code) =>
			mount(CodeCopyButton, {
				target: code.parentElement as HTMLElement,
				props: { getText: () => code.textContent?.trimEnd() ?? '' },
			}),
		);

		return () => {
			buttons.forEach((button) => unmount(button));
		};
	});
</script>

<div
	bind:this={container}
	class="dynamic mt-8">
	{#if data?.content}
		<data.content />
	{/if}
</div>

<style lang="postcss">
	@reference '../../app.css';

	.dynamic :global(h2) {
		@apply text-4xl;
	}

	.dynamic :global(p) {
		@apply max-w-[800px] text-xl;
	}

	.dynamic :global(ul) {
		@apply my-4;
	}

	.dynamic :global(h2) {
		@apply mt-8 mb-4 text-3xl font-bold;
	}

	.dynamic :global(li) {
		@apply mt-1 text-xl;
	}

	.dynamic :global(a) {
		@apply font-bold underline;
	}

	.dynamic :global(pre) {
		@apply relative my-3 overflow-hidden rounded-md border-2 border-primary bg-background text-primary;
	}

	.dynamic :global(pre:has(+ br)) {
		@apply mb-0;
	}

	/* Long commands wrap on screen only. The right padding keeps them clear of the copy button's corner tab. */
	.dynamic :global(pre > code) {
		@apply block py-4 pr-15 pl-4 text-base wrap-anywhere whitespace-pre-wrap;
	}
</style>
