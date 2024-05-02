<script lang="ts">
	import Buildings from '$lib/assets/buildings.svg';
	import House from '$lib/assets/house.svg';
	import Trees from '$lib/assets/trees.svg';
</script>

<div
	class="lg:mx-18 max-w-auto lg:mx-18 hidden flex-row items-end justify-between md:mx-12 md:flex xl:mx-20 2xl:mx-24"
>
	<img class="md:w-[180px] xl:w-[200px]" src={Buildings} alt="Buildings" />
	<img class="hidden lg:block lg:w-[140px]" src={Trees} alt="Trees" />
	<img class="md:w-[340px]" src={House} alt="House" />
</div>
