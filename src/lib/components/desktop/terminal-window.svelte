<script lang="ts">
	import { resolve } from '$app/paths';

	import { getDesktop } from '#lib/desktop/desktop.svelte.js';
	import {
		GREETING,
		PROMPT,
		runCommand,
		type Effect,
		type Line,
		type TerminalContext,
	} from '#lib/terminal/commands.js';

	import AppWindow from './app-window.svelte';
	import { goToPath, launchIcon, moveUrl } from './navigation.js';
	import { isPhone } from './phone.js';
	import { t } from './text.js';

	type Row = { id: number; line: Line };

	const POST_PATH = /^\/blog\/([^/]+)$/;

	const desk = getDesktop();

	let rows = $state<Row[]>([]);
	let nextId = 0;
	let vim = false;
	let command = $state('');
	let screen = $state<HTMLElement>();
	let input = $state<HTMLInputElement>();
	let focusedTick = 0;

	function addRows(lines: Line[]) {
		rows.push(...lines.map((line) => ({ id: nextId++, line })));
	}

	addRows(GREETING);

	/** Links in the output are always /blog/<slug>; the slug feeds resolve() in the markup. */
	function slugOf(path: string): string {
		return POST_PATH.exec(path)?.[1] ?? '';
	}

	// ------------------------------------------------------------------- running

	function context(): TerminalContext {
		return {
			posts: desk.posts,
			vim,
			now: new Date(),
			random: Math.random,
			scenesAvailable: desk.wallpaper && !desk.reducedMotion,
			name: t('desktop.name'),
			subtitle: t('subTitle'),
		};
	}

	function applyEffect(effect: Effect) {
		if (effect.type === 'clear') {
			rows = [];
		} else if (effect.type === 'navigate') {
			goToPath(effect.path);
		} else if (effect.type === 'open') {
			launchIcon(desk, effect.id);
		} else if (effect.type === 'close') {
			moveUrl(desk, desk.closeWindow('term'));
		} else if (effect.type === 'invert') {
			desk.toggleInvert();
		} else if (effect.type === 'theme') {
			desk.setTheme(effect.theme);
		} else if (effect.type === 'barrelRoll') {
			desk.barrelRoll();
		} else if (effect.type === 'hiddenFile') {
			desk.openHiddenFile();
		} else {
			desk.tryScene(effect.name);
		}
	}

	function scrollToEnd() {
		if (screen) screen.scrollTop = screen.scrollHeight;
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();

		const result = runCommand(command, context());

		command = '';
		vim = result.vim;
		addRows(result.lines);
		result.effects.forEach(applyEffect);
	}

	// ------------------------------------------------------------------ keyboard

	function hasSelection(field: HTMLInputElement): boolean {
		return field.selectionStart !== field.selectionEnd || Boolean(getSelection()?.toString());
	}

	function onKeydown(event: KeyboardEvent) {
		if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;

		const key = event.key.toLowerCase();

		if (key === 'c' && !hasSelection(event.currentTarget as HTMLInputElement)) {
			event.preventDefault();
			command = '';
		}

		if (key === 'l') {
			event.preventDefault();
			rows = [];
		}
	}

	function onScreenClick(event: MouseEvent) {
		if ((event.target as Element).closest('a') || getSelection()?.toString()) return;

		input?.focus();
	}

	// Focus when the Terminal is opened, but never on phones, where it would raise the keyboard.
	$effect(() => {
		const tick = desk.terminalFocusTick;

		if (tick === focusedTick) return;

		focusedTick = tick;

		if (!isPhone()) input?.focus();
	});

	// Keeps the newest output in view once the DOM has the added lines.
	$effect(() => {
		void rows.length;
		scrollToEnd();
	});
</script>

<AppWindow
	id="term"
	title={t('desktop.window.term')}
	x="30vw"
	y="210px"
	w="600px"
	h="340px"
	scroll={false}>
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="term"
		onclick={onScreenClick}>
		<div
			class="out"
			bind:this={screen}>
			{#each rows as row (row.id)}
				<div class="ln">
					{#each row.line as segment, index (index)}
						{#if segment.href !== undefined}
							<a href={resolve('/blog/[slug]', { slug: slugOf(segment.href) })}>{segment.text}</a>
						{:else if segment.bold}
							<b>{segment.text}</b>
						{:else}
							<span>{segment.text}</span>
						{/if}
					{/each}
				</div>
			{/each}
		</div>

		<form
			class="prompt"
			onsubmit={submit}>
			<span>{PROMPT}</span>
			<input
				bind:this={input}
				bind:value={command}
				onkeydown={onKeydown}
				aria-label={t('desktop.aria.command')}
				autocomplete="off"
				spellcheck="false" />
		</form>
	</div>
</AppWindow>

<style>
	/* The grip would be drawn over the black screen; resizing still works through the invisible grip. */
	:global([data-window='term'] .grip) {
		background: none;
	}

	.term {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
		margin: 6px;
		padding: 10px 12px;
		background: var(--termbg);
		color: var(--termfg);
		font: 500 14px/1.5 var(--mono);
		cursor: text;
		-webkit-user-select: text;
		user-select: text;
	}

	.out {
		flex: 1;
		overflow: auto;
		overflow-wrap: anywhere;
		white-space: pre-wrap;
		scrollbar-width: none;
	}

	.out::-webkit-scrollbar {
		display: none;
	}

	.ln {
		min-height: 1.5em;
	}

	a,
	b {
		font-weight: 700;
	}

	.prompt {
		display: flex;
		flex: none;
		gap: 1ch;
	}

	input {
		flex: 1;
		min-width: 0;
		padding: 0;
		border: 0;
		outline: 0;
		background: none;
		color: inherit;
		caret-color: var(--termfg);
		font: inherit;
	}

	@media (max-width: 720px) {
		/* 16px keeps iOS from zooming the page when the input is focused. */
		.term {
			font-size: 16px;
		}
	}
</style>
