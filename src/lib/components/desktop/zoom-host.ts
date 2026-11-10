import { getContext, setContext } from 'svelte';

import type { WindowId } from '#lib/desktop/types.js';

const LAUNCHER_MAX_AGE_MS = 1000;
const ZOOM_CONTEXT_KEY = Symbol('zoom-host');

/**
 * Connects windows to the zoom rectangle. Anything that opens a window can carry
 * data-opens="<window id>"; the element the user last clicked is the origin of the animation,
 * otherwise the desktop icon for that window, otherwise the menu bar.
 */
export class ZoomHost {
	/** False until the shell has mounted: windows that arrive with the server HTML do not animate. */
	ready = false;

	#play: (from: DOMRect, to: DOMRect) => Promise<void>;
	#launcher: HTMLElement | null = null;
	#launchedAt = 0;

	constructor(play: (from: DOMRect, to: DOMRect) => Promise<void>) {
		this.#play = play;
	}

	rememberLauncher(target: EventTarget | null): void {
		const element = target instanceof Element ? target.closest<HTMLElement>('[data-opens]') : null;

		this.#launcher = element;
		this.#launchedAt = Date.now();
	}

	sourceRect(id: WindowId): DOMRect {
		const launcher = this.#launcher;
		const fresh = Date.now() - this.#launchedAt < LAUNCHER_MAX_AGE_MS;

		if (launcher && fresh && launcher.isConnected && launcher.dataset.opens === id) {
			return launcher.getBoundingClientRect();
		}

		const icon = document.querySelector<HTMLElement>(`.icons [data-opens="${id}"]`);
		if (icon) return icon.getBoundingClientRect();

		return document.querySelector('.menubar')?.getBoundingClientRect() ?? new DOMRect();
	}

	animate(from: DOMRect, to: DOMRect): Promise<void> {
		return this.#play(from, to);
	}
}

export function setZoomHost(host: ZoomHost): ZoomHost {
	return setContext(ZOOM_CONTEXT_KEY, host);
}

export function getZoomHost(): ZoomHost | undefined {
	return getContext<ZoomHost | undefined>(ZOOM_CONTEXT_KEY);
}
