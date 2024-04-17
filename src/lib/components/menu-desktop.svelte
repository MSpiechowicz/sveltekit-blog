<script lang="ts">
	import getMenuItems from '$lib/data/menu-items';
</script>

<div class="hidden flex-row gap-6 sm:flex lg:gap-8">
	{#each getMenuItems() as item}
		<a
			class="p-0 text-2xl font-normal underline-offset-auto hover:underline"
			href={item.path}
			aria-label={item.name}>{item.name}</a
		>
	{/each}
</div>
