<script lang="ts">
	import type { Data, Post } from '$lib/types';

	import Notes from '$lib/assets/notes.svg';

	let { data, post }: { data?: Data; post?: Post } = $props();
</script>

<div class="relative">
	<h1 class="p-0 text-4xl font-bold md:text-5xl">{data?.meta?.title || post?.title}</h1>
	<img
		src={Notes}
		alt="Notes"
		class="absolute -top-4 -left-16 hidden h-auto w-[140px] sm:block" />
</div>
