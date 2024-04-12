<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import { goto } from '$app/navigation';
	import getMenuItems from '$lib/data/menu-items';
</script>

<div class="hidden flex-row gap-6 sm:flex lg:gap-8">
	{#each getMenuItems() as item}
		<Button
			class="p-0 text-2xl font-normal"
			on:click={() => goto(item.path)}
			variant="link"
			size="sm">{item.name}</Button
		>
	{/each}
</div>
