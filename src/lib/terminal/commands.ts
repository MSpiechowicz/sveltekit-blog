import type { IconId, PostSummary, SceneName, ThemeId } from '#lib/desktop/types.js';

import {
	ANSWER_TEXT,
	COFFEE_TEXT,
	cowsay,
	DEFAULT_COW_TEXT,
	HELLO_TEXT,
	HELP_TEXT,
	MATRIX_TEXT,
	OPEN_USAGE,
	PROMPT,
	RM_PLAIN_TEXT,
	RM_RECURSIVE_TEXT,
	SECRETS_TEXT,
	SUDO_TEXT,
	VIM_ENTER_TEXT,
	VIM_ESCAPE_AFTER,
	VIM_ESCAPE_BEFORE,
	VIM_ESCAPE_LINK,
	VIM_INSERT_TEXT,
} from './texts.js';

export { PROMPT };

/** A run of output text; `href` is an internal path such as /blog/<slug>. */
export type Segment = { text: string; href?: string; bold?: boolean };

export type Line = Segment[];

/** What the window does after printing the lines, in order. A `clear` empties everything printed so far. */
export type Effect =
	| { type: 'clear' }
	| { type: 'navigate'; path: string }
	| { type: 'open'; id: IconId }
	| { type: 'close' }
	| { type: 'invert' }
	| { type: 'theme'; theme: ThemeId }
	| { type: 'barrelRoll' }
	| { type: 'hiddenFile' }
	| { type: 'scene'; name: SceneName };

export type TerminalContext = {
	/** Newest first, as listed in the Blog window. */
	posts: PostSummary[];
	/** True while the visitor is "inside vim". */
	vim: boolean;
	now: Date;
	random: () => number;
	/** False when the wallpaper is switched off or motion is reduced. */
	scenesAvailable: boolean;
	name: string;
	subtitle: string;
};

export type CommandResult = { lines: Line[]; effects: Effect[]; vim: boolean };

export const GREETING: Line[] = [
	[{ text: 'MaciejOS Terminal. Type ' }, { text: 'help', bold: true }, { text: '.' }],
];

const OPENABLE: IconId[] = ['about', 'blog', 'projects', 'links'];
const SCENES: SceneName[] = ['jog', 'plane', 'balloon', 'flock', 'ufo'];
const VIM_COMMANDS = ['vim', 'nvim', 'vi'];
const VIM_QUIT = /^:(q|q!|wq|x)$/;
const RECURSIVE_FLAG = /-\w*r/;
const ALL_FLAG = /^-\w*a/;

type Parsed = { command: string; arg: string; line: string };

function parse(input: string): Parsed {
	const line = input.trim();
	const [command, ...rest] = line.split(/\s+/);

	return { command, arg: rest.join(' '), line };
}

function text(value: string): Line {
	return [{ text: value }];
}

function textLines(value: string): Line[] {
	return value.split('\n').map(text);
}

function hasPost(ctx: TerminalContext, slug: string): boolean {
	return ctx.posts.some((post) => post.slug === slug);
}

function postPath(slug: string): string {
	return `/blog/${slug}`;
}

/** A link to a post when it exists, otherwise the same words as plain text. */
function postSegment(ctx: TerminalContext, slug: string, label: string): Segment {
	return hasPost(ctx, slug) ? { text: label, href: postPath(slug) } : { text: label };
}

function isoDate(date: string): string {
	const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date);

	return match ? `${match[3]}-${match[1]}-${match[2]}` : date;
}

function reply(lines: Line[], effects: Effect[] = [], vim = false): CommandResult {
	return { lines, effects, vim };
}

function findPost(posts: PostSummary[], arg: string): PostSummary | undefined {
	if (/^\d+$/.test(arg) && posts[Number(arg) - 1]) return posts[Number(arg) - 1];

	const name = arg.replace(/\.md$/, '');

	if (!name) return undefined;

	return posts.find((post) => post.slug === name) ?? posts.find((post) => post.slug.includes(name));
}

// ------------------------------------------------------------------- hidden commands

function stayInVim(): CommandResult {
	return reply([text(VIM_INSERT_TEXT)], [], true);
}

function leaveVim(ctx: TerminalContext): CommandResult {
	const line: Line = [
		{ text: VIM_ESCAPE_BEFORE },
		postSegment(ctx, 'lazyvim-config', VIM_ESCAPE_LINK),
		{ text: VIM_ESCAPE_AFTER },
	];

	return reply([line]);
}

function fortune(ctx: TerminalContext): CommandResult {
	if (ctx.posts.length === 0) return reply([]);

	const index = Math.min(Math.floor(ctx.random() * ctx.posts.length), ctx.posts.length - 1);
	const post = ctx.posts[index];

	return reply([
		text(`“${post.description}”`),
		[{ text: '   — ' }, { text: post.title, href: postPath(post.slug) }],
	]);
}

function scene(ctx: TerminalContext, name: SceneName): CommandResult {
	if (!ctx.scenesAvailable) return reply([text(`${name}: the wallpaper is switched off.`)]);

	return reply([text(`${name}: look at the wallpaper.`)], [{ type: 'scene', name }]);
}

function listAll(ctx: TerminalContext): CommandResult {
	return reply([text('.secrets'), ...ctx.posts.map((post) => text(`${post.slug}.md`))]);
}

/** Hidden commands; undefined when the input is not one of them. */
function hidden({ command, arg, line }: Parsed, ctx: TerminalContext): CommandResult | undefined {
	if (VIM_COMMANDS.includes(command)) return reply([text(VIM_ENTER_TEXT)], [], true);
	if (command === 'sudo') return reply([text(SUDO_TEXT)]);
	if (command === 'rm') {
		return reply([text(RECURSIVE_FLAG.test(arg) ? RM_RECURSIVE_TEXT : RM_PLAIN_TEXT)]);
	}
	if (command === 'coffee' || line === 'make coffee') return reply([text(COFFEE_TEXT)]);
	if (command === 'hello') return reply([[postSegment(ctx, 'hello-world', HELLO_TEXT)]]);
	if (command === '42') return reply([text(ANSWER_TEXT)]);
	if (command === 'exit' || command === 'logout') return reply([], [{ type: 'close' }]);
	if (command === 'fortune') return fortune(ctx);
	if (command === 'cowsay') return reply(textLines(cowsay(arg || DEFAULT_COW_TEXT)));
	if (command === 'matrix') {
		return reply([text(MATRIX_TEXT)], [{ type: 'theme', theme: 'phosphor' }]);
	}
	if (line === 'do a barrel roll' || command === 'roll') {
		return reply([], [{ type: 'barrelRoll' }]);
	}
	if (command === 'pi' || command === 'π') return reply([], [{ type: 'hiddenFile' }]);
	if (SCENES.includes(command as SceneName)) return scene(ctx, command as SceneName);
	if (command === 'ls' && ALL_FLAG.test(arg)) return listAll(ctx);
	if (line === 'cat .secrets') return reply(textLines(SECRETS_TEXT));

	return undefined;
}

// ------------------------------------------------------------------ listed commands

function list(ctx: TerminalContext): CommandResult {
	return reply(
		ctx.posts.map((post, index) => [
			{ text: `${String(index + 1).padStart(2)}  ${isoDate(post.date)}  ` },
			{ text: `${post.slug}.md`, href: postPath(post.slug) },
		]),
	);
}

function cat(arg: string, ctx: TerminalContext): CommandResult {
	const post = findPost(ctx.posts, arg);

	if (!post) return reply([text(`cat: ${arg || '?'}: no such post`)]);

	return reply([], [{ type: 'navigate', path: postPath(post.slug) }]);
}

function open(arg: string): CommandResult {
	const id = OPENABLE.find((candidate) => candidate === arg);

	if (!id) return reply([text(OPEN_USAGE)]);

	return reply([], [{ type: 'open', id }]);
}

function listed({ command, arg }: Parsed, ctx: TerminalContext): CommandResult {
	if (command === 'clear') return reply([], [{ type: 'clear' }]);
	if (command === 'help') return reply(textLines(HELP_TEXT));
	if (command === 'ls') return list(ctx);
	if (command === 'cat') return cat(arg, ctx);
	if (command === 'open') return open(arg);
	if (command === 'whoami') return reply([text(`${ctx.name} — ${ctx.subtitle}`)]);
	if (command === 'date') return reply([text(ctx.now.toString())]);
	if (command === 'invert') return reply([], [{ type: 'invert' }]);

	return reply([text(`command not found: ${command} (try help)`)]);
}

/**
 * Runs one typed line. The returned lines start with the echoed prompt and input; the window
 * prints them, then applies the effects in order.
 */
export function runCommand(input: string, ctx: TerminalContext): CommandResult {
	const echo = text(`${PROMPT} ${input}`);
	const parsed = parse(input);
	const result = run(parsed, ctx);

	return { ...result, lines: [echo, ...result.lines] };
}

function run(parsed: Parsed, ctx: TerminalContext): CommandResult {
	if (!parsed.command) return reply([], [], ctx.vim);

	if (ctx.vim) {
		return VIM_QUIT.test(parsed.line) ? leaveVim(ctx) : stayInVim();
	}

	return hidden(parsed, ctx) ?? listed(parsed, ctx);
}
