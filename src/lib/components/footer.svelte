<script lang="ts">
	import FooterCopyright from './footer-copyright.svelte';
	import FooterCrack from './footer-crack.svelte';
	import FooterGraphics from './footer-graphics.svelte';
	import FooterItems from './footer-items.svelte';
</script>

<footer>
  <FooterGraphics />
	<div class="flex h-24 flex-row justify-center gap-12 bg-black md:-mt-[2px] md:h-16">
    <FooterCrack />
		<div class="flex flex-col items-center justify-center gap-2 text-white md:flex-row md:gap-8">
      <FooterCopyright />
      <FooterItems />
		</div>
    <FooterCrack reversed />
	</div>
</footer>
