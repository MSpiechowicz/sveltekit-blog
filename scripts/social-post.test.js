import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import twitter from 'twitter-text';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	composeAnnouncement,
	parsePost,
	publishMastodon,
	publishPosts,
	publishX,
	readProviderConfiguration,
	selectNewPosts,
	runCli,
	waitForPublicReadiness,
} from './social-post.js';

const temporaryRepositories = [];

function git(repository, argumentsList) {
	return execFileSync('git', argumentsList, { cwd: repository, encoding: 'utf8' }).trim();
}

function post(slug, description) {
	return `---\ntitle: ${slug}\ndescription: '${description}'\ndate: '09-15-2026'\nslug: ${slug}\n---\n`;
}

function createRepository() {
	const repository = mkdtempSync(join(tmpdir(), 'social-post-'));
	temporaryRepositories.push(repository);
	mkdirSync(join(repository, 'src/lib/blog'), { recursive: true });
	mkdirSync(join(repository, 'src/lib/translations'), { recursive: true });
	writeFileSync(
		join(repository, 'src/lib/translations/en-GB.json'),
		JSON.stringify({ url: 'https://mspiechowicz.com' }),
	);
	git(repository, ['init']);
	git(repository, ['config', 'user.name', 'Social test']);
	git(repository, ['config', 'user.email', 'social@example.test']);
	return repository;
}

function commit(repository, message) {
	git(repository, ['add', '.']);
	git(repository, ['commit', '-m', message]);
	return git(repository, ['rev-parse', 'HEAD']);
}

afterEach(() => {
	vi.restoreAllMocks();
	for (const repository of temporaryRepositories.splice(0)) {
		rmSync(repository, { recursive: true, force: true });
	}
});

describe('social post selection and copy', () => {
	it('selects every newly introduced slug in deterministic order without reposting renamed or edited entries', () => {
		const repository = createRepository();
		writeFileSync(
			join(repository, 'src/lib/blog/old.svx'),
			post('old-entry', 'An existing entry.'),
		);
		const before = commit(repository, 'base entry');

		git(repository, ['mv', 'src/lib/blog/old.svx', 'src/lib/blog/renamed.svx']);
		writeFileSync(join(repository, 'src/lib/blog/z.svx'), post('z-entry', 'The last entry.'));
		writeFileSync(join(repository, 'src/lib/blog/a.svx'), post('a-entry', 'The first entry.'));
		const after = commit(repository, 'two new entries and a rename');

		expect(
			selectNewPosts({ before, after, repositoryRoot: repository }).map((entry) => entry.slug),
		).toEqual(['a-entry', 'z-entry']);

		writeFileSync(
			join(repository, 'src/lib/blog/renamed.svx'),
			post('old-entry', 'An edited existing entry.'),
		);
		const edited = commit(repository, 'edit only');
		expect(selectNewPosts({ before: after, after: edited, repositoryRoot: repository })).toEqual(
			[],
		);
	});

	it('parses quoted and multiline YAML descriptions without evaluating SVX and preserves Unicode links under provider limits', () => {
		const parsed = parsePost(
			`---\ntitle: "A: title"\ndescription: >-\n  Quoted punctuation: "still content", and a home emoji 🏠.\n  This stays in the summary.\nslug: unicode-summary\n---\n<script>throw new Error('must not execute')</script>`,
			'unicode-summary.svx',
			{ origin: 'https://mspiechowicz.com' },
		);
		const announcement = composeAnnouncement({
			...parsed,
			description: `${parsed.description} ${'🏠'.repeat(300)}`,
		});

		expect(parsed.description).toContain('Quoted punctuation: "still content"');
		expect(announcement.mastodon).toContain('https://mspiechowicz.com/blog/unicode-summary');
		expect(announcement.x).toContain('https://mspiechowicz.com/blog/unicode-summary');
		expect(twitter.parseTweet(announcement.x)).toMatchObject({ valid: true });
		expect(twitter.parseTweet(announcement.x).weightedLength).toBeLessThanOrEqual(280);
	});
});

describe('social provider delivery', () => {
	const mastodon = {
		instance: new URL('https://mastodon.example'),
		accessToken: 'mastodon-secret',
		maxCharacters: 500,
	};
	const x = {
		consumerKey: 'consumer-key',
		consumerSecret: 'consumer-secret',
		accessToken: 'access-token',
		accessTokenSecret: 'access-secret',
	};
	const postPayload = {
		slug: 'fixture',
		url: 'https://mspiechowicz.com/blog/fixture',
		mastodon: 'Mastodon fixture\n\nhttps://mspiechowicz.com/blog/fixture',
		x: 'X fixture\n\nhttps://mspiechowicz.com/blog/fixture',
	};

	it('uses the documented provider request shapes and parses returned post IDs through injected transport', async () => {
		const requests = [];
		const transport = async (url, options) => {
			requests.push({ url: String(url), options });
			return String(url).includes('mastodon.example')
				? new Response(JSON.stringify({ id: 'mastodon-id' }), { status: 200 })
				: new Response(JSON.stringify({ data: { id: 'x-id' } }), { status: 201 });
		};

		await expect(
			publishMastodon({ ...postPayload, text: postPayload.mastodon }, mastodon, {
				fetchImplementation: transport,
			}),
		).resolves.toEqual({
			provider: 'mastodon',
			id: 'mastodon-id',
		});
		await expect(
			publishX({ ...postPayload, text: postPayload.x }, x, { fetchImplementation: transport }),
		).resolves.toEqual({
			provider: 'x',
			id: 'x-id',
		});

		expect(requests[0]).toMatchObject({ url: 'https://mastodon.example/api/v1/statuses' });
		expect(JSON.parse(requests[0].options.body)).toEqual({ status: postPayload.mastodon });
		expect(requests[0].options.headers.Authorization).toBe('Bearer mastodon-secret');
		expect(requests[1]).toMatchObject({ url: 'https://api.x.com/2/tweets' });
		expect(JSON.parse(requests[1].options.body)).toEqual({ text: postPayload.x });
		expect(requests[1].options.headers.Authorization).toContain('OAuth ');
	});

	it('fails before any request for incomplete selected-provider configuration and reports partial delivery without secret values', async () => {
		expect(() =>
			readProviderConfiguration(['mastodon'], { MASTODON_INSTANCE: 'https://mastodon.example' }),
		).toThrow('MASTODON_ACCESS_TOKEN is required');

		const transport = async (url) =>
			String(url).includes('mastodon.example')
				? new Response(JSON.stringify({ id: 'mastodon-id' }), { status: 200 })
				: new Response(JSON.stringify({ title: 'rate limited' }), { status: 429 });
		await expect(
			publishPosts([postPayload], {
				providers: ['mastodon', 'x'],
				configuration: { mastodon, x },
				fetchImplementation: transport,
			}),
		).rejects.toThrow('Social publishing stopped after a x failure');

		await expect(
			publishMastodon({ ...postPayload, text: postPayload.mastodon }, mastodon, {
				fetchImplementation: async () => new Response('mastodon-secret', { status: 401 }),
			}),
		).rejects.toThrow('Mastodon request failed with HTTP status 401.');
	});

	it('rejects successful HTTP responses without a usable post ID', async () => {
		await expect(
			publishX({ ...postPayload, text: postPayload.x }, x, {
				fetchImplementation: async () => new Response(JSON.stringify({ data: { id: '' } })),
			}),
		).rejects.toThrow('response did not contain a post ID');
	});
});

describe('social publishing execution', () => {
	it('previews without credentials when Actions supplies an empty instance limit', async () => {
		const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		const transport = vi.spyOn(globalThis, 'fetch');
		await runCli(['--slug', 'track-things-home-assistant', '--dry-run'], {
			MASTODON_MAX_CHARACTERS: '',
		});
		const preview = JSON.parse(stdout.mock.calls[0][0]);
		expect(preview.posts[0].x).toContain(
			'https://mspiechowicz.com/blog/track-things-home-assistant',
		);
		expect(transport).not.toHaveBeenCalled();
	});

	it('does not require provider credentials or send requests when no slugs were added', async () => {
		const revision = git(process.cwd(), ['rev-parse', 'HEAD']);
		const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		const transport = vi.spyOn(globalThis, 'fetch');
		await runCli(['--before', revision, '--after', revision, '--publish'], {});
		expect(JSON.parse(stdout.mock.calls[0][0]).posts).toEqual([]);
		expect(transport).not.toHaveBeenCalled();
	});

	it('waits through deployment failures and stops on a reachable article', async () => {
		const transport = vi
			.fn()
			.mockResolvedValueOnce(new Response(null, { status: 404 }))
			.mockResolvedValueOnce(new Response(null, { status: 200 }));
		await waitForPublicReadiness('https://example.com/blog/new', {
			fetchImplementation: transport,
			sleep: async () => {},
		});
		expect(transport).toHaveBeenCalledTimes(2);
	});

	it('fails closed when the article never becomes reachable', async () => {
		await expect(
			waitForPublicReadiness('https://example.com/blog/new', {
				fetchImplementation: async () => new Response(null, { status: 404 }),
				timeoutSeconds: 1,
				pollSeconds: 2,
			}),
		).rejects.toThrow('Timed out waiting for the public article');
	});
});
