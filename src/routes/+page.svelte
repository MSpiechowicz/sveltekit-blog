<script lang="ts">
	import { goto } from '$app/navigation';
	import Sky from '$lib/assets/sky.svg';
	import { Button } from '$lib/components/ui/button/index';
</script>

<div class="flex h-[100%] flex-row justify-center align-middle">
	<img
		class="xl:top-42 absolute hidden w-[340px] sm:w-[620px] md:top-48 md:block md:w-[780px] lg:top-32 lg:w-[980px] xl:w-[1280px] 2xl:top-64 2xl:w-[1360px]"
		src={Sky}
		alt="Sky"
	/>
	<div class="flex max-w-[1200px] flex-col justify-center">
		<h1 class="text-[36px] sm:text-[40px] md:text-[44px]">
			Hi! I am <b>Maciej,</b>
		</h1>
		<h2 class="text-[28px] sm:text-[32px] md:text-[36px]">
			Software Engineer with 15+ years of experience
		</h2>
		<p class="mt-6 text-[20px] sm:text-[24px] md:text-[28px]">
			I'm all about merging the tech world with everyday life. Whether you're a tech buff or simply
			curious, come along with me as I dive into the latest gadgets, demystify tech jargon, and
			share some of my own experiences along the journey!
		</p>
		<Button class="mt-10 h-16 max-w-fit text-2xl" on:click={() => goto('/blog')}>Recent blog posts</Button>
	</div>
</div>
