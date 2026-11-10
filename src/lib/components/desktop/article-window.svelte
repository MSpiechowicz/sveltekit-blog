<script lang="ts">
	import { mount, unmount } from 'svelte';
	import { resolve } from '$app/paths';

	import CodeCopyButton from '#lib/components/code-copy-button.svelte';
	import { getDesktop } from '#lib/desktop/desktop.svelte.js';
	import type { Article } from '#lib/desktop/types.js';
	import { formatDate } from '#lib/utils.js';

	import AppWindow from './app-window.svelte';
	import { t } from './text.js';

	let { article }: { article: Article | null } = $props();

	const desk = getDesktop();

	let scroller = $state<HTMLElement>();
	let body = $state<HTMLElement>();

	const slug = $derived(article?.meta?.slug ?? desk.articleSlug ?? '');
	const content = $derived(article?.content);

	// A different article starts at the top.
	$effect(() => {
		void slug;

		if (scroller) scroller.scrollTop = 0;
	});

	// Article code is plain HTML from mdsvex, so the copy buttons are added once it is on the page.
	$effect(() => {
		if (!body || !content) return;

		const buttons = Array.from(body.querySelectorAll('pre > code')).map((code) =>
			mount(CodeCopyButton, {
				target: code.parentElement as HTMLElement,
				props: { getText: () => code.textContent?.trimEnd() ?? '' },
			}),
		);

		return () => {
			buttons.forEach((button) => unmount(button));
		};
	});

	// The link itself goes to the Blog window; here only the article closes.
	function goBack(event: MouseEvent) {
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

		desk.closeWindow('post');
	}
</script>

<AppWindow
	id="post"
	title={`${slug}${t('desktop.window.post.extension')}`}
	x="12vw"
	y="24px"
	w="780px"
	h="88%"
	bind:scroller>
	{#if article}
		<div class="doc">
			<h1>{article.meta.title}</h1>
			<div class="date">{formatDate(article.meta.date, 'long')}</div>
			<div class="rule"></div>

			<div
				class="body"
				bind:this={body}>
				{#if content}
					<article.content />
				{/if}
			</div>

			<a
				class="btn"
				href={resolve('/blog')}
				onclick={goBack}>{t('desktop.article.back')}</a>
		</div>
	{/if}
</AppWindow>

<style>
	/*
	 * One readable column for the whole article. It fills a normal-sized window and stays centred,
	 * at a comfortable line length, when the window is zoomed or made wide.
	 */
	.doc {
		max-width: 46rem;
		margin-inline: auto;
	}

	h1 {
		margin: 0 0 4px;
		font-size: clamp(1.5rem, 4vw, 2.1rem);
		font-weight: 900;
		line-height: 1.15;
		overflow-wrap: anywhere;
	}

	.date {
		margin-bottom: 6px;
		font-size: 13px;
	}

	.body {
		font-family: var(--serif);
		font-size: 1.1rem;
		font-weight: 500;
		line-height: 1.6;
		overflow-wrap: break-word;
	}

	.body :global(h2),
	.body :global(h3) {
		font-family: var(--f);
		line-height: 1.25;
	}

	.body :global(h2) {
		margin: 1.5em 0 0.4em;
		padding-bottom: 4px;
		border-bottom: 2px solid var(--k);
		font-size: 1.3rem;
	}

	.body :global(h3) {
		margin: 1.3em 0 0.3em;
		font-size: 1.1rem;
	}

	.body :global(p) {
		margin: 0 0 1em;
	}

	/* A sentence that introduces a code block sits close to it. */
	.body :global(p:has(+ pre)) {
		margin-bottom: 0.6em;
	}

	/* The articles separate blocks with <br/> lines; the block margins already provide the gap. */
	.body > :global(br) {
		display: none;
	}

	.body :global(ul),
	.body :global(ol) {
		margin: 0 0 1em;
		padding-left: 1.6em;
	}

	.body :global(li) {
		margin-top: 0.25em;
	}

	.body :global(a) {
		font-weight: 700;
		text-decoration: underline;
	}

	.body :global(a:hover),
	.body :global(a:focus-visible) {
		background: var(--sel);
		color: var(--selfg);
		outline: 0;
	}

	.body :global(strong),
	.body :global(b) {
		font-weight: 700;
	}

	.body :global(img) {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 1em 0;
		border: 2px solid var(--k);
	}

	.body :global(blockquote) {
		margin: 0 0 1em;
		padding: 0 0 0 1em;
		border-left: 4px solid var(--k);
	}

	.body :global(table) {
		display: block;
		max-width: 100%;
		margin: 0 0 1em;
		overflow-x: auto;
		border-collapse: collapse;
		font-size: 0.95rem;
	}

	.body :global(th),
	.body :global(td) {
		padding: 4px 10px;
		border: 2px solid var(--k);
		text-align: left;
	}

	.body :global(code) {
		padding: 0 4px;
		border: 1px solid var(--k);
		font: 500 0.85em/1.4 var(--mono);
		overflow-wrap: anywhere;
	}

	/* The right padding keeps the first line clear of the copy button in the corner. */
	.body :global(pre) {
		position: relative;
		margin: 0 3px 1em 0;
		padding: 12px 40px 12px 12px;
		border: 2px solid var(--k);
		box-shadow: 3px 3px 0 var(--k);
		font: 500 0.85rem/1.5 var(--mono);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.body :global(pre > code) {
		display: block;
		padding: 0;
		border: 0;
		font: inherit;
	}
</style>
