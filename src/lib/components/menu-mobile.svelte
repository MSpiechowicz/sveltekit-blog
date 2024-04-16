<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index';
	import getMenuItems from '$lib/data/menu-items';
	import menuStore from '$lib/stores/menu-store.svelte';
	import { slide } from 'svelte/transition';
</script>

{#if menuStore.open}
	<div
		transition:slide={{
			delay: 0,
			duration: 150,
      axis: 'y'
		}}
		class="absolute left-0 z-10 flex w-full flex-col gap-3 bg-white p-6 shadow-lg sm:hidden"
	>
		{#each getMenuItems() as item}
			<Button
				class="text-2xl font-normal"
				on:click={() => {
					menuStore.toggle();
					goto(item.path);
				}}
				variant="link"
				size="sm">{item.name}</Button
			>
		{/each}
	</div>
{/if}
