<script lang="ts">
	import type { Data } from '$lib/types';

	import { goto } from '$app/navigation';

	import logo from '$lib/assets/logo.png';
	import BlogSlugContent from '$lib/components/blog-slug-content.svelte';
	import BlogSlugDate from '$lib/components/blog-slug-date.svelte';
	import BlogSlugHeader from '$lib/components/blog-slug-header.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	import translation from '$lib/translations/en-GB.json';

	export let data: Data = undefined;

	$: canonicalUrl = new URL(`/blog/${data?.meta?.slug}`, translation.url).href;
	$: imageUrl = new URL(data?.meta?.image || logo, translation.url).href;
	$: imageAlt = data?.meta?.image
		? data.meta.imageAlt || data.meta.title
		: 'Maciej Spiechowicz';
</script>

<svelte:head>
	<title>{data?.meta?.title}</title>
	<meta
		name="description"
		content={data?.meta?.description} />
	<link
		rel="canonical"
		href={canonicalUrl} />
	<meta
		property="og:type"
		content="article" />
	<meta
		property="og:title"
		content={data?.meta?.title} />
	<meta
		property="og:description"
		content={data?.meta?.description} />
	<meta
		property="og:url"
		content={canonicalUrl} />
	<meta
		property="og:image"
		content={imageUrl} />
	<meta
		property="og:image:alt"
		content={imageAlt} />
	<meta
		name="twitter:card"
		content="summary_large_image" />
	<meta
		name="twitter:title"
		content={data?.meta?.title} />
	<meta
		name="twitter:description"
		content={data?.meta?.description} />
	<meta
		name="twitter:image"
		content={imageUrl} />
	<meta
		name="twitter:image:alt"
		content={imageAlt} />
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
