<script lang="ts">
	import type { Data } from '$lib/types';
  
	import { goto } from '$app/navigation';

	import BlogSlugContent from '$lib/components/blog-slug-content.svelte';
	import BlogSlugDate from '$lib/components/blog-slug-date.svelte';
	import BlogSlugHeader from '$lib/components/blog-slug-header.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	import translation from '$lib/translations/en-GB.json';

	export let data: Data = undefined;
</script>

<svelte:head>
	<title>{data?.meta?.title}</title>
	<meta
		property="og:type"
		content="article" />
	<meta
		property="og:title"
		content={data?.meta?.title} />
</svelte:head>

<article class="flex justify-center">
	<div class="mt-4 md:mt-12">
		<BlogSlugHeader {data} />
		<BlogSlugDate
			{data}
			additionalMargin />
		<BlogSlugContent {data} />
		<Button
			class="mb-4 mt-8 min-h-14 max-w-fit text-xl md:mb-8 md:mt-12"
			on:click={() => goto('/blog')}>{translation['button.go.back']}</Button>
	</div>
</article>
