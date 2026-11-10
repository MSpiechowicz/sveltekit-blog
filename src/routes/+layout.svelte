<script lang="ts">
	import type { Snippet } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';

	import DesktopShell from '#lib/components/desktop/desktop-shell.svelte';
	import { Desktop, setDesktop } from '#lib/desktop/desktop.svelte.js';
	import type { Article } from '#lib/desktop/types.js';

	import '../app.css';

	let { data, children }: { data: App.PageData; children: Snippet } = $props();

	function createDesktop(): Desktop {
		return new Desktop({
			pathname: page.url.pathname,
			posts: data.posts,
			projects: data.projects,
		});
	}

	const desk = setDesktop(createDesktop());

	const routeArticle = $derived.by((): Article | null => {
		const { content, meta } = page.data;

		return content && meta ? { content, meta } : null;
	});

	// The article window outlives its route: it stays open behind the Blog or About window.
	const article = $derived(routeArticle ?? desk.lastArticle);

	$effect(() => {
		if (routeArticle) desk.lastArticle = routeArticle;
	});

	// Runs once on load and after every navigation: the window that owns the URL opens.
	function syncRoute() {
		if (page.error) {
			// The URL is where the error page is, but no window opens for it. An unknown article
			// path starts with a window state but has nothing to show.
			desk.recordPath(page.url.pathname);
			if (!article) desk.closeWindow('post');

			return;
		}

		desk.syncRoute(page.url.pathname, routeArticle !== null);
	}

	afterNavigate(syncRoute);
</script>

<DesktopShell {article}>
	{@render children()}
</DesktopShell>
