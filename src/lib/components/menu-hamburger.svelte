<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { Hamburger } from 'svelte-hamburgers';

	import menuStore from '$lib/stores/menu-store.svelte';

	beforeNavigate(() => {
		menuStore.open = false;
	});
</script>

<div class="max-sm:-mr-3 sm:hidden">
	<Hamburger
		ariaControls={menuStore.open ? 'mobile-menu' : undefined}
		bind:open={menuStore.open} />
</div>
