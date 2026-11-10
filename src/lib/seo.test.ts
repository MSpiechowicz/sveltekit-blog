import { describe, expect, it } from 'vitest';

import type { PostSummary, Project } from '#lib/desktop/types.js';

import {
	buildBlogJsonLd,
	buildHomeJsonLd,
	buildLlmsFullTxt,
	buildLlmsTxt,
	buildPostJsonLd,
	buildRobotsTxt,
	buildSitemapXml,
	isoDate,
	latestPostDate,
	serializeJsonLd,
} from './seo';

const logo = '/_app/immutable/assets/logo.abc123.png';

const posts: PostSummary[] = [
	{
		slug: 'newer',
		title: 'Newer & better',
		description: 'About <tags> & more',
		date: '10-01-2026',
	},
	{ slug: 'older', title: 'Older', description: 'Plain text', date: '02-28-2025' },
	{ slug: 'undated', title: 'Undated', description: '', date: '' },
];

const projects: Project[] = [
	{
		title: 'Demo app',
		description: 'Has a demo',
		technologies: [],
		demo: 'https://demo.test',
		github: 'https://github.test/demo',
	},
	{
		title: 'Source only',
		description: 'Has source',
		technologies: [],
		github: 'https://github.test/source',
	},
];

type Node = Record<string, unknown>;

function graph(document: { '@graph': Node[] }, type: string): Node {
	const node = document['@graph'].find((entry) => entry['@type'] === type);
	if (!node) throw new Error(`Missing ${type}`);

	return node;
}

describe('isoDate', () => {
	it('converts MM-DD-YYYY to YYYY-MM-DD', () => {
		expect(isoDate('10-01-2026')).toBe('2026-10-01');
		expect(isoDate('02-29-2024')).toBe('2024-02-29');
	});

	it('omits missing, malformed and impossible dates instead of guessing', () => {
		expect(isoDate(undefined)).toBeUndefined();
		expect(isoDate('')).toBeUndefined();
		expect(isoDate('2026-10-01')).toBeUndefined();
		expect(isoDate('02-30-2025')).toBeUndefined();
		expect(isoDate('13-01-2025')).toBeUndefined();
	});

	it('finds the latest valid post date', () => {
		expect(latestPostDate(posts)).toBe('2026-10-01');
		expect(latestPostDate([posts[2]])).toBeUndefined();
	});
});

describe('structured data', () => {
	it('describes the website and the person with profile links on the home page', () => {
		const document = buildHomeJsonLd(logo);
		const person = graph(document, 'Person');
		const website = graph(document, 'WebSite');

		expect(document['@context']).toBe('https://schema.org');
		expect(person.jobTitle).toBe('Software Engineer');
		expect(person.image).toBe(`https://mspiechowicz.com${logo}`);
		expect(person.sameAs).toEqual(
			expect.arrayContaining([
				'https://www.linkedin.com/in/mspiechowicz/',
				'https://github.com/MSpiechowicz',
				'https://mastodon.social/@mspiechowicz',
				'https://www.facebook.com/maciej.spiechowicz',
			]),
		);
		expect(website.inLanguage).toBe('en-GB');
		expect(website.publisher).toEqual({ '@id': person['@id'] });
	});

	it('lists every post on the blog and adds a Home to Blog breadcrumb', () => {
		const document = buildBlogJsonLd(posts);
		const blog = graph(document, 'Blog');
		const entries = blog.blogPost as Node[];
		const crumbs = graph(document, 'BreadcrumbList').itemListElement as Node[];

		expect(blog.url).toBe('https://mspiechowicz.com/blog');
		expect((blog.author as Node)['@id']).toBe(graph(buildHomeJsonLd(logo), 'Person')['@id']);
		expect(entries.map((entry) => entry.url)).toEqual([
			'https://mspiechowicz.com/blog/newer',
			'https://mspiechowicz.com/blog/older',
			'https://mspiechowicz.com/blog/undated',
		]);
		expect(entries[0].datePublished).toBe('2026-10-01');
		expect('datePublished' in entries[2]).toBe(false);
		expect(crumbs.map((crumb) => crumb.item)).toEqual([
			'https://mspiechowicz.com/',
			'https://mspiechowicz.com/blog',
		]);
	});

	it('describes a post with its own image and a three-step breadcrumb', () => {
		const document = buildPostJsonLd({ ...posts[0], image: '/images/shot.png' }, logo);
		const posting = graph(document, 'BlogPosting');
		const crumbs = graph(document, 'BreadcrumbList').itemListElement as Node[];

		expect(posting.url).toBe('https://mspiechowicz.com/blog/newer');
		expect(posting.image).toBe('https://mspiechowicz.com/images/shot.png');
		expect(posting.datePublished).toBe('2026-10-01');
		expect(posting.dateModified).toBe('2026-10-01');
		expect((posting.isPartOf as Node)['@id']).toBe(graph(buildBlogJsonLd(posts), 'Blog')['@id']);
		expect(crumbs).toHaveLength(3);
		expect(crumbs[2].item).toBe('https://mspiechowicz.com/blog/newer');
	});

	it('falls back to the logo image and drops an invalid date', () => {
		const posting = graph(
			buildPostJsonLd({ ...posts[2], date: '99-99-9999' }, logo),
			'BlogPosting',
		);

		expect(posting.image).toBe(`https://mspiechowicz.com${logo}`);
		expect('datePublished' in posting).toBe(false);
		expect('dateModified' in posting).toBe(false);
	});
});

describe('serializeJsonLd', () => {
	it('keeps the output safe inside a script element and valid JSON', () => {
		const value = { text: '</script><b>&amp;</b>\u2028\u2029' };
		const output = serializeJsonLd(value);

		expect(output).not.toMatch(/[<>&\u2028\u2029]/);
		expect(output).toContain('\\u003c/script\\u003e');
		expect(JSON.parse(output)).toEqual(value);
	});
});

describe('sitemap.xml', () => {
	const xml = buildSitemapXml(posts);

	it('lists the home page, the blog and every post once', () => {
		const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

		expect(locations).toEqual([
			'https://mspiechowicz.com/',
			'https://mspiechowicz.com/blog',
			'https://mspiechowicz.com/blog/newer',
			'https://mspiechowicz.com/blog/older',
			'https://mspiechowicz.com/blog/undated',
		]);
	});

	it('uses the latest post date for index pages and omits unknown dates', () => {
		const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]);

		expect(lastmods).toEqual(['2026-10-01', '2026-10-01', '2026-10-01', '2025-02-28']);
	});

	it('escapes ampersands in URLs', () => {
		const output = buildSitemapXml([{ ...posts[0], slug: 'a&b' }]);

		expect(output).toContain('/blog/a&amp;b</loc>');
		expect(output).not.toMatch(/&(?!amp;)/);
	});
});

describe('robots.txt', () => {
	it('welcomes AI crawlers and points to the sitemap', () => {
		const robots = buildRobotsTxt();

		expect(robots).toContain('User-agent: *\nAllow: /');
		expect(robots).toContain('User-agent: GPTBot\nAllow: /');
		expect(robots).toContain('User-agent: ClaudeBot\nAllow: /');
		expect(robots).not.toContain('Disallow: /');
		expect(robots).toContain('Sitemap: https://mspiechowicz.com/sitemap.xml');
	});
});

describe('llms.txt', () => {
	const text = buildLlmsTxt(posts, projects);

	it('starts with the site name and a summary quote', () => {
		const lines = text.split('\n');

		expect(lines[0]).toBe('# Maciej Spiechowicz');
		expect(lines.find((line) => line.startsWith('>'))).toContain('Software Engineer');
	});

	it('lists every post with an absolute URL, newest first as given', () => {
		const links = [
			...text.matchAll(/^- \[[^\]]+\]\((https:\/\/mspiechowicz\.com\/blog\/[^)]+)\)/gm),
		];

		expect(links.map((match) => match[1])).toEqual([
			'https://mspiechowicz.com/blog/newer',
			'https://mspiechowicz.com/blog/older',
			'https://mspiechowicz.com/blog/undated',
		]);
	});

	it('links each project to its demo, else its source', () => {
		expect(text).toContain('- [Demo app](https://demo.test): Has a demo');
		expect(text).toContain('- [Source only](https://github.test/source): Has source');
	});

	it('lists profiles and feeds', () => {
		expect(text).toContain('## Profiles');
		expect(text).toContain('https://github.com/MSpiechowicz');
		expect(text).toContain('(https://mspiechowicz.com/rss.xml)');
		expect(text).toContain('(https://mspiechowicz.com/sitemap.xml)');
		expect(text).toContain('(https://mspiechowicz.com/llms-full.txt)');
	});
});

describe('llms-full.txt', () => {
	it('introduces each article with its title, URL, date and body', () => {
		const bodies = new Map([
			['newer', 'Body one.'],
			['older', 'Body two.'],
		]);
		const text = buildLlmsFullTxt(posts.slice(0, 2), bodies);

		expect(text).toContain(
			'# Newer & better\n\nURL: https://mspiechowicz.com/blog/newer\nDate: 2026-10-01\n\nBody one.',
		);
		expect(text.indexOf('Body one.')).toBeLessThan(text.indexOf('Body two.'));
	});
});
