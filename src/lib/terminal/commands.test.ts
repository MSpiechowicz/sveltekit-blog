import { describe, expect, it } from 'vitest';

import type { PostSummary } from '#lib/desktop/types.js';

import {
	GREETING,
	PROMPT,
	runCommand,
	type CommandResult,
	type Effect,
	type Line,
	type TerminalContext,
} from './commands.js';

const POSTS: PostSummary[] = [
	{
		slug: 'newest-post',
		title: 'Newest Post',
		description: 'The latest news.',
		date: '09-22-2026',
	},
	{ slug: 'hello-world', title: 'Hello World!', description: 'A first post.', date: '03-05-2024' },
	{ slug: 'lazyvim-config', title: 'LazyVim', description: 'Editor setup.', date: '01-31-2024' },
];

function context(overrides: Partial<TerminalContext> = {}): TerminalContext {
	return {
		posts: POSTS,
		vim: false,
		now: new Date(2026, 10, 10, 12, 0, 0),
		random: () => 0,
		scenesAvailable: true,
		name: 'Maciej Spiechowicz',
		subtitle: 'Software Engineer',
		...overrides,
	};
}

function plain(lines: Line[]): string[] {
	return lines.map((line) => line.map((segment) => segment.text).join(''));
}

function output(result: CommandResult): string[] {
	return plain(result.lines).slice(1);
}

function run(input: string, overrides: Partial<TerminalContext> = {}): CommandResult {
	return runCommand(input, context(overrides));
}

function hrefs(result: CommandResult): string[] {
	return result.lines.flat().flatMap((segment) => (segment.href ? [segment.href] : []));
}

describe('greeting and echo', () => {
	it('greets with a bold help hint', () => {
		expect(plain(GREETING)).toEqual(['MaciejOS Terminal. Type help.']);
		expect(GREETING[0].find((segment) => segment.bold)?.text).toBe('help');
	});

	it('echoes the prompt and the typed input as the first line', () => {
		expect(PROMPT).toBe('maciej$');
		expect(plain(run('whoami').lines)[0]).toBe('maciej$ whoami');
	});

	it('prints only the echo for empty input', () => {
		const result = run('   ');

		expect(plain(result.lines)).toEqual(['maciej$    ']);
		expect(result.effects).toEqual([]);
	});

	it('reports unknown commands', () => {
		expect(output(run('frobnicate now'))).toEqual(['command not found: frobnicate (try help)']);
	});
});

describe('listed commands', () => {
	it('prints help with both shortcuts and the hint about ls -la', () => {
		const text = output(run('help')).join('\n');

		expect(text).toContain('Ctrl/Cmd+C');
		expect(text).toContain('Ctrl/Cmd+L');
		expect(text).toContain('Try: ls -la');
	});

	it('clears through an effect', () => {
		expect(run('clear').effects).toEqual([{ type: 'clear' }]);
	});

	it('lists posts numbered with ISO dates and links', () => {
		const result = run('ls');

		expect(output(result)).toEqual([
			' 1  2026-09-22  newest-post.md',
			' 2  2024-03-05  hello-world.md',
			' 3  2024-01-31  lazyvim-config.md',
		]);
		expect(hrefs(result)).toEqual([
			'/blog/newest-post',
			'/blog/hello-world',
			'/blog/lazyvim-config',
		]);
	});

	it('opens a post by number, slug and slug.md', () => {
		const navigate: Effect[] = [{ type: 'navigate', path: '/blog/hello-world' }];

		expect(run('cat 2').effects).toEqual(navigate);
		expect(run('cat hello-world').effects).toEqual(navigate);
		expect(run('cat hello-world.md').effects).toEqual(navigate);
	});

	it('reports a missing post without navigating', () => {
		for (const arg of ['9', 'nothing', '']) {
			const result = run(`cat ${arg}`.trim());

			expect(result.effects).toEqual([]);
			expect(output(result)).toEqual([`cat: ${arg || '?'}: no such post`]);
		}
	});

	it('numbers posts in ls the same way cat reads them', () => {
		const listed = hrefs(run('ls'));

		listed.forEach((href, index) => {
			expect(run(`cat ${index + 1}`).effects).toEqual([{ type: 'navigate', path: href }]);
		});
	});

	it('opens the windows it advertises and rejects others', () => {
		for (const id of ['about', 'blog', 'projects', 'links']) {
			expect(run(`open ${id}`).effects).toEqual([{ type: 'open', id }]);
		}

		for (const arg of ['trash', 'nothing', '']) {
			const result = run(`open ${arg}`.trim());

			expect(result.effects).toEqual([]);
			expect(output(result)).toEqual(['open: try about, blog, projects or links']);
		}
	});

	it('says who is at the keyboard and what time it is', () => {
		const now = new Date(2026, 10, 10, 12, 0, 0);

		expect(output(run('whoami'))).toEqual(['Maciej Spiechowicz — Software Engineer']);
		expect(output(run('date', { now }))).toEqual([now.toString()]);
	});

	it('inverts through an effect', () => {
		expect(run('invert').effects).toEqual([{ type: 'invert' }]);
	});
});

describe('hidden commands', () => {
	it('lists hidden entries then every post file with ls -la and ls -a', () => {
		const expected = ['.secrets', 'newest-post.md', 'hello-world.md', 'lazyvim-config.md'];

		expect(output(run('ls -la'))).toEqual(expected);
		expect(output(run('ls -a'))).toEqual(expected);
	});

	it('reveals the hints with cat .secrets', () => {
		const text = output(run('cat .secrets')).join('\n');

		expect(text).toContain('fortune');
		expect(text).toContain('click the sun five times');
		expect(text).toContain('bottom right corner');
	});

	it('quotes a random post with a link to it', () => {
		const first = run('fortune', { random: () => 0 });
		const last = run('fortune', { random: () => 0.99 });

		expect(output(first)).toEqual(['“The latest news.”', '   — Newest Post']);
		expect(hrefs(first)).toEqual(['/blog/newest-post']);
		expect(output(last)[1]).toBe('   — LazyVim');
		expect(hrefs(last)).toEqual(['/blog/lazyvim-config']);
	});

	it('draws the cow around the text, with a default', () => {
		const lines = output(run('cowsay hi there'));

		expect(lines.slice(0, 3)).toEqual([' ----------', '< hi there >', ' ----------']);
		expect(lines).toHaveLength(8);
		expect(lines[3]).toBe('        \\   ^__^');
		expect(output(run('cowsay'))[1]).toBe('< Moo. Read the blog. >');
	});

	it('stays in vim until a quit command, then links to the LazyVim post', () => {
		const entered = run('vim');

		expect(entered.vim).toBe(true);
		expect(output(entered)).toEqual(['You are now inside vim. Type :q to get out.']);

		const inside = run('ls', { vim: true });

		expect(inside.vim).toBe(true);
		expect(output(inside)).toEqual(['-- INSERT --   (type :q to get out)']);
		expect(inside.effects).toEqual([]);
		expect(run('', { vim: true }).vim).toBe(true);

		for (const quit of [':q', ':q!', ':wq', ':x']) {
			const left = run(quit, { vim: true });

			expect(left.vim).toBe(false);
			expect(output(left)[0]).toContain('You got out of vim.');
			expect(hrefs(left)).toEqual(['/blog/lazyvim-config']);
		}
	});

	it('enters vim with nvim and vi too', () => {
		expect(run('nvim').vim).toBe(true);
		expect(run('vi').vim).toBe(true);
	});

	it('answers sudo and rm', () => {
		expect(output(run('sudo make me a sandwich'))[0]).toContain('not in the sudoers file');
		expect(output(run('rm -rf /'))).toEqual(['rm: nice try. The blog stays.']);
		expect(output(run('rm -r x'))).toEqual(['rm: nice try. The blog stays.']);
		expect(output(run('rm notes'))).toEqual(['rm: drag an icon onto the Trash instead.']);
	});

	it('serves coffee as a teapot', () => {
		expect(output(run('coffee'))).toEqual(["418 I'm a teapot."]);
		expect(output(run('make coffee'))).toEqual(["418 I'm a teapot."]);
	});

	it('greets with a link to the hello-world post', () => {
		const result = run('hello');

		expect(output(result)).toEqual(['Hello World!']);
		expect(hrefs(result)).toEqual(['/blog/hello-world']);
	});

	it('answers 42', () => {
		expect(output(run('42'))[0]).toContain('That is the answer.');
	});

	it('closes the window on exit and logout', () => {
		expect(run('exit').effects).toEqual([{ type: 'close' }]);
		expect(run('logout').effects).toEqual([{ type: 'close' }]);
	});

	it('switches to the phosphor theme with matrix', () => {
		const result = run('matrix');

		expect(output(result)).toEqual(['Wake up, Maciej…']);
		expect(result.effects).toEqual([{ type: 'theme', theme: 'phosphor' }]);
	});

	it('rolls the desktop', () => {
		expect(run('do a barrel roll').effects).toEqual([{ type: 'barrelRoll' }]);
		expect(run('roll').effects).toEqual([{ type: 'barrelRoll' }]);
	});

	it('opens the hidden file with pi', () => {
		expect(run('pi').effects).toEqual([{ type: 'hiddenFile' }]);
		expect(run('π').effects).toEqual([{ type: 'hiddenFile' }]);
	});

	it('plays wallpaper scenes when the wallpaper is available', () => {
		for (const name of ['jog', 'plane', 'balloon', 'flock', 'ufo']) {
			const result = run(name);

			expect(output(result)).toEqual([`${name}: look at the wallpaper.`]);
			expect(result.effects).toEqual([{ type: 'scene', name }]);
		}
	});

	it('explains when the wallpaper is switched off', () => {
		const result = run('ufo', { scenesAvailable: false });

		expect(output(result)).toEqual(['ufo: the wallpaper is switched off.']);
		expect(result.effects).toEqual([]);
	});
});

describe('links', () => {
	it('only links posts that exist', () => {
		const others = POSTS.filter(({ slug }) => slug !== 'hello-world' && slug !== 'lazyvim-config');
		const hello = run('hello', { posts: others });
		const vimExit = run(':q', { posts: others, vim: true });

		expect(output(hello)).toEqual(['Hello World!']);
		expect(hrefs(hello)).toEqual([]);
		expect(output(vimExit)[0]).toContain('My LazyVim configuration');
		expect(hrefs(vimExit)).toEqual([]);
	});

	it('prints no fortune when there are no posts', () => {
		expect(output(run('fortune', { posts: [] }))).toEqual([]);
	});
});

describe('real articles', () => {
	const modules = import.meta.glob<{ slug?: string } | undefined>('/src/lib/blog/*.svx', {
		eager: true,
		import: 'metadata',
	});
	const slugs = Object.keys(modules).map((path) =>
		path.slice(path.lastIndexOf('/') + 1).replace(/\.svx$/, ''),
	);

	it('keeps the posts the easter eggs link to', () => {
		expect(slugs).toContain('hello-world');
		expect(slugs).toContain('lazyvim-config');
	});
});
