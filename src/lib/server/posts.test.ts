import { readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { getPostSummaries } from './posts';

describe('getPostSummaries', () => {
	const summaries = getPostSummaries();

	it('includes one summary per article file', () => {
		const files = readdirSync('src/lib/blog').filter((name) => name.endsWith('.svx'));

		expect(summaries).toHaveLength(files.length);
	});

	it('lists every article with only the fields the desktop needs', () => {
		expect(summaries.length).toBeGreaterThan(0);

		for (const summary of summaries) {
			expect(Object.keys(summary).sort()).toEqual(['date', 'description', 'slug', 'title']);
			expect(summary.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
			expect(summary.title).not.toBe('');
			expect(summary.date).toMatch(/^\d{2}-\d{2}-\d{4}$/);
		}
	});

	it('sorts newest first by MM-DD-YYYY date', () => {
		const times = summaries.map(({ date }) => {
			const [month, day, year] = date.split('-').map(Number);

			return Date.UTC(year, month - 1, day);
		});

		expect(times).toEqual([...times].sort((a, b) => b - a));
	});

	it('has unique slugs', () => {
		const slugs = summaries.map(({ slug }) => slug);

		expect(new Set(slugs).size).toBe(slugs.length);
	});
});
