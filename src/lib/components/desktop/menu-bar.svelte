<script lang="ts">
	import { onMount, tick } from 'svelte';

	import { getDesktop } from '#lib/desktop/desktop.svelte.js';
	import { THEMES } from '#lib/desktop/themes.js';
	import type { IconId, ListOrder, MenuId, SceneName } from '#lib/desktop/types.js';

	import { goToPath, launchIcon, moveUrl } from './navigation.js';
	import { fill, t } from './text.js';

	type MenuItem = { label: string; run: () => void; checked?: boolean };
	/** A menu item, or null for a separator line. */
	type MenuEntry = MenuItem | null;

	const CLOCK_INTERVAL_MS = 10_000;
	const MENU_EDGE_PX = 4;

	const MENU_BUTTONS: { id: MenuId; label: string; ghost?: boolean }[] = [
		{ id: 'ms', label: t('desktop.menu.ms') },
		{ id: 'file', label: t('desktop.menu.file') },
		{ id: 'edit', label: t('desktop.menu.edit') },
		{ id: 'view', label: t('desktop.menu.view') },
		{ id: 'special', label: t('desktop.menu.special') },
		{ id: 'scenes', label: t('desktop.menu.scenes'), ghost: true },
	];

	const SCENES: { name: SceneName; label: string }[] = [
		{ name: 'jog', label: t('desktop.menu.scenes.jog') },
		{ name: 'plane', label: t('desktop.menu.scenes.plane') },
		{ name: 'balloon', label: t('desktop.menu.scenes.balloon') },
		{ name: 'flock', label: t('desktop.menu.scenes.flock') },
		{ name: 'ufo', label: t('desktop.menu.scenes.ufo') },
	];

	const desk = getDesktop();

	let anchorLeft = $state(0);
	let menuWidth = $state(0);
	let viewportWidth = $state(0);
	let time = $state('');

	let bar = $state<HTMLElement>();
	let menu = $state<HTMLElement>();
	let buttons = $state<Partial<Record<MenuId, HTMLElement>>>({});

	// Escape hands focus back to the button of the menu it closed.
	let handledFocusTick = desk.menuFocusTick;
	let lastMenu: MenuId | null = null;

	const openMenu = $derived(desk.openMenu);
	const entries = $derived(openMenu ? buildMenu(openMenu) : []);
	const menuLeft = $derived(
		Math.max(0, Math.min(anchorLeft, viewportWidth - menuWidth - MENU_EDGE_PX)),
	);

	// ------------------------------------------------------------ menu content

	function item(label: string, run: () => void, checked?: boolean): MenuItem {
		return { label, run, checked };
	}

	function openIcon(id: IconId, labelKey: string): MenuItem {
		return item(t(labelKey), () => launchIcon(desk, id));
	}

	function buildMenu(id: MenuId): MenuEntry[] {
		switch (id) {
			case 'ms':
				return [item(t('desktop.menu.ms.about'), showAbout)];
			case 'file':
				return fileMenu();
			case 'edit':
				return editMenu();
			case 'view':
				return viewMenu();
			case 'special':
				return specialMenu();
			case 'scenes':
				return scenesMenu();
		}
	}

	function fileMenu(): MenuEntry[] {
		return [
			openIcon('about', 'desktop.menu.file.openAbout'),
			openIcon('blog', 'desktop.menu.file.openBlog'),
			openIcon('projects', 'desktop.menu.file.openProjects'),
			openIcon('term', 'desktop.menu.file.openTerminal'),
			openIcon('links', 'desktop.menu.file.openLinks'),
			null,
			item(t('desktop.menu.file.closeWindow'), () => moveUrl(desk, desk.closeFront())),
			item(t('desktop.menu.file.closeAll'), () => moveUrl(desk, desk.closeAll())),
		];
	}

	function editMenu(): MenuEntry[] {
		return [
			item(t('desktop.menu.edit.findPosts'), findPosts),
			item(t('desktop.menu.edit.copyLink'), copyLink),
		];
	}

	function viewMenu(): MenuEntry[] {
		return [
			sortItem('desktop.menu.view.byDateNewest', 'DESC'),
			sortItem('desktop.menu.view.byDateOldest', 'ASC'),
			sortItem('desktop.menu.view.byName', 'NAME'),
			null,
			item(t('desktop.menu.view.showWallpaper'), () => desk.toggleWallpaper(), desk.wallpaper),
			item(t('desktop.menu.view.cleanUpIcons'), () => desk.cleanUpIcons()),
			item(t('desktop.menu.view.zoomWindow'), () => desk.toggleZoom()),
			item(t('desktop.menu.view.cleanUpWindows'), () => desk.cleanUpWindows()),
		];
	}

	function specialMenu(): MenuEntry[] {
		const themes = THEMES.map((theme) =>
			item(
				`${theme.label}${t('desktop.menu.special.themeSuffix')}`,
				() => desk.setTheme(theme.id),
				desk.theme === theme.id,
			),
		);

		return [
			...themes,
			null,
			item(t('desktop.menu.special.invert'), () => desk.toggleInvert(), desk.inverted),
			item(t('desktop.menu.special.emptyTrash'), () => launchIcon(desk, 'trash')),
			item(t('desktop.menu.special.restart'), restart),
		];
	}

	function scenesMenu(): MenuEntry[] {
		return [
			...SCENES.map((scene) => item(scene.label, () => desk.play(scene.name))),
			null,
			item(t('desktop.menu.scenes.sunset'), () => desk.sunset()),
			item(t('desktop.menu.scenes.barrelRoll'), () => desk.barrelRoll()),
			item(t('desktop.menu.scenes.hiddenFile'), () => desk.openHiddenFile()),
		];
	}

	// ----------------------------------------------------------------- actions

	function showAbout() {
		const message = fill(t('desktop.alert.about.message'), {
			name: t('desktop.name'),
			count: desk.posts.length,
		});
		const copyright = fill(t('desktop.alert.about.copyright'), { year: new Date().getFullYear() });

		desk.alert(t('desktop.alert.about.title'), `${message}\n${copyright}`);
	}

	function sortItem(labelKey: string, order: ListOrder): MenuItem {
		const choose = () => {
			desk.setBlogOrder(order);
			launchIcon(desk, 'blog');
		};

		return item(t(labelKey), choose, desk.blogOrder === order);
	}

	async function findPosts() {
		goToPath(desk.launch('blog'));

		// Wait for the Blog window to exist so it sees the focus request.
		await tick();
		desk.focusBlogSearch();
	}

	async function copyLink() {
		const copied = await desk.copyLink();
		const message = copied ? 'desktop.alert.clipboard.copied' : 'desktop.alert.clipboard.failed';

		desk.alert(t('desktop.alert.clipboard.title'), t(message));
	}

	function restart() {
		desk.restart();

		// The splash plays first; About reopens when it ends, so the URL moves without opening it.
		if (desk.currentPath !== '/') moveUrl(desk, '/');
	}

	// -------------------------------------------------------------- open, close

	function showMenu(id: MenuId, button: HTMLElement) {
		lastMenu = id;
		desk.showMenu(id);
		anchorLeft = button.getBoundingClientRect().left;
	}

	async function toggleMenu(event: MouseEvent, id: MenuId) {
		const button = event.currentTarget as HTMLElement;

		if (openMenu === id) {
			desk.closeMenu();

			return;
		}

		showMenu(id, button);

		// Keyboard activation (no pointer) moves focus into the menu.
		if (event.detail === 0) {
			await tick();
			menu?.querySelector<HTMLElement>('button')?.focus();
		}
	}

	function switchMenu(id: MenuId, event: PointerEvent) {
		if (openMenu === null || openMenu === id) return;

		showMenu(id, event.currentTarget as HTMLElement);
	}

	// Focus goes back to the menu button before the item runs, so an action that moves focus on
	// purpose (the search field, the terminal, an alert) still wins.
	function choose(entry: MenuItem) {
		const button = lastMenu ? buttons[lastMenu] : undefined;

		desk.closeMenu();
		button?.focus();
		entry.run();
	}

	function closeOnOutsidePress(event: PointerEvent) {
		if (openMenu === null) return;

		const target = event.target as Node;
		if (bar?.contains(target) || menu?.contains(target)) return;

		desk.closeMenu();
	}

	$effect(() => {
		const tickNow = desk.menuFocusTick;

		if (tickNow === handledFocusTick) return;

		handledFocusTick = tickNow;
		if (lastMenu) buttons[lastMenu]?.focus();
	});

	function moveInMenu(event: KeyboardEvent) {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

		const buttons = Array.from(menu?.querySelectorAll<HTMLElement>('button') ?? []);
		const current = buttons.indexOf(document.activeElement as HTMLElement);
		const step = event.key === 'ArrowDown' ? 1 : -1;
		const next = (current + step + buttons.length) % buttons.length;

		event.preventDefault();
		buttons[next]?.focus();
	}

	// ------------------------------------------------------------------- clock

	function updateClock() {
		time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
	}

	onMount(() => {
		updateClock();

		const timer = setInterval(updateClock, CLOCK_INTERVAL_MS);

		return () => clearInterval(timer);
	});
</script>

<svelte:window
	bind:innerWidth={viewportWidth}
	onpointerdown={closeOnOutsidePress} />

<div
	class="menubar"
	bind:this={bar}>
	{#each MENU_BUTTONS as button (button.id)}
		<button
			type="button"
			bind:this={buttons[button.id]}
			class:ghost={button.ghost}
			class:open={openMenu === button.id}
			class:brand={button.id === 'ms'}
			aria-haspopup="menu"
			aria-expanded={openMenu === button.id}
			aria-label={button.ghost ? t('desktop.aria.scenes') : undefined}
			onclick={(event) => toggleMenu(event, button.id)}
			onpointerover={(event) => switchMenu(button.id, event)}>
			{button.label}
		</button>
	{/each}
	<span class="clock">{time}</span>
</div>

{#if openMenu}
	<div
		class="menu"
		role="menu"
		tabindex="-1"
		bind:this={menu}
		bind:offsetWidth={menuWidth}
		style:left="{menuLeft}px"
		onkeydown={moveInMenu}>
		{#each entries as entry, index (entry ? entry.label : `separator-${index}`)}
			{#if entry}
				<button
					type="button"
					class:ck={entry.checked}
					role={entry.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
					aria-checked={entry.checked}
					onclick={() => choose(entry)}>
					{entry.label}
				</button>
			{:else}
				<hr />
			{/if}
		{/each}
	</div>
{/if}

<style>
	.menubar {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 900;
		display: flex;
		align-items: stretch;
		height: 30px;
		padding: 0 8px;
		border-bottom: 2px solid var(--k);
		background: var(--w);
	}

	.menubar button {
		display: flex;
		align-items: center;
		padding: 0 12px;
		border: 0;
		background: none;
		cursor: pointer;
	}

	.menubar .brand {
		font-weight: 900;
		letter-spacing: 0.04em;
	}

	.menubar button.open {
		background: var(--sel);
		color: var(--selfg);
	}

	/* The hidden menu stays invisible until the pointer is on the menu bar. */
	.ghost {
		opacity: 0;
		transition: opacity 0.25s;
	}

	.menubar:hover .ghost {
		opacity: 0.4;
	}

	.menubar .ghost:hover,
	.menubar .ghost:focus-visible,
	.menubar .ghost.open {
		opacity: 1;
	}

	@media (hover: none) {
		.ghost {
			opacity: 0.4;
		}
	}

	.clock {
		display: flex;
		align-items: center;
		margin-left: auto;
		padding: 0 8px;
		font-variant-numeric: tabular-nums;
	}

	.menu {
		position: fixed;
		top: 28px;
		z-index: 901;
		min-width: 230px;
		padding: 4px 0;
		border: 2px solid var(--k);
		background: var(--w);
		box-shadow: 3px 3px 0 var(--k);
	}

	.menu button {
		position: relative;
		display: block;
		width: 100%;
		padding: 5px 18px 5px 30px;
		border: 0;
		background: none;
		text-align: left;
		white-space: nowrap;
		cursor: pointer;
	}

	.menu button.ck::before {
		content: '✓';
		position: absolute;
		left: 11px;
	}

	.menu button:hover,
	.menu button:focus-visible {
		background: var(--sel);
		color: var(--selfg);
		outline: 0;
	}

	.menu hr {
		margin: 4px 0;
		border: 0;
		border-top: 2px dotted var(--k);
	}

	@media (max-width: 720px) {
		.menubar {
			padding: 0 2px;
		}

		.menubar button {
			padding: 0 9px;
		}
	}
</style>
