<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import getMenuItems from '$lib/data/menu-items';
</script>

<div class="hidden md:block">
	{#each getMenuItems() as item}
		<Button class="text-2xl font-normal" on:click={() => {}} variant="link" size="sm">{item}</Button>
	{/each}
</div>
