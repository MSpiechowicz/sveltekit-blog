import { describe, expect, it } from 'vitest';

import { absolutizeLinks, articleMarkdown, getRawArticles, stripFrontmatter } from './markdown';

const siteUrl = 'https://mspiechowicz.com';

const source = `---
title: 'Example'
social:
  mastodon: >-
    Secret social sentence.
---

Hello there!

<br/>

See [the post](/blog/other) and ![shot](/images/shot.png).
`;

describe('stripFrontmatter', () => {
	it('removes the YAML block including social copy and keeps the body', () => {
		const body = stripFrontmatter(source);

		expect(body).not.toContain('Secret social sentence');
		expect(body).not.toContain('social:');
		expect(body.trim().startsWith('Hello there!')).toBe(true);
	});

	it('also removes a frontmatter block that follows blank lines', () => {
		const body = stripFrontmatter(`\n\n${source}`);

		expect(body).not.toContain('Secret social sentence');
		expect(body.trim().startsWith('Hello there!')).toBe(true);
	});

	it('leaves text without frontmatter untouched', () => {
		expect(stripFrontmatter('No frontmatter\n---\nrule')).toBe('No frontmatter\n---\nrule');
	});
});

describe('absolutizeLinks', () => {
	it('turns root-relative links and images into absolute URLs', () => {
		const output = absolutizeLinks(source, siteUrl);

		expect(output).toContain('[the post](https://mspiechowicz.com/blog/other)');
		expect(output).toContain('![shot](https://mspiechowicz.com/images/shot.png)');
	});

	it('leaves external and protocol-relative links alone', () => {
		const input = '[a](https://example.com/x) [b](//cdn.test/y) [c](#anchor)';

		expect(absolutizeLinks(input, siteUrl)).toBe(input);
	});

	it('handles HTML attributes', () => {
		expect(absolutizeLinks('<img src="/images/a.png">', siteUrl)).toBe(
			'<img src="https://mspiechowicz.com/images/a.png">',
		);
	});
});

describe('articleMarkdown', () => {
	it('drops spacer lines and frontmatter', () => {
		const output = articleMarkdown(source, siteUrl);

		expect(output).not.toContain('<br');
		expect(output).not.toContain('Secret social sentence');
		expect(output).toContain('Hello there!');
	});
});

describe('getRawArticles', () => {
	it('keeps social copy out of every article body', () => {
		for (const [slug, raw] of getRawArticles()) {
			const body = articleMarkdown(raw, siteUrl);

			expect(body, slug).not.toMatch(/^\s*(?:social|mastodon|linkedin):/m);
			expect(body, slug).not.toMatch(/^title: /m);
		}
	});

	it('bundles real articles without frontmatter keys leaking into the body', () => {
		const articles = getRawArticles();
		const timer = articles.get('useful-timer');

		expect(articles.size).toBeGreaterThan(0);
		expect(timer).toBeDefined();

		const body = articleMarkdown(timer ?? '', siteUrl);

		expect(body).toContain('Eight ways to watch time pass');
		expect(body).not.toMatch(/^(mastodon|linkedin|social):/m);
	});
});
