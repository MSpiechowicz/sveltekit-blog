<script lang="ts">
	import { resolve } from '$app/paths';

	import { displayAddress, profileLinks } from '#lib/data/links.js';
	import translation from '#lib/translations/en-GB.json';

	import AppWindow from './app-window.svelte';
	import IconGlyph from './icon-glyph.svelte';
	import { t } from './text.js';

	const feedAddress = `${displayAddress(translation.url)}/rss.xml`;
</script>

<AppWindow
	id="links"
	title={t('desktop.window.links')}
	x="40vw"
	y="210px"
	w="560px"
	bodyClass="flush">
	<p class="intro">{t('desktop.links.intro')}</p>

	<ul class="list">
		{#each profileLinks as link (link.id)}
			<li>
				<a
					class="entry"
					href={link.href}
					target="_blank"
					rel="me external noopener noreferrer">
					<IconGlyph name="link" />
					<b>{link.name}</b>
					<span class="address">{displayAddress(link.href)}</span>
					<span class="note">{t(`desktop.links.${link.id}`)}</span>
				</a>
			</li>
		{/each}

		<li>
			<a
				class="entry"
				href={resolve('/rss.xml')}
				target="_blank"
				rel="noopener noreferrer">
				<IconGlyph name="doc" />
				<b>{t('desktop.links.rss.name')}</b>
				<span class="address">{feedAddress}</span>
				<span class="note">{t('desktop.links.rss')}</span>
			</a>
		</li>
	</ul>
</AppWindow>

<style>
	.intro {
		margin: 0;
		padding: 10px 12px;
		border-bottom: 2px solid var(--k);
		font-size: 13.5px;
	}

	.list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li + li {
		border-top: 2px dotted var(--k);
	}

	/* The whole row is the link: name and address on the first line, what it is for below. */
	.entry {
		--glyph-size: 20px;
		--glyph-stroke-width: 2;

		display: grid;
		grid-template-columns: 22px auto minmax(0, 1fr);
		gap: 2px 10px;
		align-items: baseline;
		padding: 11px 12px;
		text-decoration: none;
	}

	.entry :global(.glyph) {
		align-self: start;
		margin-top: 2px;
	}

	.entry b {
		font-size: 1.05rem;
		font-weight: 700;
	}

	.address {
		overflow: hidden;
		font: 500 12.5px/1.4 var(--mono);
		text-align: right;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note {
		grid-column: 2 / 4;
		font-size: 14px;
		font-weight: 500;
	}

	.entry:hover,
	.entry:focus-visible {
		--glyph-fill: var(--sel);
		--glyph-stroke: var(--selfg);

		background: var(--sel);
		color: var(--selfg);
		outline: 0;
	}

	@media (max-width: 720px) {
		.entry {
			grid-template-columns: 22px minmax(0, 1fr);
			padding: 13px 12px;
		}

		.address,
		.note {
			grid-column: 2;
			text-align: left;
		}
	}
</style>
