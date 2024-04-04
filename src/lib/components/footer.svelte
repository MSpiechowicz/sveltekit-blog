<script lang="ts">
	import Buildings from '$lib/assets/buildings.svg';
	import EarthCrack from '$lib/assets/earth-crack.svg';
	import House from '$lib/assets/house.svg';
	import Trees from '$lib/assets/trees.svg';
	const currentYear = new Date().getFullYear();
</script>

<footer class="">
	<div class="grid grid-cols-8 items-end">
    <img class="col-start-2 col-end-4 h-28" src={Buildings} alt="Buildings" />
    <img class="col-start-4 col-end-5" src={Trees} alt="Trees" />
    <img class="col-start-7 col-end-9" src={House} alt="House" />
  </div>
	<div class="grid grid-cols-3 bg-black h-16 -mt-[2px]">
		<div />
		<div class="flex items-center justify-center"><img src={EarthCrack} alt="Earth Crack" /></div>
		<div class="flex items-center justify-center gap-12 text-white">
			<span class="text-xl">© Maciej Spiechowicz - {currentYear}</span>
			<div class="align-center flex flex-row justify-center gap-2">
				<a
					class="h-8 w-8 rounded-sm border-2 text-center text-xl"
					href="https://www.linkedin.com/in/mspiechowicz/"
					target="_blank"
					rel="noopener noreferrer"
				>
					l</a
				>
				<a
					class="h-8 w-8 rounded-sm border-2 text-center text-xl"
					href="https://www.facebook.com/maciej.spiechowicz"
					target="_blank"
					rel="noopener noreferrer"
				>
					f</a
				>
				<a
					class="h-8 w-8 rounded-sm border-2 text-center text-xl"
					href="https://github.com/MSpiechowicz"
					target="_blank"
					rel="noopener noreferrer"
				>
					g</a
				>
				<a
					class="h-8 w-8 rounded-sm border-2 text-center text-xl"
					href="https://mastodon.social/@mspiechowicz"
					target="_blank"
					rel="noopener noreferrer"
				>
					m</a
				>
			</div>
		</div>
	</div>
</footer>
