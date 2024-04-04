<script lang="ts">
	import Sky from '$lib/assets/sky.svg';
	import Footer from '$lib/components/footer.svelte';
	import Navigation from '$lib/components/navigation.svelte';
	import { Button } from '$lib/components/ui/button/index';
</script>

<div class="flex h-full w-full flex-col">
	<header class="md:mx-18 relative mx-6 mt-4 sm:mx-12"><Navigation /></header>
	<div class="mt-24 flex-grow">
		<div class="relative flex flex-row justify-center align-middle">
			<img src={Sky} alt="Sky" />
			<div class="flex max-w-[1200px] flex-col justify-center absolute top-28">
				<h1 class="text-[72px]">Hi! I am <b>Maciej,</b></h1>
				<h2 class="text-[48px]">Software Engineer with 15+ years of experience</h2>
				<p class="mt-6 text-[32px]">
					I'm all about merging the tech world with everyday life. Whether you're a tech buff or
					simply curious, come along with me as I dive into the latest gadgets, demystify tech
					jargon, and share some of my own experiences along the journey!
				</p>
        <Button class="mt-10 text-2xl h-16 max-w-fit">Recent blog posts</Button>
			</div>
		</div>
	</div>
	<Footer />
</div>
