<script lang="ts">
	import { resolve } from '$app/paths';
	import getMenuItems from '$lib/data/menu-items';
</script>

<div class="hidden flex-row gap-6 sm:flex lg:gap-8">
	{#each getMenuItems() as item (item.path)}
		<a
			class="p-0 text-2xl font-normal underline-offset-auto hover:underline"
			href={resolve(item.path)}
			aria-label={item.name}>{item.name}</a>
	{/each}
</div>
