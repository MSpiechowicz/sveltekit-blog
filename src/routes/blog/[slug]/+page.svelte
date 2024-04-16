<script lang="ts">
	import { goto } from '$app/navigation';
	import Notes from '$lib/assets/notes.svg';
	import Button from '$lib/components/ui/button/button.svelte';
	import { formatDate } from '$lib/utils';

	export let data;
</script>

<svelte:head>
	<title>{data.meta.title}</title>
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.meta.title} />
</svelte:head>

<article class="flex justify-center">
	<div class="mt-4 md:mt-12">
		<div class="relative">
			<h1 class="p-0 text-3xl font-bold sm:text-4xl md:text-5xl">{data.meta.title}</h1>
			<img
				src={Notes}
				alt="Notes"
				class="absolute -left-16 -top-4 hidden h-auto w-[140px] sm:block"
			/>
		</div>
		<p class="mt-2 text-xl">{formatDate(data.meta.date)}</p>
    <div class="dynamic mt-8">
      <svelte:component this={data.content} />
    </div>
    <Button class="mt-8 md:mt-12 mb-4 md:mb-8 min-h-14 max-w-fit text-xl" on:click={() => goto('/blog')}>Go back</Button>
	</div>
</article>

<style>
  .dynamic :global(h2) {
    @apply text-4xl;
  }

  .dynamic :global(p) {
    @apply text-xl max-w-[800px];
  }
</style>
