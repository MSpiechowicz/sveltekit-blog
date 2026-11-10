<script lang="ts">
	import logo from '#lib/assets/logo.png';
	import SeoHead from '#lib/components/seo-head.svelte';
	import {
		BLOG_DESCRIPTION,
		BLOG_TITLE,
		SITE_NAME,
		absoluteUrl,
		buildBlogJsonLd,
	} from '#lib/seo.js';
	import type { PostSummary } from '#lib/desktop/types.js';

	let { data }: { data: { posts: PostSummary[] } } = $props();
</script>

<SeoHead
	title={BLOG_TITLE}
	description={BLOG_DESCRIPTION}
	canonical={absoluteUrl('/blog')}
	image={logo}
	imageAlt={SITE_NAME}
	jsonLd={buildBlogJsonLd(data.posts)} />
