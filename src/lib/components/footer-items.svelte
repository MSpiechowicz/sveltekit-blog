<script lang="ts">
	import FOOTER_ITEMS from '$lib/data/footer-items';
</script>

<div class="align-center flex flex-row justify-center gap-2">
	{#each FOOTER_ITEMS as item}
		<a
			class="flex h-8 w-8 items-center justify-center rounded-sm border-2 text-xl"
			href={item.href}
			target="_blank"
			rel="noopener noreferrer"
		>
			{item.letter}
		</a>
	{/each}
</div>
