<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	import { getDesktop } from '#lib/desktop/desktop.svelte.js';
	import type { Article } from '#lib/desktop/types.js';

	import AboutWindow from './about-window.svelte';
	import AlertDialog from './alert-dialog.svelte';
	import ArticleWindow from './article-window.svelte';
	import BlogWindow from './blog-window.svelte';
	import BootSplash from './boot-splash.svelte';
	import DesktopIcons from './desktop-icons.svelte';
	import HiddenFile from './hidden-file.svelte';
	import LinksWindow from './links-window.svelte';
	import MenuBar from './menu-bar.svelte';
	import { moveUrl } from './navigation.js';
	import ProjectsWindow from './projects-window.svelte';
	import TerminalWindow from './terminal-window.svelte';
	import Wallpaper from './wallpaper.svelte';
	import ZoomRect from './zoom-rect.svelte';
	import { setZoomHost, ZoomHost } from './zoom-host.js';

	let { article, children }: { article: Article | null; children: Snippet } = $props();

	const desk = getDesktop();

	let zoomRect = $state<ReturnType<typeof ZoomRect>>();

	const zoomHost = setZoomHost(
		new ZoomHost((from, to) => zoomRect?.play(from, to) ?? Promise.resolve()),
	);

	function rememberLauncher(event: MouseEvent) {
		zoomHost.rememberLauncher(event.target);
	}

	// One press closes one thing: the open menu, else the hidden file, else the front window.
	function closeOnEscape(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;

		// A held key must not close window after window, and Escape that cancels text composition is not
		// ours. Safari clears isComposing before that keydown and reports keyCode 229 instead.
		if (event.repeat || event.isComposing || event.keyCode === 229) return;

		moveUrl(desk, desk.escape());
	}

	// Child windows hydrate before this runs, so only windows opened later get the zoom animation.
	onMount(() => {
		desk.initClient();
		zoomHost.ready = true;
	});
</script>

<svelte:window
	onclickcapture={rememberLauncher}
	onkeydowncapture={closeOnEscape} />

<div
	class="os"
	class:inv={desk.inverted}
	class:roll={desk.rolling}>
	<MenuBar />

	<main class="desk">
		<Wallpaper />
		<DesktopIcons />
		<HiddenFile />

		{#if desk.isMounted('about')}
			<AboutWindow />
		{/if}
		{#if desk.isMounted('blog')}
			<BlogWindow />
		{/if}
		{#if article && desk.isMounted('post')}
			<ArticleWindow {article} />
		{/if}
		{#if desk.isMounted('projects')}
			<ProjectsWindow />
		{/if}
		{#if desk.isMounted('links')}
			<LinksWindow />
		{/if}
		{#if desk.isMounted('term')}
			<TerminalWindow />
		{/if}
		{#if desk.isMounted('alert')}
			<AlertDialog />
		{/if}

		{@render children()}
	</main>

	<ZoomRect bind:this={zoomRect} />
	<BootSplash />
</div>
