<script lang="ts">
	import EarthCrack from '$lib/assets/earth-crack.svg';

	export let reversed: boolean = false;
</script>

<div class="hidden items-center justify-center lg:flex">
	<img
		class={`max-h-[64px] ${reversed ? 'scale-x-[-1] transform' : null}`}
		src={EarthCrack}
		alt="Earth Crack"
	/>
</div>
