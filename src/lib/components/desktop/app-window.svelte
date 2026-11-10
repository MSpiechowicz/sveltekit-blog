<script lang="ts">
	import { untrack, type Snippet } from 'svelte';

	import { getDesktop } from '#lib/desktop/desktop.svelte.js';
	import type { WindowId } from '#lib/desktop/types.js';

	import { moveUrl } from './navigation.js';
	import { isPhone } from './phone.js';
	import { t } from './text.js';
	import WindowScrollbar from './window-scrollbar.svelte';
	import { getZoomHost } from './zoom-host.js';

	type Gesture = {
		kind: 'move' | 'resize';
		startX: number;
		startY: number;
		rect: { left: number; top: number; width: number; height: number };
		wasZoomed: boolean;
	};

	type Props = {
		id: WindowId;
		title: string;
		/** Default left edge as a CSS length (vw, px, calc). Dragging stores px overrides instead. */
		x: string;
		/** Default top edge as a CSS length. */
		y: string;
		/** Default width as a CSS length. */
		w: string;
		/** Default height as a CSS length; omit to size the window to its content. */
		h?: string;
		/** A small modal-style window: no zoom box, no resize grip, no scrollbar. */
		dialog?: boolean;
		role?: 'alertdialog';
		/** Toolbar rendered between the title bar and the body (put a div.bar here). */
		bar?: Snippet;
		/** Status strip below the body. */
		status?: Snippet;
		/** Scrolling body with the classic scrollbar; false gives the content a plain flex body. */
		scroll?: boolean;
		/** Extra class on the body element (div.wc when scrolling), for example "flush". */
		bodyClass?: string;
		/** The scrolling element, for lists that load more rows near the end. */
		scroller?: HTMLElement;
		children: Snippet;
	};

	const MIN_LEFT_PX = -200;
	const MIN_WIDTH_PX = 260;
	const MIN_HEIGHT_PX = 140;

	let {
		id,
		title,
		x,
		y,
		w,
		h,
		dialog = false,
		role,
		bar,
		status,
		scroll = true,
		bodyClass,
		scroller = $bindable(),
		children,
	}: Props = $props();

	const desk = getDesktop();
	const zoomHost = getZoomHost();

	const open = $derived(desk.isOpen(id));
	const front = $derived(desk.front === id);
	const shaded = $derived(desk.isShaded(id));
	const zoomed = $derived(desk.isZoomed(id));
	const geometry = $derived(desk.geometry(id));
	const resized = $derived(zoomed || geometry.height !== undefined);

	let element = $state<HTMLElement>();
	let animating = $state(false);
	let popping = $state(false);
	let gesture: Gesture | null = null;
	let wasOpen = false;

	function px(value: number | undefined): string | undefined {
		return value === undefined ? undefined : `${value}px`;
	}

	// ----------------------------------------------------------------- opening

	async function playOpen() {
		if (!element || !zoomHost) return;

		if (isPhone()) {
			popping = true;

			return;
		}

		if (desk.reducedMotion) return;

		const from = zoomHost.sourceRect(id);
		const to = element.getBoundingClientRect();

		animating = true;
		await zoomHost.animate(from, to);
		animating = false;
	}

	// Plays when the window opens after the page has loaded; windows that came with the server
	// HTML (zoomHost.ready is still false while they hydrate) simply appear.
	$effect(() => {
		const nowOpen = open;

		if (nowOpen && !wasOpen && zoomHost?.ready) untrack(playOpen);

		wasOpen = nowOpen;
	});

	function endPop(event: AnimationEvent) {
		if (event.target === element) popping = false;
	}

	// ------------------------------------------------------- buttons, roll-up

	function close() {
		moveUrl(desk, desk.closeWindow(id));
	}

	function zoom() {
		desk.toggleZoom(id);
	}

	function toggleShade(event: MouseEvent) {
		if (isPhone() || (event.target as Element).closest('button')) return;

		desk.toggleShade(id);
	}

	// ------------------------------------------------------------ drag, resize

	function beginGesture(event: PointerEvent, kind: Gesture['kind']) {
		if (isPhone() || event.button !== 0 || !element) return;
		if ((event.target as Element).closest('button')) return;

		gesture = {
			kind,
			startX: event.clientX,
			startY: event.clientY,
			rect: {
				left: element.offsetLeft,
				top: element.offsetTop,
				width: element.offsetWidth,
				height: element.offsetHeight,
			},
			wasZoomed: zoomed,
		};

		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function moveGesture(event: PointerEvent) {
		if (!gesture) return;

		const dx = event.clientX - gesture.startX;
		const dy = event.clientY - gesture.startY;
		const { rect } = gesture;

		// Moving or resizing ends a zoom, so a zoomed window hands over its full rectangle.
		const base = gesture.wasZoomed ? rect : {};

		if (gesture.kind === 'move') {
			desk.setGeometry(id, {
				...base,
				left: Math.max(MIN_LEFT_PX, rect.left + dx),
				top: Math.max(0, rect.top + dy),
			});

			return;
		}

		desk.setGeometry(id, {
			...base,
			width: Math.max(MIN_WIDTH_PX, rect.width + dx),
			height: Math.max(MIN_HEIGHT_PX, rect.height + dy),
		});
	}

	function endGesture() {
		gesture = null;
	}
</script>

<section
	class="win"
	class:dlg={dialog}
	class:front
	class:shade={shaded}
	class:pop={popping}
	{role}
	aria-label={title}
	data-window={id}
	hidden={!open}
	bind:this={element}
	style:--x={x}
	style:--y={y}
	style:--w0={w}
	style:--h0={h}
	style:z-index={desk.zIndex(id)}
	style:left={zoomed ? '4px' : px(geometry.left)}
	style:top={zoomed ? '4px' : px(geometry.top)}
	style:width={zoomed ? 'calc(100% - 12px)' : px(geometry.width)}
	style:height={zoomed ? 'calc(100% - 12px)' : px(geometry.height)}
	style:max-height={resized ? 'none' : undefined}
	style:opacity={animating ? 0 : undefined}
	style:pointer-events={animating ? 'none' : undefined}
	onpointerdown={() => desk.frontWindow(id)}
	onanimationend={endPop}>
	<div
		class="tb"
		role="presentation"
		ondblclick={toggleShade}
		onpointerdown={(event) => beginGesture(event, 'move')}
		onpointermove={moveGesture}
		onpointerup={endGesture}
		onpointercancel={endGesture}>
		<button
			type="button"
			class="close x"
			aria-label={t('desktop.aria.close')}
			title={t('desktop.aria.close')}
			onclick={close}></button>
		<i></i>
		<span>{title}</span>
		<i></i>
		{#if dialog}
			<b class="sp"></b>
		{:else}
			<button
				type="button"
				class="zoomb"
				aria-label={t('desktop.aria.zoom')}
				title={t('desktop.aria.zoom')}
				onclick={zoom}></button>
		{/if}
	</div>

	{@render bar?.()}

	{#if scroll}
		<div class="pane">
			<div
				class={['wc', bodyClass]}
				bind:this={scroller}>
				{@render children()}
			</div>
			{#if !dialog}
				<WindowScrollbar target={scroller} />
			{/if}
		</div>
	{:else}
		<div class={['body', bodyClass]}>
			{@render children()}
		</div>
	{/if}

	{#if status}
		<div class="status">
			{@render status()}
		</div>
	{/if}

	{#if !dialog}
		<i
			class="grip"
			role="presentation"
			onpointerdown={(event) => beginGesture(event, 'resize')}
			onpointermove={moveGesture}
			onpointerup={endGesture}
			onpointercancel={endGesture}></i>
	{/if}
</section>
