<script lang="ts">
	import Logo from '$lib/assets/logo.png';
	import MenuDesktop from '$lib/components/menu-desktop.svelte';
	import MenuHamburger from '$lib/components/menu-hamburger.svelte';
	import MenuMobile from '$lib/components/menu-mobile.svelte';
</script>

<nav class="flex flex-row justify-between items-center">
	<img src={Logo} alt="Logo" class="w-36 h-auto" />
  <MenuDesktop />
  <MenuHamburger />
</nav>
<MenuMobile />
