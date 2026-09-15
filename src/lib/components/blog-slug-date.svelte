<script lang="ts">
	import type { Data, Post } from '$lib/types';

	import { formatDate } from '$lib/utils';

	let {
		data,
		post,
		additionalMargin = false,
	}: { data?: Data; post?: Post; additionalMargin?: boolean } = $props();
</script>

<p class={`${additionalMargin ? 'mt-2' : null} text-lg`}>
	{formatDate(data?.meta?.date || post?.date)}
</p>
