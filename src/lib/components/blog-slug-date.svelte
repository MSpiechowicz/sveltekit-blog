<script lang="ts">
	import type { Data, Post } from '$lib/types';
  
	import { formatDate } from '$lib/utils';

	export let data: Data = undefined;
	export let post: Post = undefined;
	export let additionalMargin: boolean = false;
</script>

<p class={`${additionalMargin ? 'mt-2' : null} text-lg`}>
	{formatDate(data?.meta?.date || post?.date)}
</p>
