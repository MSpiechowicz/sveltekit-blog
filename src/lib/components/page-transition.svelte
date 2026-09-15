<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';

	let { url, children }: { url: string; children: Snippet } = $props();
</script>

{#key url}
	<div
		class="h-[100%]"
		in:fade={{
			delay: 0,
			duration: 300,
		}}>
		{@render children()}
	</div>
{/key}
