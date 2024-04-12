<script lang="ts">
	import { goto } from '$app/navigation';
	import Notes from '$lib/assets/notes.svg';
	import { Button } from '$lib/components/ui/button/index';
	import { formatDate } from '$lib/utils';

	export let data;
</script>

<svelte:head>
	<title>Maciej Spiechowicz - Blog posts</title>
</svelte:head>

<div class="flex h-[100%] flex-row justify-center items-center">
	<ul class="flex flex-col gap-12">
		{#each data.posts as post}
			<li>
        <div class="relative">
          <h2 class="p-0 text-3xl sm:text-4xl md:text-5xl font-bold">{post.title}</h2>
          <img src={Notes} alt="Notes" class="hidden sm:block w-[140px] h-auto absolute -top-4 -left-16" />
        </div>
				<p class="mt-2 text-xl sm:text-2xl">{post.description}</p>
        <div class="flex flex-row gap-2 mt-4 items-center">
          <p class="text:md sm:text-lg">{formatDate(post.date)}</p>
          <Button class="p-[0.5rem] h-[26px] font-bold underline text:md sm:text-lg" variant="link" on:click={() => goto(`blog/${post.slug}`)}>Read full article</Button>
        </div>
			</li>
		{/each}
	</ul>
</div>
