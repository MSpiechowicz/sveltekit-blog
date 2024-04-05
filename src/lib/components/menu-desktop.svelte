<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import getMenuItems from '$lib/data/menu-items';
</script>

<div class="hidden sm:flex flex-row gap-6 lg:gap-8">
	{#each getMenuItems() as item}
		<Button class="text-2xl font-normal p-0" on:click={() => {}} variant="link" size="sm">{item}</Button>
	{/each}
</div>
