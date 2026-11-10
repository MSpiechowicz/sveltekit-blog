<script lang="ts">
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';

	import { getDesktop } from '#lib/desktop/desktop.svelte.js';
	import type { IconId } from '#lib/desktop/types.js';

	import IconGlyph, { type GlyphName } from './icon-glyph.svelte';
	import { launchIcon } from './navigation.js';
	import { isPhone } from './phone.js';
	import { fill, t } from './text.js';

	type IconDefinition = { id: IconId; glyph: GlyphName; link?: '/' | '/blog' };
	type Point = { left: number; top: number };
	type DragState = {
		id: IconId;
		element: HTMLElement;
		startX: number;
		startY: number;
		offsetX: number;
		offsetY: number;
		moved: boolean;
	};

	const DRAG_THRESHOLD_PX = 5;
	const GRID_MARGIN_PX = 18;

	const ICONS: IconDefinition[] = [
		{ id: 'about', glyph: 'doc', link: '/' },
		{ id: 'blog', glyph: 'folder', link: '/blog' },
		{ id: 'projects', glyph: 'projects' },
		{ id: 'term', glyph: 'term' },
		{ id: 'links', glyph: 'link' },
		{ id: 'trash', glyph: 'trash' },
	];

	const desk = getDesktop();

	let container = $state<HTMLElement>();
	let drag: DragState | null = null;
	let dragging = $state<IconId | null>(null);
	let suppressClick = false;

	function label(id: IconId): string {
		const count = desk.trashed.length;
		if (id === 'trash' && count > 0) return fill(t('desktop.icon.trash.count'), { count });

		return t(`desktop.icon.${id}`);
	}

	function isModifiedClick(event: MouseEvent): boolean {
		return event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0;
	}

	// Links navigate natively (keeping new-tab clicks working); the window opens straight away.
	function openFromLink(event: MouseEvent, id: IconId) {
		if (isModifiedClick(event)) return;

		desk.launch(id);
	}

	function openFromButton(id: IconId) {
		launchIcon(desk, id);
	}

	// Capture phase, so a click that ends a drag never reaches the link or the button.
	function swallowClickAfterDrag(event: MouseEvent) {
		if (!suppressClick) return;

		suppressClick = false;
		event.preventDefault();
		event.stopPropagation();
	}

	function iconElements(): HTMLElement[] {
		return Array.from(container?.querySelectorAll<HTMLElement>('.icon') ?? []);
	}

	function iconId(element: HTMLElement): IconId {
		return element.dataset.opens as IconId;
	}

	function startDrag(event: PointerEvent, id: IconId) {
		suppressClick = false;
		if (isPhone() || event.button !== 0) return;

		const element = event.currentTarget as HTMLElement;
		const rect = element.getBoundingClientRect();

		drag = {
			id,
			element,
			startX: event.clientX,
			startY: event.clientY,
			offsetX: event.clientX - rect.left,
			offsetY: event.clientY - rect.top,
			moved: false,
		};
	}

	// The first drag turns the grid into free placement, starting from where every icon is now.
	function freeAllIcons(deskRect: DOMRect) {
		const positions = {} as Record<IconId, Point>;

		for (const element of iconElements()) {
			const rect = element.getBoundingClientRect();
			const hidden = rect.width === 0;

			positions[iconId(element)] = hidden
				? { left: deskRect.width - GRID_MARGIN_PX - element.offsetWidth, top: GRID_MARGIN_PX }
				: { left: rect.left - deskRect.left, top: rect.top - deskRect.top };
		}

		desk.freeIcons(positions);
	}

	function clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, value));
	}

	function moveDrag(event: PointerEvent) {
		if (!drag) return;

		const deskRect = container?.parentElement?.getBoundingClientRect();
		if (!deskRect) return;

		if (!drag.moved) {
			const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
			if (distance < DRAG_THRESHOLD_PX) return;

			drag.moved = true;
			dragging = drag.id;
			freeAllIcons(deskRect);
		}

		const { element, offsetX, offsetY, id } = drag;

		desk.setIconPosition(id, {
			left: clamp(event.clientX - offsetX - deskRect.left, 0, deskRect.width - element.offsetWidth),
			top: clamp(event.clientY - offsetY - deskRect.top, 0, deskRect.height - element.offsetHeight),
		});
	}

	function overlaps(a: DOMRect, b: DOMRect): boolean {
		return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
	}

	function dropOnTrash(finished: DragState) {
		if (finished.id === 'trash') return;

		const trash = iconElements().find((element) => iconId(element) === 'trash');
		if (!trash || trash.hidden) return;

		if (overlaps(finished.element.getBoundingClientRect(), trash.getBoundingClientRect())) {
			desk.trash(finished.id);
		}
	}

	function endDrag() {
		const finished = drag;
		drag = null;

		if (!finished?.moved) return;

		dragging = null;
		suppressClick = true;
		dropOnTrash(finished);
	}

	onDestroy(() => {
		drag = null;
	});
</script>

<svelte:window
	onpointermove={moveDrag}
	onpointerup={endDrag}
	onpointercancel={endDrag} />

<div
	class="icons"
	class:free={desk.iconsFree}
	bind:this={container}>
	{#each ICONS as icon (icon.id)}
		{@const position = desk.iconPosition(icon.id)}
		{#if icon.link}
			<a
				class="icon"
				class:active={desk.front === icon.id}
				class:drag={dragging === icon.id}
				href={resolve(icon.link)}
				data-opens={icon.id}
				draggable="false"
				hidden={desk.trashed.includes(icon.id)}
				style:left={position ? `${position.left}px` : undefined}
				style:top={position ? `${position.top}px` : undefined}
				onclickcapture={swallowClickAfterDrag}
				onclick={(event) => openFromLink(event, icon.id)}
				onpointerdown={(event) => startDrag(event, icon.id)}>
				<IconGlyph name={icon.glyph} />
				<span>{label(icon.id)}</span>
			</a>
		{:else}
			<button
				type="button"
				class="icon"
				class:active={desk.front === icon.id}
				class:drag={dragging === icon.id}
				data-opens={icon.id}
				draggable="false"
				hidden={desk.trashed.includes(icon.id)}
				style:left={position ? `${position.left}px` : undefined}
				style:top={position ? `${position.top}px` : undefined}
				onclickcapture={swallowClickAfterDrag}
				onclick={() => openFromButton(icon.id)}
				onpointerdown={(event) => startDrag(event, icon.id)}>
				<IconGlyph name={icon.glyph} />
				<span>{label(icon.id)}</span>
			</button>
		{/if}
	{/each}
</div>

<style>
	.icons {
		position: absolute;
		top: 18px;
		right: 18px;
		bottom: 18px;
		display: grid;
		grid-auto-flow: column;
		grid-template-rows: repeat(auto-fill, 78px);
		gap: 14px;
		align-content: start;
		justify-items: center;
		direction: rtl;
	}

	.icons > * {
		direction: ltr;
	}

	.icons.free {
		inset: 0;
		display: block;
		pointer-events: none;
	}

	.icon {
		--glyph-size: 52px;
		--glyph-fill: var(--icon);
		--glyph-stroke-width: 1.6;

		display: grid;
		gap: 4px;
		justify-items: center;
		width: 104px;
		padding: 0;
		border: 0;
		background: none;
		text-decoration: none;
		cursor: pointer;
		touch-action: none;
		-webkit-user-drag: none;
	}

	.free .icon {
		position: absolute;
		pointer-events: auto;
	}

	.icon.drag {
		z-index: 5;
		cursor: grabbing;
	}

	.icon span {
		padding: 1px 6px;
		font-size: 13px;
		text-align: center;
	}

	:global(:root[data-theme='ink']) .icon span {
		background: var(--w);
	}

	.icon[data-opens='blog'],
	.icon[data-opens='projects'] {
		--glyph-fill: var(--i-folder, var(--icon));
	}

	.icon[data-opens='links'] {
		--glyph-fill: var(--i-globe, var(--icon));
	}

	.icon[data-opens='trash'] {
		--glyph-fill: var(--i-trash, var(--icon));
	}

	.icon[data-opens='term'] {
		--glyph-fill: var(--i-term, var(--icon));
	}

	.icon.active,
	.icon:hover,
	.icon:focus-visible {
		--glyph-fill: var(--sel);
		--glyph-stroke: var(--selfg);
	}

	.icon.active span,
	.icon:hover span,
	.icon:focus-visible span {
		background: var(--sel);
		color: var(--selfg);
	}

	.icon:focus-visible {
		outline: 0;
	}

	@media (max-width: 720px) {
		.icons,
		.icons.free {
			position: relative;
			inset: auto;
			display: grid;
			grid-auto-flow: row;
			grid-template-columns: repeat(3, 1fr);
			grid-template-rows: none;
			gap: 26px 6px;
			padding: 26px 10px;
			direction: ltr;
			pointer-events: auto;
		}

		.free .icon {
			position: static;
		}

		.icon {
			--glyph-size: 60px;
		}
	}
</style>
