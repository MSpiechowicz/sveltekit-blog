<script lang="ts">
	import Notes from '$lib/assets/notes.svg';
	import type { Data, Post } from '$lib/types';

	export let data: Data = undefined;
	export let post: Post = undefined;
</script>

<div class="relative">
	<h1 class="p-0 text-4xl font-bold md:text-5xl">{data?.meta?.title || post?.title}</h1>
	<img src={Notes} alt="Notes" class="absolute -left-16 -top-4 hidden h-auto w-[140px] sm:block" />
</div>
