<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import getMenuItems from '$lib/data/menu-items';
	import menuStore from '$lib/stores/menu-store.svelte';
	import { slide } from 'svelte/transition';
</script>

{#if menuStore.open}
	<div
		transition:slide={{ duration: 250 }}
		class="absolute left-0 flex w-full flex-col gap-3 bg-white z-10 p-6 shadow-lg sm:hidden"
	>
		{#each getMenuItems() as item}
			<Button class="text-2xl font-normal" on:click={() => {}} variant="link" size="sm"
				>{item}</Button
			>
		{/each}
	</div>
{/if}
