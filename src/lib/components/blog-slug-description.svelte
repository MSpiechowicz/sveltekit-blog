<script lang="ts">
	import type { Post } from '$lib/types';

	let { post }: { post?: Post } = $props();
</script>

<p class="mt-2 max-w-[800px] text-xl lg:text-2xl">{post?.description}</p>
