<script lang="ts">
	import type { UrlData } from '$lib/types';

	import Footer from '$lib/components/footer.svelte';
	import Navigation from '$lib/components/navigation.svelte';
	import PageTransition from '$lib/components/page-transition.svelte';

	import '../app.pcss';

	export let data: UrlData;
</script>

<div class="flex h-full w-full flex-col overflow-auto">
	<header class="md:mx-18 lg:mx-18 relative mx-6 mt-4 sm:mx-12 xl:mx-20 2xl:mx-24">
		<Navigation />
	</header>
	<main class="mx-8 mb-12 mt-8 flex-grow sm:mx-12 md:mx-12 lg:mx-14">
		<PageTransition url={data?.url}>
			<slot />
		</PageTransition>
	</main>
	<Footer />
</div>
