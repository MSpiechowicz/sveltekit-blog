import { describe, expect, it } from 'vitest';

import { hiddenFileLines, type Line } from './hidden-file';
import type { PostSummary, Project } from './types';

const INFO = { name: 'Ada Lovelace', subtitle: 'Engineer' };

function post(slug: string, date: string, title = `Title of ${slug}`): PostSummary {
	return { slug, title, description: '', date };
}

function project(technologies: string[], extra: Partial<Project> = {}): Project {
	return { title: 'P', description: '', technologies, ...extra };
}

function text(line: Line): string {
	return line.map((segment) => segment.text).join('');
}

function rowOf(lines: Line[], name: string): Line {
	const row = lines.find((line) => text(line).startsWith(name));
	if (!row) throw new Error(`no row ${name}`);

	return row;
}

function value(lines: Line[], name: string): string {
	return text(rowOf(lines, name)).replace(/^[A-Z ]+\.+ /, '');
}

describe('hiddenFileLines', () => {
	const posts = [
		post('newest', '03-09-2026'),
		post('middle', '07-01-2025'),
		post('also-2026', '01-20-2026'),
		post('oldest', '12-31-2024'),
	];

	it('counts the posts per year, newest year first, from the dates present', () => {
		expect(value(hiddenFileLines(posts, [], INFO), 'POSTS ON DISK')).toBe(
			'4  (2026: 2 · 2025: 1 · 2024: 1)',
		);
	});

	it('does not list years without posts and does not hard-code any year', () => {
		const lines = hiddenFileLines([post('a', '05-05-2031'), post('b', '01-01-2029')], [], INFO);

		expect(value(lines, 'POSTS ON DISK')).toBe('2  (2031: 1 · 2029: 1)');
	});

	it('shows the earliest and latest post as links with a long date', () => {
		const lines = hiddenFileLines(posts, [], INFO);

		expect(rowOf(lines, 'FIRST ENTRY')).toContainEqual({ text: 'Title of oldest', slug: 'oldest' });
		expect(text(rowOf(lines, 'FIRST ENTRY'))).toMatch(/, December 31, 2024$/);
		expect(rowOf(lines, 'LATEST ENTRY')).toContainEqual({
			text: 'Title of newest',
			slug: 'newest',
		});
		expect(text(rowOf(lines, 'LATEST ENTRY'))).toMatch(/, March 9, 2026$/);
	});

	it('only links entries that have a slug and skips posts with unreadable dates', () => {
		const lines = hiddenFileLines(
			[post('', '01-01-2020', 'Slugless'), post('bad', '02-30-2024'), post('ok', '06-06-2022')],
			[],
			INFO,
		);
		const linked = lines.flat().filter((segment) => segment.slug !== undefined);

		expect(linked).toEqual([{ text: 'Title of ok', slug: 'ok' }]);
		expect(rowOf(lines, 'FIRST ENTRY').some((segment) => segment.slug !== undefined)).toBe(false);
		expect(text(rowOf(lines, 'FIRST ENTRY'))).toContain('Slugless, January 1, 2020');
		expect(value(lines, 'POSTS ON DISK')).toBe('3  (2022: 1 · 2020: 1)');
	});

	it('counts projects with source and with a live demo', () => {
		const lines = hiddenFileLines(
			[],
			[
				project([], { github: 'https://github.com/a' }),
				project([], { github: 'https://github.com/b', demo: 'https://b.example' }),
				project([]),
			],
			INFO,
		);

		expect(value(lines, 'PROJECTS')).toBe('3  (2 with source, 1 with a live demo)');
	});

	it('ranks the five most used technologies and breaks ties alphabetically', () => {
		const lines = hiddenFileLines(
			[],
			[
				project(['Svelte', 'TypeScript', 'Rust']),
				project(['TypeScript', 'Bun', 'Svelte']),
				project(['Zig', 'TypeScript', 'ansible', 'Go']),
			],
			INFO,
		);

		expect(value(lines, 'MOST USED')).toBe(
			'TypeScript ×3 · Svelte ×2 · ansible ×1 · Bun ×1 · Go ×1',
		);
	});

	it('does not depend on the order of the projects for ties', () => {
		const a = project(['B', 'A']);
		const b = project(['C']);

		expect(value(hiddenFileLines([], [a, b], INFO), 'MOST USED')).toBe(
			value(hiddenFileLines([], [b, a], INFO), 'MOST USED'),
		);
	});

	it('shows the subject and role and keeps the labels aligned', () => {
		const lines = hiddenFileLines(posts, [project(['A'])], INFO);

		expect(value(lines, 'SUBJECT')).toBe('Ada Lovelace');
		expect(value(lines, 'ROLE')).toBe('Engineer');

		for (const name of ['SUBJECT', 'POSTS ON DISK', 'FIRST ENTRY', 'LATEST ENTRY', 'MOST USED']) {
			expect(text(rowOf(lines, name)).indexOf('. ')).toBeLessThan(18);
			expect(text(rowOf(lines, name)).slice(0, 19)).toMatch(/^[A-Z ]+\.+ $/);
		}
	});

	it('opens and closes with the fixed greeting and farewell and lists the unlisted tricks', () => {
		const lines = hiddenFileLines(posts, [], INFO).map(text);

		expect(lines.slice(0, 3)).toEqual(['> π', '> BACKDOOR ACCEPTED', '> OPENING HIDDEN FILE …']);
		expect(lines.at(-1)).toBe('> END OF FILE. PRESS ESC TO LOG OUT.');
		expect(lines).toContain('UNLISTED TERMINAL COMMANDS');
		expect(lines.join('\n')).not.toContain('storm');
		expect(lines.join('\n')).toContain('click the sun five times');
	});

	it('does not throw on empty inputs and shows empty values', () => {
		const lines = hiddenFileLines([], [], INFO);

		expect(value(lines, 'POSTS ON DISK')).toBe('0');
		expect(value(lines, 'FIRST ENTRY')).toBe('-');
		expect(value(lines, 'LATEST ENTRY')).toBe('-');
		expect(value(lines, 'PROJECTS')).toBe('0  (0 with source, 0 with a live demo)');
		expect(value(lines, 'MOST USED')).toBe('-');
	});
});
