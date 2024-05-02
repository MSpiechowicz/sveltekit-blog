<script lang="ts">
	import Notes from '$lib/assets/notes.svg';
	import translation from '$lib/translations/en-GB.json';
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
					<h2 class="p-0 text-4xl font-bold md:text-5xl">{post.title}</h2>
					<img
						src={Notes}
						alt="Notes"
						class="absolute -left-16 -top-4 hidden h-auto w-[140px] sm:block"
					/>
				</div>
				<p class="mt-2 max-w-[800px] text-xl lg:text-2xl">{post.description}</p>
				<div class="mt-5 flex flex-row items-center gap-3">
					<p class="text-lg">{formatDate(post.date)}</p>
					<a class="text-lg font-bold underline" aria-label={post.slug} href={`blog/${post.slug}`}
						>{translation['button.read.full.article']}</a
					>
				</div>
			</li>
		{/each}
	</ul>
</div>
