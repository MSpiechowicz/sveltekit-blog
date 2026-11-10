import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

import type { Desktop } from '#lib/desktop/desktop.svelte.js';
import type { IconId } from '#lib/desktop/types.js';

type GotoOptions = NonNullable<Parameters<typeof goto>[1]>;

function navigate(path: string, options: GotoOptions): Promise<void> {
	if (path === '/') return goto(resolve('/'), options);
	if (path === '/blog') return goto(resolve('/blog'), options);

	return goto(resolve('/blog/[slug]', { slug: path.slice('/blog/'.length) }), options);
}

/** Navigates to a path ("/", "/blog" or "/blog/<slug>") returned by launch(); the route sync then opens its window. */
export function goToPath(path: string | null): void {
	if (path === null) return;

	void navigate(path, { reset: false });
}

/**
 * Moves the URL after a window closed. The navigation must not reopen a window, so the route
 * sync for this path is suppressed. The guard is only armed when a navigation really follows and
 * is released when that navigation settles, so a failed or superseded one cannot leave it armed.
 */
export function moveUrl(desk: Desktop, path: string | null): void {
	if (path === null) return;

	const release = () => desk.releaseSync(path);

	desk.suppressNextSync(path);
	navigate(path, { replace: true, reset: false }).then(release, release);
}

export function launchIcon(desk: Desktop, id: IconId): void {
	goToPath(desk.launch(id));
}
