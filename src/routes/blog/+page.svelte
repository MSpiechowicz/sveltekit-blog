<script lang="ts">
	import { tick } from 'svelte';
	import { Select } from 'bits-ui';
	import type { PostsData } from '$lib/types';
	import { POSTS_PER_PAGE, paginatePosts, selectPosts, type DateOrder } from '$lib/blog-listing';

	import BlogSlugDate from '$lib/components/blog-slug-date.svelte';
	import BlogSlugDescription from '$lib/components/blog-slug-description.svelte';
	import BlogSlugHeader from '$lib/components/blog-slug-header.svelte';
	import { Button } from '$lib/components/ui/button';

	import translation from '$lib/translations/en-GB.json';

	export let data: PostsData;

	let query = '';
	let order: DateOrder = 'DESC';
	let requestedPage = 1;
	let paginationNav: HTMLElement;
	let postList: HTMLUListElement;
	let listMinHeight = 0;
	const dateOrders: { value: DateOrder; label: string }[] = [
		{ value: 'DESC', label: translation['blog.date.order.newest.first'] },
		{ value: 'ASC', label: translation['blog.date.order.oldest.first'] },
	];

	$: selectedPosts = selectPosts(data.posts, query, order);
	$: pagination = paginatePosts(selectedPosts, requestedPage);

	function updateQuery(event: Event) {
		query = (event.currentTarget as HTMLInputElement).value;
		requestedPage = 1;
		listMinHeight = 0;
	}

	function updateOrder(selected: { value: DateOrder } | undefined) {
		if (!selected) return;
		order = selected.value;
		requestedPage = 1;
		listMinHeight = 0;
	}

	function clearSearch() {
		query = '';
		requestedPage = 1;
		listMinHeight = 0;
	}

	async function changePage(page: number) {
		const top = paginationNav.getBoundingClientRect().top;
		let scroller = paginationNav.parentElement;
		while (scroller && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) {
			scroller = scroller.parentElement;
		}

		// Keep short pages tall enough to preserve the current viewport position.
		listMinHeight = postList.getBoundingClientRect().height;
		requestedPage = page;
		await tick();

		// Keep the pagination controls in place when the new articles are taller.
		scroller?.scrollBy({
			top: paginationNav.getBoundingClientRect().top - top,
			behavior: 'instant',
		});
	}
</script>

<svelte:head>
	<title>Maciej Spiechowicz - Blog posts</title>
</svelte:head>

<svelte:window on:resize={() => (listMinHeight = 0)} />

<div class="flex h-[100%] flex-row justify-center">
	<div class="w-full max-w-[800px]">
		<div class="mb-14 grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
			<div class="grid gap-2">
				<label
					class="text-lg font-bold"
					for="blog-search">{translation['blog.search.label']}</label>
				<input
					class="h-14 w-full rounded-none border-0 border-b border-foreground/40 bg-background px-0 text-xl placeholder:text-foreground/60 focus:border-foreground focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-ring"
					id="blog-search"
					name="search"
					autocomplete="off"
					placeholder={translation['blog.search.placeholder']}
					type="search"
					value={query}
					on:input={updateQuery} />
			</div>

			<div class="grid gap-2">
				<label
					id="blog-date-order-label"
					class="text-lg font-bold"
					for="blog-date-order">{translation['blog.date.order.label']}</label>
				<Select.Root
					name="date-order"
					items={dateOrders}
					selected={dateOrders.find((item) => item.value === order)}
					onSelectedChange={updateOrder}>
					<Select.Trigger
						id="blog-date-order"
						aria-labelledby="blog-date-order-label blog-date-order-value"
						class="flex h-14 w-full items-center justify-between gap-6 border-b border-foreground/40 bg-background text-left text-xl focus:border-foreground focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-ring sm:min-w-48">
						<span id="blog-date-order-value"><Select.Value /></span>
						<span
							aria-hidden="true"
							class="mr-1 h-2 w-2 -translate-y-0.5 rotate-45 border-b-2 border-r-2 border-foreground"
						></span>
					</Select.Trigger>
					<Select.Content
						align="start"
						sideOffset={16}
						class="z-50 border border-foreground/40 bg-background p-1 text-xl text-foreground">
						{#each dateOrders as item}
							<Select.Item
								value={item.value}
								label={item.label}
								class="flex min-h-12 cursor-pointer items-center px-3 py-2 outline-none data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground [&[data-selected]:not([data-highlighted])]:bg-muted"
								>{item.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		{#if selectedPosts.length === 0}
			<section
				aria-live="polite"
				class="flex flex-col items-start gap-4 py-8">
				<p class="text-xl">{translation['blog.no.results']}</p>
				<Button
					variant="outline"
					on:click={clearSearch}>{translation['blog.clear.search']}</Button>
			</section>
		{:else}
			<ul
				bind:this={postList}
				style:min-height={`${listMinHeight}px`}
				class="flex flex-col gap-12">
				{#each pagination.posts as post}
					<li>
						<BlogSlugHeader {post} />
						<BlogSlugDescription {post} />
						<div class="mt-5 flex flex-row items-center gap-3">
							<BlogSlugDate {post} />
							<a
								class="text-lg font-bold underline"
								aria-label={post?.slug}
								href={`blog/${post?.slug}`}>{translation['button.read.full.article']}</a>
						</div>
					</li>
				{/each}
			</ul>

			<nav
				bind:this={paginationNav}
				aria-label={translation['blog.pagination.label']}
				class="mt-12 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-t border-foreground/40 pt-8 sm:gap-3">
				<Button
					class="min-h-14 max-w-fit justify-self-start px-1.5 text-xl sm:px-4"
					disabled={pagination.page === 1}
					on:click={() => changePage(pagination.page - 1)}
					>{translation['blog.pagination.previous']}</Button>
				<p
					aria-live="polite"
					class="w-[6ch] text-center text-base font-bold sm:w-auto sm:text-lg">
					{translation['blog.pagination.page']}
					{pagination.page}
					{translation['blog.pagination.of']}
					{pagination.pageCount}
				</p>
				<Button
					class="min-h-14 max-w-fit justify-self-end px-1.5 text-xl sm:px-4"
					disabled={pagination.page === pagination.pageCount}
					on:click={() => changePage(pagination.page + 1)}
					>{translation['blog.pagination.next']}</Button>
			</nav>
			<p class="sr-only">
				{translation['blog.pagination.page.size']}
				{POSTS_PER_PAGE}
			</p>
		{/if}
	</div>
</div>
