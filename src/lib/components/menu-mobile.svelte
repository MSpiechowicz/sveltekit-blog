<script lang="ts">
	import { slide } from 'svelte/transition';
  
	import getMenuItems from '$lib/data/menu-items';
	import menuStore from '$lib/stores/menu-store.svelte';
</script>

{#if menuStore.open}
	<div
		transition:slide={{
			delay: 0,
			duration: 150,
			axis: 'y'
		}}
		class="absolute left-0 z-10 flex w-full flex-col items-center gap-3 bg-white p-6 shadow-lg sm:hidden"
	>
		{#each getMenuItems() as item}
			<a
				class="text-2xl font-normal underline-offset-auto hover:underline"
				href={item.path}
				aria-label={item.name}
				on:click={() => menuStore.toggle()}>{item.name}</a
			>
		{/each}
	</div>
{/if}
