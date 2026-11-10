import { profileLinks } from '#lib/data/links.js';
import type { PostSummary, Project } from '#lib/desktop/types.js';
import translation from '#lib/translations/en-GB.json';

export const SITE_URL = translation.url.replace(/\/+$/, '');
export const SITE_NAME = translation['desktop.name'];
export const SITE_LOCALE = 'en_GB';
export const SITE_LANGUAGE = 'en-GB';
export const JOB_TITLE = 'Software Engineer';

export const BLOG_TITLE = `Blog - ${SITE_NAME}`;
export const BLOG_DESCRIPTION =
	'Articles by Maciej Spiechowicz about software projects, developer tools and what he learns while building them.';

/** Crawlers that are welcome explicitly, besides the wildcard rule. */
export const AI_CRAWLERS = [
	'GPTBot',
	'OAI-SearchBot',
	'ChatGPT-User',
	'ClaudeBot',
	'Claude-SearchBot',
	'PerplexityBot',
	'Google-Extended',
	'Applebot-Extended',
	'CCBot',
];

export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const BLOG_ID = `${SITE_URL}/blog#blog`;

type JsonObject = Record<string, unknown>;

export type JsonLdDocument = {
	'@context': 'https://schema.org';
	'@graph': JsonObject[];
};

export function absoluteUrl(path: string): string {
	return new URL(path, `${SITE_URL}/`).href;
}

export function postUrl(slug: string): string {
	return absoluteUrl(`/blog/${slug}`);
}

/** Converts a frontmatter `MM-DD-YYYY` date to `YYYY-MM-DD`; undefined when missing or impossible. */
export function isoDate(date: string | undefined): string | undefined {
	if (!date || !/^\d{2}-\d{2}-\d{4}$/.test(date)) return undefined;

	const [month, day, year] = date.split('-').map(Number);
	const value = new Date(0);
	value.setUTCFullYear(year, month - 1, day);

	if (
		value.getUTCFullYear() !== year ||
		value.getUTCMonth() !== month - 1 ||
		value.getUTCDate() !== day
	) {
		return undefined;
	}

	return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Latest valid post date as `YYYY-MM-DD`, or undefined when no post has one. */
export function latestPostDate(posts: PostSummary[]): string | undefined {
	return posts
		.map((post) => isoDate(post.date))
		.filter((date): date is string => date !== undefined)
		.sort()
		.at(-1);
}

/** JSON for a script element: `<`, `>`, `&`, U+2028 and U+2029 become `\uXXXX` escapes. */
export function serializeJsonLd(value: unknown): string {
	return JSON.stringify(value).replace(
		/[<>&\u2028\u2029]/g,
		(character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
	);
}

function omitUndefined(value: JsonObject): JsonObject {
	return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function personReference(): JsonObject {
	return { '@type': 'Person', '@id': PERSON_ID, name: SITE_NAME, url: absoluteUrl('/') };
}

function person(logo: string): JsonObject {
	return {
		'@type': 'Person',
		'@id': PERSON_ID,
		name: SITE_NAME,
		url: absoluteUrl('/'),
		jobTitle: JOB_TITLE,
		description: translation.subTitle,
		image: absoluteUrl(logo),
		sameAs: profileLinks.map((link) => link.href),
	};
}

function website(): JsonObject {
	return {
		'@type': 'WebSite',
		'@id': WEBSITE_ID,
		name: SITE_NAME,
		url: absoluteUrl('/'),
		description: translation.description,
		inLanguage: SITE_LANGUAGE,
		publisher: { '@id': PERSON_ID },
		author: { '@id': PERSON_ID },
	};
}

function breadcrumbs(items: { name: string; url: string }[]): JsonObject {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url,
		})),
	};
}

const HOME_CRUMB = { name: translation['navigation.home'], url: absoluteUrl('/') };
const BLOG_CRUMB = { name: translation['navigation.blog'], url: absoluteUrl('/blog') };

export function buildHomeJsonLd(logo: string): JsonLdDocument {
	return {
		'@context': 'https://schema.org',
		'@graph': [website(), person(logo)],
	};
}

export function buildBlogJsonLd(posts: PostSummary[]): JsonLdDocument {
	const blog: JsonObject = {
		'@type': 'Blog',
		'@id': BLOG_ID,
		name: BLOG_TITLE,
		url: absoluteUrl('/blog'),
		description: BLOG_DESCRIPTION,
		inLanguage: SITE_LANGUAGE,
		author: personReference(),
		isPartOf: { '@id': WEBSITE_ID },
		blogPost: posts.map((post) =>
			omitUndefined({
				'@type': 'BlogPosting',
				headline: post.title,
				url: postUrl(post.slug),
				datePublished: isoDate(post.date),
				description: post.description || undefined,
			}),
		),
	};

	return {
		'@context': 'https://schema.org',
		'@graph': [blog, breadcrumbs([HOME_CRUMB, BLOG_CRUMB])],
	};
}

export type PostJsonLdInput = {
	slug: string;
	title: string;
	description?: string;
	date?: string;
	image?: string;
};

export function buildPostJsonLd(post: PostJsonLdInput, logo: string): JsonLdDocument {
	const url = postUrl(post.slug);
	const published = isoDate(post.date);

	const posting = omitUndefined({
		'@type': 'BlogPosting',
		'@id': `${url}#post`,
		headline: post.title,
		description: post.description || undefined,
		datePublished: published,
		dateModified: published,
		author: personReference(),
		publisher: personReference(),
		url,
		mainEntityOfPage: { '@type': 'WebPage', '@id': url },
		image: absoluteUrl(post.image || logo),
		inLanguage: SITE_LANGUAGE,
		isPartOf: { '@id': BLOG_ID },
	});

	return {
		'@context': 'https://schema.org',
		'@graph': [posting, breadcrumbs([HOME_CRUMB, BLOG_CRUMB, { name: post.title, url }])],
	};
}

export function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export function buildSitemapXml(posts: PostSummary[]): string {
	const latest = latestPostDate(posts);

	const entries = [
		{ loc: absoluteUrl('/'), lastmod: latest },
		{ loc: absoluteUrl('/blog'), lastmod: latest },
		...posts.map((post) => ({ loc: postUrl(post.slug), lastmod: isoDate(post.date) })),
	];

	const urls = entries.map(({ loc, lastmod }) => {
		const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';

		return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n  </url>`;
	});

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls,
		'</urlset>',
		'',
	].join('\n');
}

export function buildRobotsTxt(): string {
	const welcomed = AI_CRAWLERS.map((agent) => `User-agent: ${agent}\nAllow: /`);

	return [
		'User-agent: *\nAllow: /',
		...welcomed,
		`Sitemap: ${absoluteUrl('/sitemap.xml')}`,
		'',
	].join('\n\n');
}

function singleLine(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function projectLink(project: Project): string | undefined {
	return project.demo || project.github;
}

export function buildLlmsTxt(posts: PostSummary[], projects: Project[]): string {
	const summary = singleLine(`${translation.subTitle}. ${translation.description}`);

	const postLines = posts.map((post) => {
		const description = post.description ? `: ${singleLine(post.description)}` : '';

		return `- [${singleLine(post.title)}](${postUrl(post.slug)})${description}`;
	});

	const projectLines = projects.map((project) => {
		const link = projectLink(project);
		const title = singleLine(project.title);
		const description = project.description ? `: ${singleLine(project.description)}` : '';

		return link ? `- [${title}](${link})${description}` : `- ${title}${description}`;
	});

	const profileLines = profileLinks.map((link) => `- [${link.name}](${link.href})`);

	const feedLines = [
		`- [RSS feed](${absoluteUrl('/rss.xml')})`,
		`- [Sitemap](${absoluteUrl('/sitemap.xml')})`,
		`- [Full article text](${absoluteUrl('/llms-full.txt')})`,
	];

	return [
		`# ${SITE_NAME}`,
		`> ${summary}`,
		'## Blog posts',
		postLines.join('\n'),
		'## Projects',
		projectLines.join('\n'),
		'## Profiles',
		profileLines.join('\n'),
		'## Feeds',
		feedLines.join('\n'),
		'',
	].join('\n\n');
}

/** Every article as markdown, in the order given. `bodies` maps slug to cleaned markdown. */
export function buildLlmsFullTxt(posts: PostSummary[], bodies: Map<string, string>): string {
	const sections = posts.map((post) => {
		const published = isoDate(post.date);
		const details = [`URL: ${postUrl(post.slug)}`, published ? `Date: ${published}` : undefined];

		return [
			`# ${singleLine(post.title)}`,
			details.filter((line) => line !== undefined).join('\n'),
			bodies.get(post.slug) ?? '',
		]
			.filter((part) => part !== '')
			.join('\n\n');
	});

	return `${sections.join('\n\n---\n\n')}\n`;
}
