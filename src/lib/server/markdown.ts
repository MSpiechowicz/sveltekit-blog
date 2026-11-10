const rawArticles = import.meta.glob<string>('/src/lib/blog/*.svx', {
	query: '?raw',
	import: 'default',
	eager: true,
});

const FRONTMATTER = /^[\s\uFEFF]*---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;
const SPACER_LINE = /^[ \t]*<br\s*\/?>[ \t]*$/gim;
const MARKDOWN_ROOT_LINK = /(\]\()(\/(?!\/))/g;
const HTML_ROOT_LINK = /(\b(?:href|src)=["'])(\/(?!\/))/gi;

/** Removes the leading YAML block, which also holds the social copy that must not be republished. */
export function stripFrontmatter(source: string): string {
	return source.replace(FRONTMATTER, '');
}

/** Turns `/blog/...` and `/images/...` links and images into absolute URLs. */
export function absolutizeLinks(markdown: string, siteUrl: string): string {
	const origin = siteUrl.replace(/\/+$/, '');

	return markdown
		.replace(
			MARKDOWN_ROOT_LINK,
			(_match, open: string, slash: string) => `${open}${origin}${slash}`,
		)
		.replace(HTML_ROOT_LINK, (_match, open: string, slash: string) => `${open}${origin}${slash}`);
}

/** Article source as plain markdown: no frontmatter, no `<br/>` spacer lines, absolute links. */
export function articleMarkdown(source: string, siteUrl: string): string {
	const body = stripFrontmatter(source).replace(SPACER_LINE, '');

	return absolutizeLinks(body, siteUrl).trim();
}

function slugFromPath(path: string): string {
	return path.slice(path.lastIndexOf('/') + 1).replace(/\.svx$/, '');
}

/** Raw article sources by slug (file name), bundled at build time so no file access is needed at request time. */
export function getRawArticles(): Map<string, string> {
	return new Map(Object.entries(rawArticles).map(([path, source]) => [slugFromPath(path), source]));
}
