<script lang="ts">
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

	$: selectedPosts = selectPosts(data.posts, query, order);
	$: pagination = paginatePosts(selectedPosts, requestedPage);

	function updateQuery(event: Event) {
		query = (event.currentTarget as HTMLInputElement).value;
		requestedPage = 1;
	}

	function updateOrder(event: Event) {
		order = (event.currentTarget as HTMLSelectElement).value as DateOrder;
		requestedPage = 1;
	}

	function clearSearch() {
		query = '';
		requestedPage = 1;
	}
</script>

<svelte:head>
	<title>Maciej Spiechowicz - Blog posts</title>
</svelte:head>

<div class="flex h-[100%] flex-row justify-center">
	<div class="w-full max-w-[800px]">
		<div class="mb-12 grid gap-5 border-b pb-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
			<div class="grid gap-2">
				<label
					class="text-sm font-bold"
					for="blog-search">{translation['blog.search.label']}</label>
				<input
					class="h-10 w-full rounded-md border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
					class="text-sm font-bold"
					for="blog-date-order">{translation['blog.date.order.label']}</label>
				<div class="relative">
					<select
						class="h-10 w-full appearance-none rounded-md border bg-background pl-4 pr-10 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						id="blog-date-order"
						name="date-order"
						value={order}
						on:change={updateOrder}>
						<option value="DESC">{translation['blog.date.order.newest.first']}</option>
						<option value="ASC">{translation['blog.date.order.oldest.first']}</option>
					</select>
					<span
						aria-hidden="true"
						class="pointer-events-none absolute right-4 top-1/2 h-2 w-2 -translate-y-[65%] rotate-45 border-b-2 border-r-2 border-foreground"></span>
				</div>
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
			<ul class="flex flex-col gap-12">
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
				aria-label={translation['blog.pagination.label']}
				class="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-8">
				<Button
					class="min-h-14 max-w-fit text-lg"
					disabled={pagination.page === 1}
					on:click={() => (requestedPage = pagination.page - 1)}
					>{translation['blog.pagination.previous']}</Button>
				<p
					aria-live="polite"
					class="text-lg font-bold">
					{translation['blog.pagination.page']}
					{pagination.page}
					{translation['blog.pagination.of']}
					{pagination.pageCount}
				</p>
				<Button
					class="min-h-14 max-w-fit text-lg"
					disabled={pagination.page === pagination.pageCount}
					on:click={() => (requestedPage = pagination.page + 1)}
					>{translation['blog.pagination.next']}</Button>
			</nav>
			<p class="sr-only">
				{translation['blog.pagination.page.size']}
				{POSTS_PER_PAGE}
			</p>
		{/if}
	</div>
</div>
