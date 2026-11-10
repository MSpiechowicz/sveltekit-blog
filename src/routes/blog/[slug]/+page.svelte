<script lang="ts">
	import logo from '#lib/assets/logo.png';
	import SeoHead from '#lib/components/seo-head.svelte';
	import { SITE_NAME, buildPostJsonLd, isoDate, postUrl } from '#lib/seo.js';
	import type { Data } from '#lib/types.js';

	let { data }: { data?: Data } = $props();

	const meta = $derived(data?.meta);
	const title = $derived(meta?.title ?? '');
	const slug = $derived(meta?.slug ?? '');
	const image = $derived(meta?.image || logo);
	const imageAlt = $derived(meta?.image ? meta.imageAlt || title : SITE_NAME);
</script>

<SeoHead
	title={`${title} - ${SITE_NAME}`}
	socialTitle={title}
	description={meta?.description ?? ''}
	canonical={postUrl(slug)}
	type="article"
	{image}
	{imageAlt}
	publishedTime={isoDate(meta?.date)}
	robots="max-image-preview:large"
	jsonLd={buildPostJsonLd({ ...meta, slug, title }, logo)} />
