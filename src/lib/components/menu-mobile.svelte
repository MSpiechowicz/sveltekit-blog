<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import getMenuItems from '$lib/data/menu-items';
	import menuStore from '$lib/stores/menu-store.svelte';
</script>

{#if menuStore.open}
	<div class="sm:hidden flex flex-col gap-3 absolute left-0 w-full bg-white shadow-lg p-6">
		{#each getMenuItems() as item}
			<Button class="text-2xl font-normal" on:click={() => {}} variant="link" size="sm">{item}</Button>
		{/each}
	</div>
{/if}
