<script lang="ts">
  import menuStore from '$lib/stores/menu-store.svelte';
  import { Hamburger } from 'svelte-hamburgers';
</script>

<div class="max-sm:-mr-3 sm:hidden">
  <Hamburger on:click={menuStore.toggle} />
</div>
