<script lang="ts">
	import { fade } from 'svelte/transition';

	export let url: string;
</script>

{#key url}
	<div class="h-[100%]" in:fade={{
    delay: 0,
    duration: 300,
  }}>
		<slot />
	</div>
{/key}
