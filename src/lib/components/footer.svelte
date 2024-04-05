<script lang="ts">
	import Buildings from '$lib/assets/buildings.svg';
	import EarthCrack from '$lib/assets/earth-crack.svg';
	import House from '$lib/assets/house.svg';
	import Trees from '$lib/assets/trees.svg';
	const currentYear = new Date().getFullYear();
</script>

<footer class="">
	<div class="lg:mx-18 max-w-auto hidden flex-row items-end justify-between md:mx-12 lg:mx-18 xl:mx-20 2xl:mx-24 md:flex">
		<img class="md:w-[180px] xl:w-[220px]" src={Buildings} alt="Buildings" />
		<img class="hidden lg:block lg:w-[140px]" src={Trees} alt="Trees" />
		<img class="md:w-[340px]" src={House} alt="House" />
	</div>
	<div
		class="flex h-24 md:h-16 flex-row justify-center bg-black md:-mt-[2px] gap-12"
	>
		<div class="hidden items-center justify-center lg:flex">
			<img class="max-h-[64px]" src={EarthCrack} alt="Earth Crack" />
		</div>
		<div class="flex flex-col items-center justify-center gap-2 text-white md:flex-row md:gap-8">
			<span class="text-xl">© Maciej Spiechowicz - {currentYear}</span>
			<div class="align-center flex flex-row justify-center gap-2">
				<a
					class="h-8 w-8 rounded-sm border-2 text-xl flex justify-center items-center"
					href="https://www.linkedin.com/in/mspiechowicz/"
					target="_blank"
					rel="noopener noreferrer"
				>
					l</a
				>
				<a
					class="h-8 w-8 rounded-sm border-2 text-xl flex justify-center items-center"
					href="https://www.facebook.com/maciej.spiechowicz"
					target="_blank"
					rel="noopener noreferrer"
				>
					f</a
				>
				<a
					class="h-8 w-8 rounded-sm border-2 text-xl flex justify-center items-center"
					href="https://github.com/MSpiechowicz"
					target="_blank"
					rel="noopener noreferrer"
				>
					g</a
				>
				<a
					class="h-8 w-8 rounded-sm border-2 text-xl flex justify-center items-center"
					href="https://mastodon.social/@mspiechowicz"
					target="_blank"
					rel="noopener noreferrer"
				>
					m</a
				>
			</div>
		</div>
    <div class="hidden items-center justify-center lg:flex">
			<img class="max-h-[64px] transform scale-x-[-1]" src={EarthCrack} alt="Earth Crack" />
		</div>
	</div>
</footer>
