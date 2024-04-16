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

<div class="flex h-[100%] flex-row items-center justify-center">
	<ul class="flex flex-col gap-12">
		{#each data.posts as post}
			<li>
				<div class="relative">
					<h2 class="p-0 text-4xl md:text-5xl font-bold">{post.title}</h2>
					<img
						src={Notes}
						alt="Notes"
						class="absolute -left-16 -top-4 hidden h-auto w-[140px] sm:block"
					/>
				</div>
				<p class="mt-2 text-xl lg:text-2xl">{post.description}</p>
				<div class="mt-5 flex flex-row items-center gap-2">
					<p class="text-lg">{formatDate(post.date)}</p>
					<Button
						class="text-lg h-[26px] p-[0.5rem] font-bold underline"
						variant="link"
						on:click={() => goto(`blog/${post.slug}`)}>Read full article</Button
					>
				</div>
			</li>
		{/each}
	</ul>
</div>
