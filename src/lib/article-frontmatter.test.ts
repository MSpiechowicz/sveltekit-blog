import { describe, expect, it } from 'vitest';

import { assertArticleFrontmatterBlock, parseArticleFrontmatter } from './article-frontmatter';

const FIELDS = [
	'title: A post',
	"description: 'About something.'",
	"date: '04-14-2024'",
	'slug: a-post',
].join('\n');

const SOCIAL = [
	'social:',
	'  mastodon: >-',
	'    Mastodon draft.',
	'  x: >-',
	'    X draft.',
	'  linkedin: >-',
	'    LinkedIn draft.',
].join('\n');

describe('assertArticleFrontmatterBlock', () => {
	const article = (opening: string) => `${opening}\n${FIELDS}\n---\n\nBody text.\n`;

	it('accepts a block that opens with exactly three dashes', () => {
		expect(() => assertArticleFrontmatterBlock(article('---'), 'post.svx')).not.toThrow();
	});

	it('accepts blank lines, a byte order mark and Windows line endings before the block', () => {
		expect(() => assertArticleFrontmatterBlock(`\n\n${article('---')}`, 'post.svx')).not.toThrow();
		expect(() =>
			assertArticleFrontmatterBlock(`${String.fromCharCode(0xfeff)}${article('---')}`, 'post.svx'),
		).not.toThrow();
		expect(() =>
			assertArticleFrontmatterBlock(article('---').replaceAll('\n', '\r\n'), 'post.svx'),
		).not.toThrow();
	});

	it('rejects an opening that would be published as article text', () => {
		for (const opening of [' ---', '--- ', '----', '--', 'title: A post']) {
			expect(() => assertArticleFrontmatterBlock(article(opening), 'post.svx'), opening).toThrow(
				/post\.svx/,
			);
		}
	});

	it('rejects a block that is never closed', () => {
		expect(() =>
			assertArticleFrontmatterBlock(`---\n${FIELDS}\n\nBody text.\n`, 'post.svx'),
		).toThrow();
	});

	it('rejects a line inside the block that mdsvex would take as its end', () => {
		for (const stray of ['----', '--- # drafts below', '---x']) {
			const source = `---\n${FIELDS}\n${stray}\n${SOCIAL}\n---\n\nBody text.\n`;

			expect(() => assertArticleFrontmatterBlock(source, 'post.svx'), stray).toThrow(/post\.svx/);
		}
	});

	it('rejects social copy that ended up below the block', () => {
		const source = `---\n${FIELDS}\n---\n${SOCIAL}\n---\n\nBody text.\n`;

		expect(() => assertArticleFrontmatterBlock(source, 'post.svx')).toThrow(/social copy/);
	});

	it('accepts a horizontal rule and ordinary prose about social networks in the body', () => {
		const body = 'I posted this on Mastodon and LinkedIn.\n\n---\n\nMore text.\n';

		expect(() =>
			assertArticleFrontmatterBlock(`---\n${FIELDS}\n---\n\n${body}`, 'post.svx'),
		).not.toThrow();
	});

	it('rejects an article with no frontmatter at all', () => {
		expect(() => assertArticleFrontmatterBlock('Just a body.\n', 'post.svx')).toThrow();
	});
});

describe('parseArticleFrontmatter', () => {
	it('returns the public fields and leaves the social drafts out', () => {
		const metadata = parseArticleFrontmatter(`${FIELDS}\nimage: /images/a.png\n${SOCIAL}`);

		expect(metadata).toEqual({
			title: 'A post',
			description: 'About something.',
			date: '04-14-2024',
			slug: 'a-post',
			image: '/images/a.png',
		});
	});

	it('keeps the date exactly as written', () => {
		expect(parseArticleFrontmatter(FIELDS).date).toBe('04-14-2024');
	});

	it('rejects a misspelt or unknown field so drafts cannot ship under another name', () => {
		const misnamed = ['Social', 'socials', 'SOCIAL', 'x', 'drafts'];

		for (const name of misnamed) {
			expect(() => parseArticleFrontmatter(`${FIELDS}\n${name}:\n  x: Draft.`), name).toThrow(
				new RegExp(`"${name}"`),
			);
		}
	});

	it('rejects a missing, empty or non-text required field', () => {
		expect(() => parseArticleFrontmatter('title: A post')).toThrow(/"description"/);
		expect(() => parseArticleFrontmatter(FIELDS.replace('title: A post', 'title: ""'))).toThrow(
			/"title"/,
		);
		expect(() => parseArticleFrontmatter(FIELDS.replace("'04-14-2024'", '2024-04-14'))).toThrow(
			/"date"/,
		);
		expect(() => parseArticleFrontmatter(FIELDS.replace('a-post', 'A Post'))).toThrow(/"slug"/);
	});

	it('rejects social drafts that were indented into another field', () => {
		const indented = SOCIAL.replaceAll('\n', '\n  ');
		const folded = FIELDS.replace(
			"description: 'About something.'",
			`description: >-\n  About.\n  ${indented}`,
		);

		expect(() => parseArticleFrontmatter(folded)).toThrow(/"description"/);
		expect(() => parseArticleFrontmatter(`${FIELDS}\nimage:\n  ${indented}`)).toThrow(/"image"/);
		expect(() => parseArticleFrontmatter(`${FIELDS}\ncategories:\n  ${indented}`)).toThrow(
			/"categories"/,
		);
	});

	it('rejects aliases, which could copy the drafts into a public field', () => {
		const aliased = `${FIELDS}\n${SOCIAL.replace('social:', 'social: &drafts')}\nimageAlt: *drafts`;

		expect(() => parseArticleFrontmatter(aliased)).toThrow();
	});

	it('rejects an incomplete or misshapen social block', () => {
		expect(() => parseArticleFrontmatter(`${FIELDS}\nsocial:\n  x: Only one.`)).toThrow(/"social"/);
		expect(() => parseArticleFrontmatter(`${FIELDS}\nsocial: Just text.`)).toThrow(/"social"/);
		expect(() => parseArticleFrontmatter(`${SOCIAL}\n  threads: Extra.\n${FIELDS}`)).toThrow(
			/"social"/,
		);
	});

	it('accepts an article without a social block', () => {
		expect(parseArticleFrontmatter(FIELDS)).not.toHaveProperty('social');
	});

	it('rejects frontmatter that is not a list of fields', () => {
		for (const source of ['', 'just text', '- a\n- b']) {
			expect(() => parseArticleFrontmatter(source), source).toThrow(/mapping/);
		}
	});
});
