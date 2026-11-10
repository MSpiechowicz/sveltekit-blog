import { describe, expect, it } from 'vitest';

// These fixtures go through the same mdsvex pipeline as real articles (see vite.config.ts), so the
// tests prove the checks are wired into the build, not only that the helper functions work.
describe('article build checks', () => {
	it('compiles a well-formed article and leaves the social drafts out of its metadata', async () => {
		const article = await import('./fixtures/valid-article.svx');

		expect(article.metadata).toEqual({
			title: 'A probe',
			description: 'Only used by a test.',
			date: '01-01-2026',
			slug: 'probe',
		});
	});

	it('refuses to compile an article whose frontmatter block is malformed', async () => {
		await expect(import('./fixtures/indented-fence.svx')).rejects.toThrow(/frontmatter block/);
	});

	it('refuses to compile an article with a misnamed social field', async () => {
		await expect(import('./fixtures/misnamed-social.svx')).rejects.toThrow(/"Social"/);
	});
});
