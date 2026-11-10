import { describe, expect, it } from 'vitest';

import type { WindowId } from './types';
import {
	closeWindow,
	frontWindow,
	initialState,
	openWindow,
	routeWindow,
	topmost,
	windowPath,
	type WmState,
} from './window-manager';

const empty: WmState = { open: [], mounted: [] };

function openAll(...ids: WindowId[]): WmState {
	return ids.reduce(openWindow, empty);
}

describe('routeWindow and windowPath', () => {
	it('maps every routed path to its window', () => {
		expect(routeWindow('/')).toEqual({ id: 'about' });
		expect(routeWindow('/blog')).toEqual({ id: 'blog' });
		expect(routeWindow('/blog/')).toEqual({ id: 'blog' });
		expect(routeWindow('/blog/hello-world')).toEqual({ id: 'post', slug: 'hello-world' });
		expect(routeWindow('/blog/caf%C3%A9')).toEqual({ id: 'post', slug: 'café' });
	});

	it('returns null for paths that are not windows', () => {
		expect(routeWindow('/nope')).toBeNull();
		expect(routeWindow('/blog/a/b')).toBeNull();
		expect(routeWindow('/rss.xml')).toBeNull();
	});

	it('only routed windows have a path', () => {
		expect(windowPath('about')).toBe('/');
		expect(windowPath('blog')).toBe('/blog');
		expect(windowPath('post', 'hello-world')).toBe('/blog/hello-world');
		expect(windowPath('post')).toBeNull();

		const unrouted: WindowId[] = ['projects', 'links', 'term', 'alert'];
		for (const id of unrouted) expect(windowPath(id)).toBeNull();
	});

	it('round-trips window to path and back', () => {
		expect(routeWindow(windowPath('about')!)).toEqual({ id: 'about' });
		expect(routeWindow(windowPath('blog')!)).toEqual({ id: 'blog' });
		expect(routeWindow(windowPath('post', 'x')!)).toEqual({ id: 'post', slug: 'x' });
	});
});

describe('initialState', () => {
	it('opens and mounts the window that owns the path', () => {
		expect(initialState('/')).toEqual({ open: ['about'], mounted: ['about'] });
		expect(initialState('/blog')).toEqual({ open: ['blog'], mounted: ['blog'] });
		expect(initialState('/blog/x')).toEqual({ open: ['post'], mounted: ['post'] });
	});

	it('opens nothing for an unknown path', () => {
		expect(initialState('/nope')).toEqual({ open: [], mounted: [] });
	});
});

describe('openWindow', () => {
	it('stacks windows in opening order and mounts them', () => {
		const state = openAll('about', 'blog', 'term');

		expect(state.open).toEqual(['about', 'blog', 'term']);
		expect(state.mounted).toEqual(['about', 'blog', 'term']);
	});

	it('brings an already open window to the front without duplicating it', () => {
		const state = openWindow(openAll('about', 'blog', 'term'), 'about');

		expect(state.open).toEqual(['blog', 'term', 'about']);
		expect(state.mounted).toEqual(['about', 'blog', 'term']);
	});

	it('does not mutate the previous state', () => {
		const before = openAll('about');
		const snapshot = structuredClone(before);

		openWindow(before, 'blog');

		expect(before).toEqual(snapshot);
	});
});

describe('closeWindow', () => {
	it('removes the window from the stack but keeps it mounted', () => {
		const state = closeWindow(openAll('about', 'blog', 'term'), 'blog');

		expect(state.open).toEqual(['about', 'term']);
		expect(state.mounted).toEqual(['about', 'blog', 'term']);
	});

	it('leaves the state alone when the window is not open', () => {
		const state = openAll('about');

		expect(closeWindow(state, 'term')).toBe(state);
	});

	it('does not remount a reopened window twice', () => {
		const reopened = openWindow(closeWindow(openAll('about', 'blog'), 'blog'), 'blog');

		expect(reopened.open).toEqual(['about', 'blog']);
		expect(reopened.mounted).toEqual(['about', 'blog']);
	});
});

describe('frontWindow', () => {
	it('moves an open window to the front', () => {
		expect(frontWindow(openAll('about', 'blog', 'term'), 'about').open).toEqual([
			'blog',
			'term',
			'about',
		]);
	});

	it('ignores windows that are not open and keeps the front window in place', () => {
		const state = openAll('about', 'blog');

		expect(frontWindow(state, 'term')).toBe(state);
		expect(frontWindow(state, 'blog')).toBe(state);
	});
});

describe('topmost', () => {
	it('returns null when nothing is open', () => {
		expect(topmost(empty)).toBeNull();
	});

	it('follows the stack after a close', () => {
		const state = openAll('about', 'blog', 'term');

		expect(topmost(state)).toBe('term');
		expect(topmost(closeWindow(state, 'term'))).toBe('blog');
		expect(topmost(closeWindow(closeWindow(state, 'term'), 'blog'))).toBe('about');
	});

	it('skips windows rejected by the filter', () => {
		const routed = (id: WindowId) => windowPath(id, 'x') !== null;
		const state = openAll('about', 'blog', 'projects', 'term');

		expect(topmost(state, routed)).toBe('blog');
		expect(topmost(closeWindow(state, 'blog'), routed)).toBe('about');
		expect(topmost(closeWindow(closeWindow(state, 'blog'), 'about'), routed)).toBeNull();
	});
});
