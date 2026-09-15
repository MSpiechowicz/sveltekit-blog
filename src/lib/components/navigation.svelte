<script lang="ts">
	import Logo from '$lib/assets/logo.png';
	import MenuDesktop from '$lib/components/menu-desktop.svelte';
	import MenuHamburger from '$lib/components/menu-hamburger.svelte';
	import MenuMobile from '$lib/components/menu-mobile.svelte';
</script>

<nav class="flex flex-row items-center justify-between">
	<img
		src={Logo}
		alt="Logo"
		class="h-auto w-36" />
	<MenuDesktop />
	<MenuHamburger />
</nav>
<MenuMobile />
