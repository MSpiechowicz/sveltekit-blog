<script lang="ts">
	import { getDesktop } from '#lib/desktop/desktop.svelte.js';
	import { filterProjects } from '#lib/projects.js';

	import AppWindow from './app-window.svelte';
	import IconGlyph from './icon-glyph.svelte';
	import { fill, t } from './text.js';

	const desk = getDesktop();

	let query = $state('');
	let input = $state<HTMLInputElement>();
	let scroller = $state<HTMLElement>();

	const visible = $derived(filterProjects(desk.projects.projects, query));
	const searching = $derived(query.trim() !== '');
	const counter = $derived(
		fill('{count} {unit}', {
			count: visible.length,
			unit: t(visible.length === 1 ? 'desktop.blog.itemSingular' : 'desktop.blog.itemPlural'),
		}),
	);

	// A new query always starts at the top of the list.
	$effect(() => {
		void query;

		if (scroller) scroller.scrollTop = 0;
	});

	function clearSearch(event: MouseEvent) {
		event.preventDefault();
		query = '';
		input?.focus();
	}
</script>

<AppWindow
	id="projects"
	title={t('desktop.window.projects')}
	x="26vw"
	y="40px"
	w="740px"
	h="82%"
	bodyClass="flush"
	bind:scroller>
	{#snippet bar()}
		<div class="bar">
			<label class="field">
				<input
					type="text"
					inputmode="search"
					autocomplete="off"
					placeholder={t('desktop.projects.searchPlaceholder')}
					aria-label={t('desktop.aria.searchProjects')}
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
	{/snippet}

	{#if !searching}
		<p class="intro">{desk.projects.intro}</p>
	{/if}

	{#each visible as project (project.title)}
		<div class="project">
			<IconGlyph name="folder" />
			<b>{project.title}</b>
			<p>{project.description}</p>

			<div class="tags">
				{#each project.technologies as technology (technology)}
					<span>{technology}</span>
				{/each}
			</div>

			<div class="go">
				{#if project.github}
					<a
						class="mini"
						href={project.github}
						target="_blank"
						rel="external noopener noreferrer">{t('desktop.projects.viewCode')}</a>
				{/if}
				{#if project.demo}
					<a
						class="mini"
						href={project.demo}
						target="_blank"
						rel="external noopener noreferrer">{t('desktop.projects.liveDemo')}</a>
				{/if}
			</div>
		</div>
	{:else}
		<p class="none">{t('desktop.projects.noResults')}</p>
	{/each}
</AppWindow>

<style>
	.intro {
		margin: 0;
		padding: 10px 12px;
		border-bottom: 2px solid var(--k);
		font-size: 13.5px;
	}

	.project {
		display: grid;
		grid-template-columns: 22px minmax(0, 1fr) auto;
		gap: 6px 10px;
		padding: 12px;
		border-bottom: 2px dotted var(--k);
	}

	.project :global(.glyph) {
		margin-top: 1px;
	}

	.project b {
		font-size: 1.05rem;
		font-weight: 700;
	}

	.project p {
		grid-column: 2;
		max-width: 62ch;
		margin: 0;
		font-size: 14px;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		grid-column: 2;
	}

	.tags span {
		padding: 0 6px;
		border: 2px solid var(--k);
		font-size: 12px;
		line-height: 1.5;
	}

	.go {
		display: flex;
		flex-direction: column;
		gap: 8px;
		grid-column: 3;
		grid-row: 1 / 4;
	}

	@media (max-width: 720px) {
		.go {
			flex-direction: row;
			grid-column: 2;
			grid-row: auto;
		}
	}
</style>
