<script lang="ts">
	import type { PostsData } from '$lib/types';

	import BlogSlugDate from '$lib/components/blog-slug-date.svelte';
	import BlogSlugDescription from '$lib/components/blog-slug-description.svelte';
	import BlogSlugHeader from '$lib/components/blog-slug-header.svelte';

	import translation from '$lib/translations/en-GB.json';

	export let data: PostsData;
</script>

<svelte:head>
	<title>Maciej Spiechowicz - Blog posts</title>
</svelte:head>

<div class="flex h-[100%] flex-row items-center justify-center">
	<ul class="flex flex-col gap-12">
		{#each data.posts as post}
			<li>
				<BlogSlugHeader {post} />
				<BlogSlugDescription {post} />
				<div class="mt-5 flex flex-row items-center gap-3">
					<BlogSlugDate {post} />
					<a
						class="text-lg font-bold underline"
						aria-label={post?.slug}
						href={`blog/${post?.slug}`}>{translation['button.read.full.article']}</a>
				</div>
			</li>
		{/each}
	</ul>
</div>
