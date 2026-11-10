import type { WindowId } from './types.js';

export type WmState = {
	/** Open windows, back to front: the last entry is the front window. */
	open: WindowId[];
	/** Windows that have been opened at least once; closing does not unmount them. */
	mounted: WindowId[];
};

type RouteWindow = { id: 'about' | 'blog' | 'post'; slug?: string };

function decodeSegment(segment: string): string {
	try {
		return decodeURIComponent(segment);
	} catch {
		return segment;
	}
}

export function routeWindow(pathname: string): RouteWindow | null {
	const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

	if (path === '/' || path === '') return { id: 'about' };
	if (path === '/blog') return { id: 'blog' };

	const match = /^\/blog\/([^/]+)$/.exec(path);
	if (match) return { id: 'post', slug: decodeSegment(match[1]) };

	return null;
}

export function windowPath(id: WindowId, slug?: string): '/' | '/blog' | `/blog/${string}` | null {
	if (id === 'about') return '/';
	if (id === 'blog') return '/blog';
	if (id === 'post' && slug) return `/blog/${slug}`;

	return null;
}

export function initialState(pathname: string): WmState {
	const route = routeWindow(pathname);
	if (!route) return { open: [], mounted: [] };

	return { open: [route.id], mounted: [route.id] };
}

export function openWindow(s: WmState, id: WindowId): WmState {
	return {
		open: [...s.open.filter((openId) => openId !== id), id],
		mounted: s.mounted.includes(id) ? s.mounted : [...s.mounted, id],
	};
}

export function closeWindow(s: WmState, id: WindowId): WmState {
	if (!s.open.includes(id)) return s;

	return { open: s.open.filter((openId) => openId !== id), mounted: s.mounted };
}

export function frontWindow(s: WmState, id: WindowId): WmState {
	if (!s.open.includes(id)) return s;
	if (s.open[s.open.length - 1] === id) return s;

	return { open: [...s.open.filter((openId) => openId !== id), id], mounted: s.mounted };
}

export function topmost(s: WmState, filter?: (id: WindowId) => boolean): WindowId | null {
	for (let index = s.open.length - 1; index >= 0; index--) {
		const id = s.open[index];
		if (!filter || filter(id)) return id;
	}

	return null;
}
