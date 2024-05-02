<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index';

	import MainPageDescription from '$lib/components/main-page-description.svelte';
	import MainPageSky from '$lib/components/main-page-sky.svelte';
	import MainPageSubtitle from '$lib/components/main-page-subtitle.svelte';
	import MainPageTitle from '$lib/components/main-page-title.svelte';

	import translation from '$lib/translations/en-GB.json';
</script>

<div class="flex h-[100%] flex-row justify-center align-middle">
	<MainPageSky />
	<div class="flex max-w-[1200px] flex-col justify-center">
		<MainPageTitle />
		<MainPageSubtitle />
		<MainPageDescription />
		<Button
			class="mt-10 min-h-14 max-w-fit text-xl"
			on:click={() => goto('/blog')}>{translation['button.recent.blog.posts']}</Button>
	</div>
</div>
