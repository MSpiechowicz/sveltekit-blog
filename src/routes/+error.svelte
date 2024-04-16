<script>
	import { page } from '$app/stores';
	import Storm from '$lib/assets/storm.svg';
	import { get } from 'svelte/store';

	const currentPageStatus = get(page).status;
	const currentPageError = get(page).error?.message;
</script>

<div class="flex h-[100%] flex-col items-center justify-center gap-2">
	<div class="relative flex justify-center align-middle">
		<h1 class="text-6xl font-bold">{currentPageStatus}</h1>
		<img class="absolute -left-16 -top-6" src={Storm} alt="Storm" />
	</div>
	<p class="text-2xl">{currentPageError}</p>
</div>
