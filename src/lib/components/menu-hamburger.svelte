<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { Hamburger } from 'svelte-hamburgers';

	import menuStore from '$lib/stores/menu-store.svelte';

	let open = menuStore.open;

	beforeNavigate(() => {
		open = false;
	});
</script>

<div class="max-sm:-mr-3 sm:hidden">
	<Hamburger
		on:click={menuStore.toggle}
		bind:open />
</div>
