<script lang="ts">
  export let data;
</script>

<div class="dynamic mt-8">
  <svelte:component this={data.content} />
</div>

<style lang="postcss">
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
		@apply mb-4 mt-8 text-3xl font-bold;
	}

	.dynamic :global(li) {
		@apply mt-1 text-xl;
	}

	.dynamic :global(a) {
		@apply font-bold underline;
	}
</style>
