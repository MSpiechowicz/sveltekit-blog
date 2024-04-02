<script lang="ts">
	import MenuDesktop from '$lib/components/menu-desktop.svelte';
	import MenuHamburger from '$lib/components/menu-hamburger.svelte';
	import MenuMobile from '$lib/components/menu-mobile.svelte';
</script>

<nav class="flex flex-row justify-between items-center">
	<span class="text-2xl">Maciej Spiechowicz</span>
  <MenuDesktop />
  <MenuHamburger />
</nav>
<MenuMobile />
