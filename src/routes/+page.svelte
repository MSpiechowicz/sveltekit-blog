<script lang="ts">
	import logo from '#lib/assets/logo.png';
	import SeoHead from '#lib/components/seo-head.svelte';
	import { SITE_NAME, absoluteUrl, buildHomeJsonLd } from '#lib/seo.js';
	import translation from '#lib/translations/en-GB.json';
</script>

<SeoHead
	title={translation.title}
	description={translation.description}
	canonical={absoluteUrl('/')}
	image={logo}
	imageAlt={SITE_NAME}
	jsonLd={buildHomeJsonLd(logo)} />
