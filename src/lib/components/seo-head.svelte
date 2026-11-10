<script lang="ts">
	import { SITE_LOCALE, SITE_NAME, absoluteUrl, serializeJsonLd } from '#lib/seo.js';
	import type { JsonLdDocument } from '#lib/seo.js';

	type Props = {
		/** Text of the document title. */
		title: string;
		/** Title for social cards; defaults to `title`. */
		socialTitle?: string;
		description: string;
		canonical: string;
		type?: 'website' | 'article';
		/** Site-relative or absolute image URL. */
		image: string;
		imageAlt: string;
		/** `YYYY-MM-DD`; only for articles. */
		publishedTime?: string;
		robots?: string;
		jsonLd: JsonLdDocument;
	};

	let {
		title,
		socialTitle,
		description,
		canonical,
		type = 'website',
		image,
		imageAlt,
		publishedTime,
		robots,
		jsonLd,
	}: Props = $props();

	const cardTitle = $derived(socialTitle ?? title);
	const imageUrl = $derived(absoluteUrl(image));
	const json = $derived(serializeJsonLd(jsonLd));
</script>

<svelte:head>
	<title>{title}</title>
	<meta
		name="description"
		content={description} />
	<meta
		name="author"
		content={SITE_NAME} />
	{#if robots}
		<meta
			name="robots"
			content={robots} />
	{/if}
	<link
		rel="canonical"
		href={canonical} />

	<meta
		property="og:type"
		content={type} />
	<meta
		property="og:site_name"
		content={SITE_NAME} />
	<meta
		property="og:locale"
		content={SITE_LOCALE} />
	<meta
		property="og:title"
		content={cardTitle} />
	<meta
		property="og:description"
		content={description} />
	<meta
		property="og:url"
		content={canonical} />
	<meta
		property="og:image"
		content={imageUrl} />
	<meta
		property="og:image:alt"
		content={imageAlt} />
	{#if type === 'article'}
		{#if publishedTime}
			<meta
				property="article:published_time"
				content={publishedTime} />
		{/if}
		<meta
			property="article:author"
			content={absoluteUrl('/')} />
	{/if}

	<meta
		name="twitter:card"
		content="summary_large_image" />
	<meta
		name="twitter:title"
		content={cardTitle} />
	<meta
		name="twitter:description"
		content={description} />
	<meta
		name="twitter:image"
		content={imageUrl} />
	<meta
		name="twitter:image:alt"
		content={imageAlt} />

	<svelte:element
		this={"script"}
		type="application/ld+json">{json}</svelte:element>
</svelte:head>
