import { describe, expect, it } from 'vitest';

type Metadata = Record<string, unknown>;

// The compiled `metadata` export of every article, exactly as the site and /api/posts receive it.
const articles = Object.entries(
	import.meta.glob<Metadata>('/src/lib/blog/*.svx', { eager: true, import: 'metadata' }),
);

describe('compiled article metadata', () => {
	it('finds the articles', () => {
		expect(articles.length).toBeGreaterThan(0);
	});

	it('never carries the social drafts, which are for manual posting only', () => {
		for (const [path, metadata] of articles) {
			const socialKeys = Object.keys(metadata).filter((key) => /social/i.test(key));

			expect(socialKeys, path).toEqual([]);
		}
	});

	it('keeps the fields the site needs, with the date as written in the article', () => {
		for (const [path, metadata] of articles) {
			expect(metadata.title, path).toEqual(expect.any(String));
			expect(metadata.description, path).toEqual(expect.any(String));
			expect(metadata.slug, path).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
			expect(metadata.date, path).toMatch(/^\d{2}-\d{2}-\d{4}$/);
		}
	});
});
