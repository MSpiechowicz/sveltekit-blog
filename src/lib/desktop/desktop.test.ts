import { describe, expect, it, vi } from 'vitest';

import { Desktop } from './desktop.svelte';
import type { PostSummary, ProjectsData, SceneHost } from './types';

const posts: PostSummary[] = [
	{ slug: 'hello-world', title: 'Hello World!', description: 'First.', date: '04-14-2024' },
];
const projects: ProjectsData = { intro: 'Intro', projects: [] };

function desktop(pathname = '/'): Desktop {
	return new Desktop({ pathname, posts, projects });
}

describe('initial state', () => {
	it('opens the window owned by the first path and nothing for unknown paths', () => {
		expect(desktop('/').front).toBe('about');
		expect(desktop('/blog').front).toBe('blog');
		expect(desktop('/blog/hello-world').front).toBe('post');
		expect(desktop('/blog/hello-world').articleSlug).toBe('hello-world');
		expect(desktop('/nope').front).toBeNull();
	});

	it('shows the default theme and an unfinished boot until the client initialises', () => {
		const d = desktop();

		expect(d.theme).toBe('paper-ink');
		expect(d.bootDone).toBe(false);
		expect(d.wallpaper).toBe(true);
	});
});

describe('launch', () => {
	it('returns paths for routed icons and null for the others', () => {
		const d = desktop('/nope');

		expect(d.launch('about')).toBe('/');
		expect(d.launch('blog')).toBe('/blog');
		expect(d.launch('projects')).toBeNull();
		expect(d.launch('term')).toBeNull();
		expect(d.launch('links')).toBeNull();
		expect(d.isOpen('projects') && d.isOpen('term') && d.isOpen('links')).toBe(true);
		expect(d.front).toBe('links');
	});

	it('does not ask to navigate when the icon owns the current path', () => {
		const d = desktop('/');

		expect(d.launch('about')).toBeNull();
		expect(d.launch('blog')).toBe('/blog');
	});

	it('bumps the terminal focus tick when the terminal opens', () => {
		const d = desktop();
		const before = d.terminalFocusTick;

		d.launch('term');

		expect(d.terminalFocusTick).toBe(before + 1);
	});
});

describe('closeWindow', () => {
	it('returns the path of the topmost remaining routed window when the owner closes', () => {
		const d = desktop('/blog');
		d.openWindow('about');
		d.openWindow('blog');
		d.openWindow('term');

		expect(d.closeWindow('blog')).toBe('/');
		expect(d.front).toBe('term');
	});

	it('falls back to "/" when no routed window remains', () => {
		const d = desktop('/blog');
		d.openWindow('projects');

		expect(d.closeWindow('blog')).toBe('/');
	});

	it('returns null when the closed window does not own the URL', () => {
		const d = desktop('/blog');
		d.openWindow('projects');

		expect(d.closeWindow('projects')).toBeNull();
		expect(d.closeWindow('term')).toBeNull();
	});

	it('returns null when the fallback is the URL that is already current', () => {
		const d = desktop('/');

		expect(d.closeWindow('about')).toBeNull();
	});

	it('keeps the window mounted after closing it', () => {
		const d = desktop('/blog');

		d.closeWindow('blog');

		expect(d.isOpen('blog')).toBe(false);
		expect(d.isMounted('blog')).toBe(true);
	});

	it('falls back to the article path when the article window is the topmost routed one', () => {
		const d = desktop('/blog/hello-world');
		d.syncRoute('/blog', true);
		d.syncRoute('/', true);

		expect(d.closeWindow('about')).toBe('/blog');

		d.suppressNextSync('/blog');
		d.syncRoute('/blog', true);

		expect(d.closeWindow('blog')).toBe('/blog/hello-world');
	});

	it('closeAll sends the URL to "/" unless it is already there', () => {
		const onBlog = desktop('/blog');
		onBlog.openWindow('term');

		expect(onBlog.closeAll()).toBe('/');
		expect(onBlog.front).toBeNull();
		expect(desktop('/').closeAll()).toBeNull();
	});

	it('closeFront closes the topmost window', () => {
		const d = desktop('/');
		d.openWindow('links');

		expect(d.closeFront()).toBeNull();
		expect(d.front).toBe('about');
	});
});

describe('syncRoute', () => {
	it('opens and fronts the route window after a navigation', () => {
		const d = desktop('/');
		d.openWindow('term');

		d.syncRoute('/blog', false);

		expect(d.front).toBe('blog');
		expect(d.isOpen('about')).toBe(true);
	});

	it('keeps the article open behind when the route moves on', () => {
		const d = desktop('/blog');

		d.syncRoute('/blog/hello-world', true);
		d.syncRoute('/blog', false);

		expect(d.isOpen('post')).toBe(true);
		expect(d.front).toBe('blog');
		expect(d.articleSlug).toBe('hello-world');
	});

	it('ignores an article route that has no article', () => {
		const d = desktop('/blog');

		d.syncRoute('/blog/missing', false);

		expect(d.isOpen('post')).toBe(false);
		expect(d.front).toBe('blog');
	});

	it('suppresses the sync of the armed path once but still records the path', () => {
		const d = desktop('/blog');
		d.openWindow('term');

		d.suppressNextSync('/');
		d.syncRoute('/', false);

		expect(d.front).toBe('term');
		expect(d.isOpen('about')).toBe(false);
		expect(d.currentPath).toBe('/');

		d.syncRoute('/', false);

		expect(d.front).toBe('about');
	});

	it('opens the window of a different path and disarms the guard', () => {
		const d = desktop('/blog');
		d.openWindow('term');

		d.suppressNextSync('/');
		d.syncRoute('/blog/hello-world', true);

		expect(d.front).toBe('post');

		d.syncRoute('/', false);

		expect(d.front).toBe('about');
	});

	it('does not suppress anything once the navigation has settled', () => {
		const d = desktop('/blog');
		d.openWindow('term');

		d.suppressNextSync('/');
		d.releaseSync('/');
		d.syncRoute('/', false);

		expect(d.front).toBe('about');
	});

	it('keeps a newer guard when an older navigation settles', () => {
		const d = desktop('/blog');
		d.openWindow('term');

		d.suppressNextSync('/');
		d.suppressNextSync('/blog');
		d.releaseSync('/');
		d.syncRoute('/blog', false);

		expect(d.front).toBe('term');
	});

	it('an error route disarms the guard', () => {
		const d = desktop('/blog');

		d.suppressNextSync('/');
		d.recordPath('/blog/nope');
		d.syncRoute('/', false);

		expect(d.front).toBe('about');
	});

	it('after a navigation to an error route the launcher and ownership use the new path', () => {
		const d = desktop('/blog');

		d.recordPath('/blog/nope');

		expect(d.currentPath).toBe('/blog/nope');
		expect(d.launch('blog')).toBe('/blog');

		d.syncRoute('/blog', false);

		expect(d.closeWindow('blog')).toBe('/');
	});

	it('closing a window does not use the pre-error path for ownership', () => {
		const d = desktop('/blog');

		d.recordPath('/blog/nope');

		expect(d.closeWindow('blog')).toBeNull();
		expect(d.isOpen('blog')).toBe(false);
	});

	it('does not reorder windows on unknown paths', () => {
		const d = desktop('/');
		d.openWindow('term');

		d.syncRoute('/nope', false);

		expect(d.front).toBe('term');
	});
});

describe('escape', () => {
	it('closes the open menu first, then the hidden file, then the front window', () => {
		const d = desktop('/blog');
		d.openWindow('term');
		d.showMenu('file');
		d.openHiddenFile();

		expect(d.escape()).toBeNull();
		expect(d.openMenu).toBeNull();
		expect(d.hiddenFileOpen).toBe(true);
		expect(d.front).toBe('term');

		expect(d.escape()).toBeNull();
		expect(d.hiddenFileOpen).toBe(false);
		expect(d.front).toBe('term');

		expect(d.escape()).toBeNull();
		expect(d.isOpen('term')).toBe(false);
		expect(d.front).toBe('blog');
	});

	it('returns the new path when the closed front window owned the URL', () => {
		const d = desktop('/blog');

		expect(d.escape()).toBe('/');
		expect(d.front).toBeNull();
	});

	it('asks the menu bar to return focus only when Escape closed the menu', () => {
		const d = desktop('/');
		d.showMenu('edit');
		d.closeMenu();

		expect(d.menuFocusTick).toBe(0);

		d.showMenu('edit');
		d.escape();

		expect(d.menuFocusTick).toBe(1);
	});
});

describe('windows geometry', () => {
	it('stores overrides, ends zoom on manual geometry and restores them when unzoomed', () => {
		const d = desktop('/');

		d.setGeometry('about', { left: 10, top: 20 });
		d.toggleZoom('about');

		expect(d.isZoomed('about')).toBe(true);
		expect(d.geometry('about')).toEqual({ left: 10, top: 20 });

		d.setGeometry('about', { left: 30, top: 40, width: 500, height: 400 });

		expect(d.isZoomed('about')).toBe(false);
		expect(d.geometry('about')).toEqual({ left: 30, top: 40, width: 500, height: 400 });
	});

	it('zooms the front window by default and never the alert', () => {
		const d = desktop('/');
		d.openWindow('links');

		d.toggleZoom();

		expect(d.isZoomed('links')).toBe(true);

		d.alert('Title', 'Message');
		d.toggleZoom();

		expect(d.isZoomed('alert')).toBe(false);
	});

	it('shades and unshades; opening a window unshades it', () => {
		const d = desktop('/');

		d.toggleShade('about');
		expect(d.isShaded('about')).toBe(true);

		d.openWindow('about');
		expect(d.isShaded('about')).toBe(false);
	});

	it('cleanUpWindows cascades open windows back to front and resets zoom and shade', () => {
		const d = desktop('/');
		d.openWindow('blog');
		d.setGeometry('blog', { width: 600 });
		d.toggleZoom('blog');
		d.toggleShade('about');

		d.cleanUpWindows();

		expect(d.geometry('about')).toEqual({ left: 24, top: 12 });
		expect(d.geometry('blog')).toEqual({ left: 54, top: 42, width: 600 });
		expect(d.isZoomed('blog')).toBe(false);
		expect(d.isShaded('about')).toBe(false);
	});

	it('assigns increasing z-indexes from the stack order', () => {
		const d = desktop('/');
		d.openWindow('blog');

		expect(d.zIndex('blog')).toBeGreaterThan(d.zIndex('about'));

		d.frontWindow('about');

		expect(d.zIndex('about')).toBeGreaterThan(d.zIndex('blog'));
		expect(d.zIndex('term')).toBe(0);
	});
});

describe('trash and alert', () => {
	it('lists trashed icons in an alert with a Put Back action', () => {
		const d = desktop('/');
		d.trash('links');
		d.trash('term');
		d.trash('links');
		d.trash('trash');

		expect(d.trashed).toEqual(['links', 'term']);
		expect(d.launch('trash')).toBeNull();
		expect(d.alertState).toEqual({
			title: 'Trash',
			message: 'In the Trash: Links, Terminal.',
			label: 'Put Back',
		});
		expect(d.front).toBe('alert');

		d.dismissAlert(true);

		expect(d.trashed).toEqual([]);
		expect(d.isOpen('alert')).toBe(false);
		expect(d.alertState).toBeNull();
	});

	it('says the Trash is empty when nothing was thrown away', () => {
		const d = desktop('/');

		d.launch('trash');

		expect(d.alertState).toEqual({
			title: 'Trash',
			message: 'The Trash is empty. Drag an icon onto it to throw it away.',
			label: 'OK',
		});
	});

	it('runs onOk only when the alert is confirmed', () => {
		const d = desktop('/');
		const onOk = vi.fn();

		d.alert('Title', 'Message', { onOk });
		d.dismissAlert(false);
		expect(onOk).not.toHaveBeenCalled();

		d.alert('Title', 'Message', { label: 'Go', onOk });
		expect(d.alertState?.label).toBe('Go');
		d.dismissAlert(true);

		expect(onOk).toHaveBeenCalledTimes(1);
	});

	it('discards the pending action when the alert window is closed directly', () => {
		const d = desktop('/');
		const onOk = vi.fn();

		d.alert('Title', 'Message', { onOk });
		d.closeWindow('alert');
		d.dismissAlert(true);

		expect(onOk).not.toHaveBeenCalled();
	});
});

describe('icons', () => {
	it('frees icons once, then cleans them up', () => {
		const d = desktop('/');
		const positions = {
			about: { left: 1, top: 2 },
			blog: { left: 3, top: 4 },
			projects: { left: 5, top: 6 },
			term: { left: 7, top: 8 },
			links: { left: 9, top: 10 },
			trash: { left: 11, top: 12 },
		};

		expect(d.iconsFree).toBe(false);
		expect(d.iconPosition('blog')).toBeNull();

		d.freeIcons(positions);
		d.setIconPosition('blog', { left: 30, top: 40 });

		expect(d.iconsFree).toBe(true);
		expect(d.iconPosition('about')).toEqual({ left: 1, top: 2 });
		expect(d.iconPosition('blog')).toEqual({ left: 30, top: 40 });

		d.cleanUpIcons();

		expect(d.iconsFree).toBe(false);
		expect(d.iconPosition('blog')).toBeNull();
	});
});

describe('scenes', () => {
	it('play switches the wallpaper on first, tryScene refuses when it is off', () => {
		const d = desktop('/');
		const host: SceneHost = { play: vi.fn(() => true), sunset: vi.fn() };
		const unregister = d.registerScenes(host);

		d.toggleWallpaper();
		expect(d.tryScene('jog')).toBe(false);
		expect(host.play).not.toHaveBeenCalled();

		expect(d.play('jog')).toBe(true);
		expect(d.wallpaper).toBe(true);
		expect(d.tryScene('plane')).toBe(true);

		d.toggleWallpaper();
		d.sunset();
		expect(d.wallpaper).toBe(true);
		expect(host.sunset).toHaveBeenCalledTimes(1);

		unregister();
		expect(d.play('ufo')).toBe(false);
		expect(d.tryScene('ufo')).toBe(false);
	});

	it('an old unregister callback does not remove a newer host', () => {
		const d = desktop('/');
		const first: SceneHost = { play: () => false, sunset: () => {} };
		const second: SceneHost = { play: () => true, sunset: () => {} };

		const unregisterFirst = d.registerScenes(first);
		d.registerScenes(second);
		unregisterFirst();

		expect(d.play('jog')).toBe(true);
	});
});

describe('restart', () => {
	it('closes every window, replays the boot and reopens About once booted', () => {
		const d = desktop('/blog');
		d.openWindow('term');
		d.alert('Title', 'Message');
		d.openHiddenFile();
		const key = d.bootKey;

		d.restart();

		expect(d.front).toBeNull();
		expect(d.alertState).toBeNull();
		expect(d.hiddenFileOpen).toBe(false);
		expect(d.bootDone).toBe(false);
		expect(d.bootKey).toBe(key + 1);

		d.markBooted();

		expect(d.bootDone).toBe(true);
		expect(d.front).toBe('about');
	});
});
