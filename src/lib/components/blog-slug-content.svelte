<script lang="ts">
	import type { Data } from '$lib/types';

	let { data }: { data?: Data } = $props();
</script>

<div class="dynamic mt-8">
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
</style>
