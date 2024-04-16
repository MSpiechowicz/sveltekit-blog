<script lang="ts">
	import { goto } from '$app/navigation';
	import Sky from '$lib/assets/sky.svg';
	import { Button } from '$lib/components/ui/button/index';
	import config from '$lib/config';
</script>

<div class="flex h-[100%] flex-row justify-center align-middle">
	<img
		class="xl:top-42 absolute hidden w-[340px] sm:w-[620px] md:top-48 md:block md:w-[780px] lg:top-32 lg:w-[980px] lg:px-14 xl:w-[1280px] 2xl:top-64 2xl:w-[1360px] 2xl:px-6"
		src={Sky}
		alt="Sky"
	/>
	<div class="flex max-w-[1200px] flex-col justify-center">
		<h1 class="text-4xl md:text-5xl lg:text-6xl">
			Hi! I am <b>Maciej,</b>
		</h1>
		<h2 class="mt-2 text-2xl md:mt-4 md:text-3xl lg:text-4xl">
			{config.subTitle}
		</h2>
		<p class="mt-6 max-w-[800px] text-xl lg:text-2xl">
			{config.description}
		</p>
		<Button class="mt-10 min-h-14 max-w-fit text-xl" on:click={() => goto('/blog')}
			>Recent blog posts</Button
		>
	</div>
</div>
