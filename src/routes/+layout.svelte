<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { UrlData } from '$lib/types';

	import Footer from '$lib/components/footer.svelte';
	import Navigation from '$lib/components/navigation.svelte';
	import PageTransition from '$lib/components/page-transition.svelte';

	import '../app.css';

	let { data, children }: { data: UrlData; children: Snippet } = $props();
</script>

<div
	class="flex h-full w-full flex-col overflow-auto"
	style:overflow-anchor={data?.url === '/blog' ? 'none' : undefined}>
	<header class="relative mx-6 mt-4 sm:mx-12 xl:mx-20 2xl:mx-24">
		<Navigation />
	</header>
	<main class="mx-8 mt-8 mb-12 grow sm:mx-12 md:mx-12 lg:mx-14">
		<PageTransition url={data?.url}>
			{@render children()}
		</PageTransition>
	</main>
	<Footer />
</div>
