import { getContext, setContext } from 'svelte';
import { prefersReducedMotion } from 'svelte/motion';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

import translation from '#lib/translations/en-GB.json';

import { DEFAULT_THEME, isThemeId } from './themes.js';
import type {
	Article,
	Geometry,
	IconId,
	ListOrder,
	MenuId,
	PostSummary,
	ProjectsData,
	SceneHost,
	SceneName,
	ThemeId,
	WindowId,
} from './types.js';
import * as manager from './window-manager.js';
import type { WmState } from './window-manager.js';

type IconPosition = { left: number; top: number };
type AlertState = { title: string; message: string; label: string };

const THEME_STORAGE_KEY = 'theme';
const BOOT_STORAGE_KEY = 'booted';
const BASE_Z_INDEX = 10;
const ROLL_DURATION_MS = 1500;
const CASCADE_LEFT = 24;
const CASCADE_TOP = 12;
const CASCADE_STEP = 30;
const NO_GEOMETRY: Geometry = Object.freeze({});

function text(key: string): string {
	return (translation as Record<string, string>)[key] ?? key;
}

function fill(template: string, values: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}

function readStorage(storage: () => Storage, key: string): string | null {
	try {
		return storage().getItem(key);
	} catch {
		return null;
	}
}

function writeStorage(storage: () => Storage, key: string, value: string): void {
	try {
		storage().setItem(key, value);
	} catch {
		// Private mode or blocked storage: the preference simply is not remembered.
	}
}

/**
 * All state of the desktop shell. One instance per layout render (see setDesktop), so nothing is
 * shared between requests. Methods that touch the browser (initClient, setTheme, copyLink, ...)
 * are only called from onMount or event handlers, never during construction or render.
 *
 * The class never navigates. Methods that can change the URL return the path to go to and the
 * components navigate; call suppressNextSync(path) first when that navigation should not open or
 * front a window (closing a window).
 */
export class Desktop {
	readonly posts: PostSummary[];
	readonly projects: ProjectsData;

	lastArticle: Article | null = $state.raw(null);
	articleSlug: string | null = $state(null);

	blogOrder: ListOrder = $state('DESC');
	theme: ThemeId = $state(DEFAULT_THEME);
	inverted = $state(false);
	wallpaper = $state(true);

	#wm: WmState = $state.raw({ open: [], mounted: [] });
	#geometry = new SvelteMap<WindowId, Geometry>();
	#shaded = new SvelteSet<WindowId>();
	#zoomed = new SvelteSet<WindowId>();

	#currentPath: string;
	#suppressedPath: string | null = null;

	#blogSearchFocusTick = $state(0);
	#terminalFocusTick = $state(0);

	#trashed: IconId[] = $state.raw([]);
	#iconPositions = new SvelteMap<IconId, IconPosition>();
	#iconsFree = $state(false);

	#alertState: AlertState | null = $state.raw(null);
	#alertOk: (() => void) | null = null;

	#sceneHost: SceneHost | null = null;
	#rolling = $state(false);
	#rollTimer: ReturnType<typeof setTimeout> | undefined;
	#hiddenFileOpen = $state(false);

	#openMenu: MenuId | null = $state(null);
	#menuFocusTick = $state(0);

	#bootKey = $state(0);
	#bootDone = $state(false);
	#reopenAboutAfterBoot = false;

	constructor(init: { pathname: string; posts: PostSummary[]; projects: ProjectsData }) {
		this.posts = init.posts;
		this.projects = init.projects;

		this.#currentPath = init.pathname;
		this.#wm = manager.initialState(init.pathname);

		const route = manager.routeWindow(init.pathname);
		if (route?.id === 'post') this.articleSlug = route.slug ?? null;
	}

	// ---------------------------------------------------------------- windows

	get front(): WindowId | null {
		return manager.topmost(this.#wm);
	}

	get currentPath(): string {
		return this.#currentPath;
	}

	get reducedMotion(): boolean {
		return prefersReducedMotion.current;
	}

	isOpen(id: WindowId): boolean {
		return this.#wm.open.includes(id);
	}

	isMounted(id: WindowId): boolean {
		return this.#wm.mounted.includes(id);
	}

	zIndex(id: WindowId): number {
		const position = this.#wm.open.indexOf(id);
		if (position === -1) return 0;

		return BASE_Z_INDEX + position;
	}

	geometry(id: WindowId): Geometry {
		return this.#geometry.get(id) ?? NO_GEOMETRY;
	}

	isShaded(id: WindowId): boolean {
		return this.#shaded.has(id);
	}

	isZoomed(id: WindowId): boolean {
		return this.#zoomed.has(id);
	}

	openWindow(id: WindowId): void {
		this.#wm = manager.openWindow(this.#wm, id);
		this.#shaded.delete(id);

		if (id === 'term') this.focusTerminal();
	}

	launch(id: IconId): string | null {
		if (id === 'trash') {
			this.#showTrash();

			return null;
		}

		this.openWindow(id);

		const path = manager.windowPath(id);
		if (path === null || path === this.#currentPath) return null;

		return path;
	}

	closeWindow(id: WindowId): string | null {
		if (!this.isOpen(id)) return null;

		const ownsPath = manager.routeWindow(this.#currentPath)?.id === id;

		this.#wm = manager.closeWindow(this.#wm, id);
		if (id === 'alert') this.#clearAlert();

		return ownsPath ? this.#fallbackPath() : null;
	}

	closeFront(): string | null {
		const id = this.front;
		if (id === null) return null;

		return this.closeWindow(id);
	}

	closeAll(): string | null {
		const owner = manager.routeWindow(this.#currentPath);
		const ownsPath = owner !== null && this.isOpen(owner.id);

		this.#wm = { open: [], mounted: this.#wm.mounted };
		this.#clearAlert();

		return ownsPath ? this.#fallbackPath() : null;
	}

	frontWindow(id: WindowId): void {
		this.#wm = manager.frontWindow(this.#wm, id);
	}

	toggleZoom(id?: WindowId): void {
		const target = id ?? this.front;
		if (target === null || target === 'alert' || !this.isOpen(target)) return;

		if (this.#zoomed.has(target)) this.#zoomed.delete(target);
		else this.#zoomed.add(target);

		this.frontWindow(target);
	}

	toggleShade(id: WindowId): void {
		if (!this.isOpen(id)) return;

		if (this.#shaded.has(id)) this.#shaded.delete(id);
		else this.#shaded.add(id);
	}

	/**
	 * Stores px overrides. Moving or resizing a zoomed window ends the zoom, so callers that start
	 * a drag on a zoomed window should pass its full measured rectangle.
	 */
	setGeometry(id: WindowId, g: Geometry): void {
		const next: Geometry = { ...this.geometry(id) };

		if (g.left !== undefined) next.left = g.left;
		if (g.top !== undefined) next.top = g.top;
		if (g.width !== undefined) next.width = g.width;
		if (g.height !== undefined) next.height = g.height;

		this.#zoomed.delete(id);
		this.#geometry.set(id, next);
	}

	cleanUpWindows(): void {
		this.#zoomed.clear();
		this.#shaded.clear();

		const cascade = this.#wm.open.filter((id) => id !== 'alert');

		cascade.forEach((id, index) => {
			this.#geometry.set(id, {
				...this.geometry(id),
				left: CASCADE_LEFT + index * CASCADE_STEP,
				top: CASCADE_TOP + index * CASCADE_STEP,
			});
		});
	}

	/**
	 * Called by the layout after every navigation. Opens and fronts the window that owns the
	 * path, unless suppressNextSync() was armed for exactly this path. An article route without a
	 * loaded article (a 404, for example) opens nothing.
	 */
	syncRoute(pathname: string, hasArticle: boolean): void {
		const suppressed = this.#suppressedPath === pathname;

		this.recordPath(pathname);

		if (suppressed) return;

		const route = manager.routeWindow(pathname);
		if (route === null) return;

		if (route.id === 'post') {
			if (!hasArticle) return;

			this.articleSlug = route.slug ?? null;
		}

		this.openWindow(route.id);
	}

	/**
	 * Records where the URL is without opening a window, for routes that show an error page. Like
	 * every sync it disarms suppressNextSync().
	 */
	recordPath(pathname: string): void {
		this.#currentPath = pathname;
		this.#suppressedPath = null;
	}

	/**
	 * Arms the route sync to skip the window opening for the navigation to this path, and only for
	 * that path. Any sync disarms it, and so does releaseSync() once the navigation has settled.
	 */
	suppressNextSync(path: string): void {
		this.#suppressedPath = path;
	}

	/** Disarms the guard of a navigation that settled (finished, failed or was superseded). */
	releaseSync(path: string): void {
		if (this.#suppressedPath === path) this.#suppressedPath = null;
	}

	// ------------------------------------------------------------- menus, escape

	get openMenu(): MenuId | null {
		return this.#openMenu;
	}

	/** Bumped when a closed menu should hand focus back to its button. */
	get menuFocusTick(): number {
		return this.#menuFocusTick;
	}

	showMenu(id: MenuId): void {
		this.#openMenu = id;
	}

	closeMenu(opts: { returnFocus?: boolean } = {}): void {
		if (this.#openMenu === null) return;

		this.#openMenu = null;

		if (opts.returnFocus) this.#menuFocusTick += 1;
	}

	/**
	 * One press of Escape closes exactly one thing, in this order: the open menu, the hidden file,
	 * then the front window. Returns the path to go to when closing that window moved the URL.
	 */
	escape(): string | null {
		if (this.#openMenu !== null) {
			this.closeMenu({ returnFocus: true });

			return null;
		}

		if (this.#hiddenFileOpen) {
			this.closeHiddenFile();

			return null;
		}

		return this.closeFront();
	}

	// -------------------------------------------------------------- blog list

	setBlogOrder(order: ListOrder): void {
		this.blogOrder = order;
	}

	get blogSearchFocusTick(): number {
		return this.#blogSearchFocusTick;
	}

	focusBlogSearch(): void {
		this.#blogSearchFocusTick += 1;
	}

	get terminalFocusTick(): number {
		return this.#terminalFocusTick;
	}

	focusTerminal(): void {
		this.#terminalFocusTick += 1;
	}

	// ------------------------------------------------------------- appearance

	setTheme(theme: ThemeId): void {
		this.theme = theme;

		if (typeof document === 'undefined') return;

		document.documentElement.dataset.theme = theme;
		writeStorage(() => localStorage, THEME_STORAGE_KEY, theme);
	}

	toggleInvert(): void {
		this.inverted = !this.inverted;
	}

	toggleWallpaper(): void {
		this.wallpaper = !this.wallpaper;
	}

	/**
	 * Call once from onMount. Adopts the theme the head script already put on <html> (falling
	 * back to localStorage) and skips the boot splash when this tab has already seen it.
	 */
	initClient(): void {
		const applied = document.documentElement.dataset.theme;
		const stored = readStorage(() => localStorage, THEME_STORAGE_KEY);

		if (isThemeId(applied)) {
			this.theme = applied;
		} else {
			this.theme = isThemeId(stored) ? stored : DEFAULT_THEME;
			document.documentElement.dataset.theme = this.theme;
		}

		this.#bootDone = readStorage(() => sessionStorage, BOOT_STORAGE_KEY) === '1';
	}

	// ----------------------------------------------------------- icons, trash

	get trashed(): IconId[] {
		return this.#trashed;
	}

	trash(id: IconId): void {
		if (id === 'trash' || this.#trashed.includes(id)) return;

		this.#trashed = [...this.#trashed, id];
	}

	putBack(): void {
		this.#trashed = [];
	}

	iconPosition(id: IconId): IconPosition | null {
		return this.#iconPositions.get(id) ?? null;
	}

	setIconPosition(id: IconId, position: IconPosition): void {
		this.#iconPositions.set(id, { left: position.left, top: position.top });
	}

	get iconsFree(): boolean {
		return this.#iconsFree;
	}

	/** Switches the icon grid to free placement, starting from the icons' measured positions. */
	freeIcons(positions: Record<IconId, IconPosition>): void {
		if (this.#iconsFree) return;

		for (const [id, position] of Object.entries(positions) as [IconId, IconPosition][]) {
			this.setIconPosition(id, position);
		}

		this.#iconsFree = true;
	}

	cleanUpIcons(): void {
		this.#iconPositions.clear();
		this.#iconsFree = false;
	}

	// ------------------------------------------------------------------ alert

	get alertState(): AlertState | null {
		return this.#alertState;
	}

	alert(title: string, message: string, opts: { label?: string; onOk?: () => void } = {}): void {
		this.#alertState = { title, message, label: opts.label ?? text('desktop.alert.ok') };
		this.#alertOk = opts.onOk ?? null;

		this.openWindow('alert');
	}

	dismissAlert(ok: boolean): void {
		const onOk = this.#alertOk;

		this.closeWindow('alert');

		if (ok) onOk?.();
	}

	// ---------------------------------------------------------- scenes, eggs

	registerScenes(host: SceneHost): () => void {
		this.#sceneHost = host;

		return () => {
			if (this.#sceneHost === host) this.#sceneHost = null;
		};
	}

	play(name: SceneName): boolean {
		this.wallpaper = true;

		return this.#sceneHost?.play(name) ?? false;
	}

	tryScene(name: SceneName): boolean {
		if (!this.wallpaper || this.#sceneHost === null) return false;

		return this.#sceneHost.play(name);
	}

	sunset(): void {
		this.wallpaper = true;
		this.#sceneHost?.sunset();
	}

	get rolling(): boolean {
		return this.#rolling;
	}

	barrelRoll(): void {
		if (this.reducedMotion) return;

		clearTimeout(this.#rollTimer);
		this.#rolling = true;
		this.#rollTimer = setTimeout(() => {
			this.#rolling = false;
		}, ROLL_DURATION_MS);
	}

	get hiddenFileOpen(): boolean {
		return this.#hiddenFileOpen;
	}

	openHiddenFile(): void {
		this.#hiddenFileOpen = true;
	}

	closeHiddenFile(): void {
		this.#hiddenFileOpen = false;
	}

	// ------------------------------------------------------------------- boot

	get bootKey(): number {
		return this.#bootKey;
	}

	get bootDone(): boolean {
		return this.#bootDone;
	}

	/**
	 * Closes every window and replays the boot splash. Once the splash has finished (markBooted)
	 * the About window opens again; the caller moves the URL back to "/" if it is somewhere else.
	 */
	restart(): void {
		this.closeAll();
		this.closeHiddenFile();

		this.#bootDone = false;
		this.#bootKey += 1;
		this.#reopenAboutAfterBoot = true;
	}

	markBooted(): void {
		this.#bootDone = true;
		writeStorage(() => sessionStorage, BOOT_STORAGE_KEY, '1');

		if (!this.#reopenAboutAfterBoot) return;

		this.#reopenAboutAfterBoot = false;
		this.openWindow('about');
	}

	async copyLink(): Promise<boolean> {
		try {
			await navigator.clipboard.writeText(location.href);

			return true;
		} catch {
			return false;
		}
	}

	// ---------------------------------------------------------------- private

	#routedPath(id: WindowId): string | null {
		return manager.windowPath(id, this.articleSlug ?? undefined);
	}

	/** Where the URL goes when the window that owned it is gone: the topmost routed window or "/". */
	#fallbackPath(): string | null {
		const next = manager.topmost(this.#wm, (id) => this.#routedPath(id) !== null);
		const path = next === null ? '/' : this.#routedPath(next);

		return path === this.#currentPath ? null : path;
	}

	#clearAlert(): void {
		this.#alertState = null;
		this.#alertOk = null;
	}

	#showTrash(): void {
		const title = text('desktop.alert.trash.title');

		if (this.#trashed.length === 0) {
			this.alert(title, text('desktop.alert.trash.empty'));

			return;
		}

		const items = this.#trashed.map((id) => text(`desktop.icon.${id}`)).join(', ');

		this.alert(title, fill(text('desktop.alert.trash.contents'), { items }), {
			label: text('desktop.alert.putBack'),
			onOk: () => this.putBack(),
		});
	}
}

const DESKTOP_CONTEXT_KEY = Symbol('desktop');

export function setDesktop(desktop: Desktop): Desktop {
	return setContext(DESKTOP_CONTEXT_KEY, desktop);
}

export function getDesktop(): Desktop {
	return getContext<Desktop>(DESKTOP_CONTEXT_KEY);
}
