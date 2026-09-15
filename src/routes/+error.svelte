<script>
	import { page } from '$app/state';

	import Storm from '$lib/assets/storm.svg';

	const currentPageStatus = $derived(page.status);
	const currentPageError = $derived(page.error?.message);
</script>

<div class="flex h-[100%] flex-col items-center justify-center gap-2">
	<div class="relative flex justify-center align-middle">
		<h1 class="text-6xl font-bold">{currentPageStatus}</h1>
		<img
			class="absolute -top-6 -left-16"
			src={Storm}
			alt="Storm" />
	</div>
	<p class="text-2xl">{currentPageError}</p>
</div>
