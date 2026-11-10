<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';

	import { nextShown, selectPosts, takeBatch, BATCH_SIZE } from '#lib/blog-listing.js';
	import { getDesktop } from '#lib/desktop/desktop.svelte.js';
	import { formatDate } from '#lib/utils.js';

	import AppWindow from './app-window.svelte';
	import IconGlyph from './icon-glyph.svelte';
	import { fill, t } from './text.js';

	/** More rows are loaded when the list is scrolled closer than this to its end. */
	const NEAR_END_PX = 60;

	const desk = getDesktop();

	let query = $state('');
	let shown = $state(BATCH_SIZE);
	let hovered = $state('');
	let scroller = $state<HTMLElement>();
	let input = $state<HTMLInputElement>();

	// The search always runs over every post; only the rows on the page are limited to a batch.
	const found = $derived(selectPosts(desk.posts, query, desk.blogOrder));
	const rows = $derived(takeBatch(found, shown));
	const hasMore = $derived(rows.length < found.length);
	const counter = $derived(
		`${found.length} ${t(found.length === 1 ? 'desktop.blog.itemSingular' : 'desktop.blog.itemPlural')}`,
	);

	// ----------------------------------------------------------- sorting

	function sortByName() {
		desk.setBlogOrder('NAME');
	}

	function sortByDate() {
		desk.setBlogOrder(desk.blogOrder === 'DESC' ? 'ASC' : 'DESC');
	}

	// -------------------------------------------------------- search field

	function clearSearch(event: MouseEvent) {
		event.preventDefault();
		query = '';
		input?.focus();
	}

	// A new query or order (also chosen in the View menu) starts again from the first batch.
	$effect(() => {
		void query;
		void desk.blogOrder;

		untrack(() => {
			shown = BATCH_SIZE;
			hovered = '';

			if (scroller) scroller.scrollTop = 0;
		});
	});

	// Edit > Find Posts focuses the field; a request made before this window mounted is not replayed.
	let handledFocusTick = desk.blogSearchFocusTick;

	$effect(() => {
		const tick = desk.blogSearchFocusTick;

		if (tick <= handledFocusTick) return;

		handledFocusTick = tick;
		input?.focus();
	});

	// ----------------------------------------------------------- lazy rows

	function showMore() {
		shown = nextShown(found.length, shown);
	}

	// Adds a batch while the end of the list is near. A window that has no size yet (closed) is skipped.
	// Each call adds at most one batch and the list is finite, so the loop through the effect below ends.
	function fillList() {
		if (!scroller || !scroller.clientHeight || !hasMore) return;

		const distanceToEnd = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;

		if (distanceToEnd < NEAR_END_PX) showMore();
	}

	// Runs after every change of the rows or of the search result, so a window taller than the rows
	// keeps filling up. Reading both lists is what makes a new search trigger it: after a search the
	// "more rows exist" flag is often still true, which on its own would not re-run this.
	$effect(() => {
		void rows;
		void found;

		fillList();
	});

	$effect(() => {
		const element = scroller;

		if (!element) return;

		const resizeObserver = new ResizeObserver(fillList);

		resizeObserver.observe(element);
		element.addEventListener('scroll', fillList, { passive: true });

		return () => {
			resizeObserver.disconnect();
			element.removeEventListener('scroll', fillList);
		};
	});

	// -------------------------------------------------------- status strip

	function showDescription(description: string) {
		hovered = description;
	}

	function showIdle() {
		hovered = '';
	}
</script>

<AppWindow
	id="blog"
	title={t('desktop.window.blog')}
	x="20vw"
	y="60px"
	w="700px"
	h="74%"
	bodyClass="flush"
	bind:scroller>
	{#snippet bar()}
		<div class="bar">
			<label class="field">
				<input
					type="text"
					inputmode="search"
					placeholder={t('desktop.blog.searchPlaceholder')}
					autocomplete="off"
					aria-label={t('desktop.aria.searchPosts')}
					bind:this={input}
					bind:value={query} />
				{#if query}
					<button
						type="button"
						class="clr x"
						aria-label={t('desktop.aria.clearSearch')}
						title={t('desktop.aria.clearSearch')}
						onclick={clearSearch}></button>
				{/if}
			</label>
			<small aria-live="polite">{counter}</small>
		</div>

		<div class="cols">
			<button
				type="button"
				class:on={desk.blogOrder === 'NAME'}
				onclick={sortByName}>
				{t('desktop.blog.column.name')}
				{#if desk.blogOrder === 'NAME'}
					<span
						class="arrow up"
						aria-hidden="true"></span>
				{/if}
			</button>
			<button
				type="button"
				class:on={desk.blogOrder !== 'NAME'}
				onclick={sortByDate}>
				{t('desktop.blog.column.date')}
				{#if desk.blogOrder !== 'NAME'}
					<span
						class="arrow"
						class:up={desk.blogOrder === 'ASC'}
						aria-hidden="true"></span>
				{/if}
			</button>
		</div>
	{/snippet}

	{#if desk.isOpen('blog')}
		<h1 class="sr">{t('desktop.window.blog')}</h1>
	{/if}

	{#if rows.length}
		<ul class="list">
			{#each rows as post (post.slug)}
				<li>
					<a
						class="r"
						href={resolve('/blog/[slug]', { slug: post.slug })}
						data-opens="post"
						onmouseenter={() => showDescription(post.description)}
						onmouseleave={showIdle}
						onfocus={() => showDescription(post.description)}
						onblur={showIdle}>
						<IconGlyph name="doc" />
						<b>{post.title}</b>
						<time>{formatDate(post.date)}</time>
						<p>{post.description}</p>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="none">{t('desktop.blog.noResults')}</p>
	{/if}

	{#if hasMore}
		<button
			type="button"
			class="more"
			onclick={showMore}>
			{fill(t('desktop.blog.showing'), { shown: rows.length, total: found.length })}
		</button>
	{/if}

	{#snippet status()}
		<span class="summary">{hovered || t('desktop.blog.idle')}</span>
	{/snippet}
</AppWindow>

<style>
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.cols {
		display: grid;
		flex: none;
		grid-template-columns: 1fr 130px;
		padding-right: 20px;
		border-bottom: 2px solid var(--k);
		font-size: 13px;
	}

	.cols button {
		padding: 4px 12px;
		border: 0;
		background: none;
		text-align: left;
		cursor: pointer;
	}

	.cols button + button {
		border-left: 2px solid var(--k);
	}

	.cols button.on {
		text-decoration: underline;
	}

	/* Drawn, so the up and down arrows have the same size and sit at the same height. */
	.arrow {
		display: inline-block;
		width: 0;
		height: 0;
		margin-left: 3px;
		border: 4px solid transparent;
		border-top: 6px solid currentColor;
		border-bottom: 0;
		vertical-align: 1px;
	}

	.arrow.up {
		border-top: 0;
		border-bottom: 6px solid currentColor;
	}

	/* Two lines at most, so a long description never shows a cut-off third line. */
	.summary {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.cols button:hover {
		background: var(--k);
		color: var(--w);
	}

	.list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.r {
		--glyph-size: 20px;
		--glyph-fill: var(--w);
		--glyph-stroke: var(--k);
		--glyph-stroke-width: 2;

		display: grid;
		grid-template-columns: 22px 1fr 100px;
		gap: 0 8px;
		align-items: start;
		padding: 6px 12px;
		text-decoration: none;
	}

	.r :global(.glyph) {
		margin-top: 1px;
	}

	.r b {
		font-weight: 700;
	}

	.r time {
		padding-top: 2px;
		font-size: 13px;
		text-align: right;
	}

	.r p {
		display: none;
		grid-column: 2;
		margin: 2px 0 0;
		font-size: 13.5px;
		font-weight: 500;
	}

	.r:hover,
	.r:focus-visible {
		--glyph-fill: var(--sel);
		--glyph-stroke: var(--selfg);

		background: var(--sel);
		color: var(--selfg);
		outline: 0;
	}

	@media (max-width: 720px) {
		.cols {
			grid-template-columns: 1fr 1fr;
			padding-right: 0;
		}

		.r {
			grid-template-columns: 22px 1fr;
			padding: 10px 12px;
		}

		.r time {
			grid-column: 2;
			padding: 0;
			text-align: left;
		}

		.r p {
			display: block;
		}
	}
</style>
