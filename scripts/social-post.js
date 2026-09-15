#!/usr/bin/env node
import { createHash, createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import OAuth from 'oauth-1.0a';
import twitter from 'twitter-text';
import { parseDocument } from 'yaml';

export const REPOSITORY_ROOT = fileURLToPath(new URL('../', import.meta.url));
export const BLOG_DIRECTORY = 'src/lib/blog';
export const X_MAX_WEIGHTED_LENGTH = 280;
export const DEFAULT_MASTODON_MAX_CHARACTERS = 500;
const ZERO_REVISION = '0'.repeat(40);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class PublisherError extends Error {
	constructor(message, { cause } = {}) {
		super(message, cause ? { cause } : undefined);
		this.name = 'PublisherError';
	}
}

function normalizeText(value) {
	return value.replace(/\s+/gu, ' ').trim();
}

function requireString(metadata, field, sourceName) {
	if (typeof metadata[field] !== 'string' || normalizeText(metadata[field]).length === 0) {
		throw new PublisherError(`${sourceName} is missing a non-empty ${field} frontmatter field.`);
	}

	return normalizeText(metadata[field]);
}

function extractFrontmatter(source, sourceName) {
	const lines = source.split(/\r?\n/u);
	const start = lines.findIndex((line) => line === '---');
	if (start === -1 || lines.slice(0, start).some((line) => line.trim().length > 0)) {
		throw new PublisherError(`${sourceName} must begin with a YAML frontmatter delimiter.`);
	}
	const end = lines.findIndex((line, index) => index > start && line === '---');
	if (end === -1) {
		throw new PublisherError(`${sourceName} has no closing YAML frontmatter delimiter.`);
	}

	const document = parseDocument(lines.slice(start + 1, end).join('\n'), { prettyErrors: false });
	if (document.errors.length > 0) {
		throw new PublisherError(`${sourceName} has invalid YAML frontmatter.`);
	}

	const metadata = document.toJS();
	if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
		throw new PublisherError(`${sourceName} frontmatter must be a YAML mapping.`);
	}

	return metadata;
}

export function readSiteOrigin({ repositoryRoot = REPOSITORY_ROOT } = {}) {
	const translationPath = new URL('src/lib/translations/en-GB.json', `file://${repositoryRoot}/`);
	let translation;
	try {
		translation = JSON.parse(readFileSync(translationPath, 'utf8'));
	} catch {
		throw new PublisherError(
			'Could not read the existing site URL from src/lib/translations/en-GB.json.',
		);
	}

	if (typeof translation.url !== 'string') {
		throw new PublisherError('src/lib/translations/en-GB.json must contain a string url value.');
	}

	return validateHttpsUrl(translation.url, 'Site URL').origin;
}

export function parsePost(source, sourceName, { origin = readSiteOrigin() } = {}) {
	const metadata = extractFrontmatter(source, sourceName);
	const title = requireString(metadata, 'title', sourceName);
	const description = requireString(metadata, 'description', sourceName);
	const slug = requireString(metadata, 'slug', sourceName);

	if (!SLUG_PATTERN.test(slug)) {
		throw new PublisherError(`${sourceName} has an unsafe slug.`);
	}

	const url = new URL(`/blog/${encodeURIComponent(slug)}`, validateHttpsUrl(origin, 'Site URL'))
		.href;
	return { title, description, slug, url, sourceName };
}

function validateRevision(revision, field) {
	if (typeof revision !== 'string' || revision.length === 0) {
		throw new PublisherError(`${field} revision is required.`);
	}
	if (revision === ZERO_REVISION || /^0+$/u.test(revision)) {
		throw new PublisherError(
			`${field} revision is all zero. Automatic publishing fails closed because there is no safe comparison base.`,
		);
	}
	if (!/^[0-9a-fA-F]{7,64}$/u.test(revision)) {
		throw new PublisherError(`${field} revision must be a Git object ID.`);
	}
}

function git(args, { repositoryRoot = REPOSITORY_ROOT } = {}) {
	try {
		return execFileSync('git', args, {
			cwd: repositoryRoot,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		});
	} catch {
		throw new PublisherError(
			`Could not read the requested Git revision. Ensure checkout history includes the push before and after revisions.`,
		);
	}
}

export function getPostsAtRevision(
	revision,
	{ repositoryRoot = REPOSITORY_ROOT, origin = readSiteOrigin({ repositoryRoot }) } = {},
) {
	validateRevision(revision, 'Requested');
	git(['cat-file', '-e', `${revision}^{commit}`], { repositoryRoot });
	const paths = git(['ls-tree', '-r', '--name-only', revision, '--', BLOG_DIRECTORY], {
		repositoryRoot,
	})
		.split('\n')
		.filter((path) => path.endsWith('.svx'))
		.sort((left, right) => left.localeCompare(right));
	const posts = paths.map((path) => {
		const source = git(['show', `${revision}:${path}`], { repositoryRoot });
		return parsePost(source, path, { origin });
	});
	const slugs = new Set();
	for (const post of posts) {
		if (slugs.has(post.slug)) {
			throw new PublisherError(
				`Revision ${revision} contains more than one post with slug ${post.slug}.`,
			);
		}
		slugs.add(post.slug);
	}
	return posts;
}

export function selectNewPosts({
	before,
	after,
	repositoryRoot = REPOSITORY_ROOT,
	origin = readSiteOrigin({ repositoryRoot }),
}) {
	validateRevision(before, 'Before');
	validateRevision(after, 'After');
	const beforePosts = getPostsAtRevision(before, { repositoryRoot, origin });
	const afterPosts = getPostsAtRevision(after, { repositoryRoot, origin });
	const existingSlugs = new Set(beforePosts.map((post) => post.slug));
	return afterPosts
		.filter((post) => !existingSlugs.has(post.slug))
		.sort((left, right) => left.slug.localeCompare(right.slug));
}

function graphemes(value) {
	return Array.from(
		new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value),
		({ segment }) => segment,
	);
}

function truncateToFit(description, render, fits) {
	const parts = graphemes(description);
	let end = parts.length;
	while (end > 0 && !fits(render(parts.slice(0, end).join('')))) {
		end -= 1;
	}
	if (end === 0) {
		throw new PublisherError(
			'The canonical link leaves no room for a meaningful announcement excerpt.',
		);
	}
	const full = parts.slice(0, end).join('');
	if (end === parts.length) {
		return full;
	}
	const ellipsisParts = graphemes('…');
	while (end > 0 && !fits(render(`${parts.slice(0, end).join('')}…`))) {
		end -= 1;
	}
	if (end === 0 || ellipsisParts.length === 0) {
		throw new PublisherError(
			'The canonical link leaves no room for a meaningful announcement excerpt.',
		);
	}
	return `${parts.slice(0, end).join('')}…`;
}

function renderAnnouncement(excerpt, url) {
	return `${excerpt}\n\n${url}`;
}

export function composeAnnouncement(
	post,
	{ mastodonMaxCharacters = DEFAULT_MASTODON_MAX_CHARACTERS } = {},
) {
	const maxCharacters = validatePositiveInteger(
		mastodonMaxCharacters,
		'Mastodon maximum character count',
	);
	const description = normalizeText(post.description);
	const mastodon = truncateToFit(
		description,
		(excerpt) => renderAnnouncement(excerpt, post.url),
		(text) => Array.from(text).length <= maxCharacters,
	);
	const x = truncateToFit(
		description,
		(excerpt) => renderAnnouncement(excerpt, post.url),
		(text) => {
			const parsed = twitter.parseTweet(text);
			return parsed.valid && parsed.weightedLength <= X_MAX_WEIGHTED_LENGTH;
		},
	);
	return {
		mastodon: renderAnnouncement(mastodon, post.url),
		x: renderAnnouncement(x, post.url),
	};
}

function validatePositiveInteger(value, label) {
	const number = typeof value === 'number' ? value : Number(value);
	if (!Number.isInteger(number) || number < 1) {
		throw new PublisherError(`${label} must be a positive integer.`);
	}
	return number;
}

export function validateHttpsUrl(value, label) {
	let url;
	try {
		url = new URL(value);
	} catch {
		throw new PublisherError(`${label} must be a valid HTTPS URL.`);
	}
	if (url.protocol !== 'https:' || url.username || url.password) {
		throw new PublisherError(`${label} must be an HTTPS URL without embedded credentials.`);
	}
	return url;
}

function requiredEnvironment(environment, name) {
	const value = environment[name];
	if (typeof value !== 'string' || value.length === 0) {
		throw new PublisherError(`${name} is required for the selected provider.`);
	}
	return value;
}

export function readProviderConfiguration(providers, environment = process.env) {
	const configuration = {};
	if (providers.includes('mastodon')) {
		configuration.mastodon = {
			instance: validateHttpsUrl(
				requiredEnvironment(environment, 'MASTODON_INSTANCE'),
				'MASTODON_INSTANCE',
			),
			accessToken: requiredEnvironment(environment, 'MASTODON_ACCESS_TOKEN'),
			maxCharacters: validatePositiveInteger(
				requiredEnvironment(environment, 'MASTODON_MAX_CHARACTERS'),
				'MASTODON_MAX_CHARACTERS',
			),
		};
	}
	if (providers.includes('x')) {
		configuration.x = {
			consumerKey: requiredEnvironment(environment, 'X_CONSUMER_KEY'),
			consumerSecret: requiredEnvironment(environment, 'X_CONSUMER_SECRET'),
			accessToken: requiredEnvironment(environment, 'X_ACCESS_TOKEN'),
			accessTokenSecret: requiredEnvironment(environment, 'X_ACCESS_TOKEN_SECRET'),
		};
	}
	return configuration;
}

function requestOptions({ method, headers, body, timeoutMilliseconds }) {
	return {
		method,
		headers,
		body,
		redirect: 'error',
		signal: AbortSignal.timeout(timeoutMilliseconds),
	};
}

function requestFailure(provider, response) {
	return new PublisherError(`${provider} request failed with HTTP status ${response.status}.`);
}

async function parseSuccessId(provider, response, path) {
	if (!response.ok) {
		throw requestFailure(provider, response);
	}
	let payload;
	try {
		payload = await response.json();
	} catch {
		throw new PublisherError(`${provider} returned an invalid JSON response.`);
	}
	const id = path.reduce((current, key) => current?.[key], payload);
	if (typeof id !== 'string' || id.trim().length === 0) {
		throw new PublisherError(`${provider} response did not contain a post ID.`);
	}
	return String(id);
}

export async function publishMastodon(
	post,
	configuration,
	{ fetchImplementation = fetch, timeoutMilliseconds = 15_000 } = {},
) {
	const endpoint = new URL('/api/v1/statuses', configuration.instance);
	const body = JSON.stringify({ status: post.text });
	let response;
	try {
		response = await fetchImplementation(
			endpoint,
			requestOptions({
				method: 'POST',
				headers: {
					Authorization: `Bearer ${configuration.accessToken}`,
					'Content-Type': 'application/json',
					'Idempotency-Key': createHash('sha256').update(post.url).digest('hex'),
				},
				body,
				timeoutMilliseconds,
			}),
		);
	} catch {
		throw new PublisherError(
			'Mastodon request could not be completed. Its delivery state is unknown.',
		);
	}
	return { provider: 'mastodon', id: await parseSuccessId('Mastodon', response, ['id']) };
}

export async function publishX(
	post,
	configuration,
	{ fetchImplementation = fetch, timeoutMilliseconds = 15_000 } = {},
) {
	const endpoint = 'https://api.x.com/2/tweets';
	const oauth = new OAuth({
		consumer: { key: configuration.consumerKey, secret: configuration.consumerSecret },
		signature_method: 'HMAC-SHA1',
		hash_function(baseString, key) {
			return createHmac('sha1', key).update(baseString).digest('base64');
		},
	});
	const authorization = oauth.toHeader(
		oauth.authorize(
			{ url: endpoint, method: 'POST' },
			{ key: configuration.accessToken, secret: configuration.accessTokenSecret },
		),
	);
	let response;
	try {
		response = await fetchImplementation(
			endpoint,
			requestOptions({
				method: 'POST',
				headers: { ...authorization, 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: post.text }),
				timeoutMilliseconds,
			}),
		);
	} catch {
		throw new PublisherError('X request could not be completed. Its delivery state is unknown.');
	}
	return { provider: 'x', id: await parseSuccessId('X', response, ['data', 'id']) };
}

async function wait(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function waitForPublicReadiness(
	url,
	{ fetchImplementation = fetch, timeoutSeconds = 300, pollSeconds = 10, sleep = wait } = {},
) {
	const timeoutMilliseconds = validatePositiveInteger(timeoutSeconds, 'Readiness timeout') * 1000;
	const pollMilliseconds = validatePositiveInteger(pollSeconds, 'Readiness poll interval') * 1000;
	const deadline = Date.now() + timeoutMilliseconds;
	while (Date.now() <= deadline) {
		try {
			const response = await fetchImplementation(
				url,
				requestOptions({ method: 'GET', timeoutMilliseconds: 10_000 }),
			);
			if (response.ok) {
				return;
			}
		} catch {
			// A public deployment may not be ready yet; no credentials are sent with this request.
		}
		if (Date.now() + pollMilliseconds > deadline) {
			break;
		}
		await sleep(pollMilliseconds);
	}
	throw new PublisherError(
		`Timed out waiting for the public article URL to become reachable: ${url}`,
	);
}

export async function publishPosts(
	posts,
	{ providers, configuration, fetchImplementation = fetch, timeoutMilliseconds = 15_000 } = {},
) {
	const results = [];
	for (const post of posts) {
		for (const provider of providers) {
			try {
				const result =
					provider === 'mastodon'
						? await publishMastodon({ ...post, text: post.mastodon }, configuration.mastodon, {
								fetchImplementation,
								timeoutMilliseconds,
							})
						: await publishX({ ...post, text: post.x }, configuration.x, {
								fetchImplementation,
								timeoutMilliseconds,
							});
				results.push({ ...result, slug: post.slug });
			} catch (error) {
				const completed = results
					.map((result) => `${result.provider}:${result.slug}:${result.id}`)
					.join(', ');
				throw new PublisherError(
					`Social publishing stopped after a ${provider} failure for ${post.slug}.${completed ? ` Confirmed deliveries: ${completed}.` : ''}`,
					{ cause: error },
				);
			}
		}
	}
	return results;
}

function parseProviders(value) {
	const providers = value === 'all' ? ['mastodon', 'x'] : [value];
	if (!providers.every((provider) => provider === 'mastodon' || provider === 'x')) {
		throw new PublisherError('--provider must be all, mastodon, or x.');
	}
	return providers;
}

export function parseArguments(argumentsList) {
	const options = { publish: false, provider: 'all', waitForReadiness: false };
	for (let index = 0; index < argumentsList.length; index += 1) {
		const argument = argumentsList[index];
		if (argument === '--publish') {
			options.publish = true;
		} else if (argument === '--dry-run') {
			options.publish = false;
		} else if (argument === '--wait-for-readiness') {
			options.waitForReadiness = true;
		} else if (
			argument === '--before' ||
			argument === '--after' ||
			argument === '--slug' ||
			argument === '--provider'
		) {
			const value = argumentsList[index + 1];
			if (!value || value.startsWith('--')) {
				throw new PublisherError(`${argument} requires a value.`);
			}
			options[argument.slice(2).replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase())] = value;
			index += 1;
		} else if (argument === '--help') {
			options.help = true;
		} else {
			throw new PublisherError(`Unknown argument: ${argument}`);
		}
	}
	if (options.slug && !SLUG_PATTERN.test(options.slug)) {
		throw new PublisherError('--slug must be an existing, lowercase blog slug.');
	}
	if (options.slug && options.before) {
		throw new PublisherError('--slug recovery cannot be combined with --before.');
	}
	return options;
}

function help() {
	return `Usage:\n  node scripts/social-post.js --before <git-sha> --after <git-sha> [--dry-run|--publish] [--provider all|mastodon|x] [--wait-for-readiness]\n  node scripts/social-post.js --slug <existing-slug> [--after <git-sha>] [--dry-run|--publish] [--provider mastodon|x] [--wait-for-readiness]`;
}

function selectPostsForOptions(options) {
	if (options.slug) {
		const revision = options.after ?? git(['rev-parse', '--verify', 'HEAD']).trim();
		const posts = getPostsAtRevision(revision);
		const post = posts.find((candidate) => candidate.slug === options.slug);
		if (!post) {
			throw new PublisherError(`No existing blog post has slug ${options.slug}.`);
		}
		return [post];
	}
	if (!options.before || !options.after) {
		throw new PublisherError(
			'Automatic selection requires both --before and --after Git revisions.',
		);
	}
	return selectNewPosts(options);
}

function output(value) {
	process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function writeXDraftSummary(payloads, summaryPath) {
	if (!summaryPath) return;
	const sections = [
		'## X drafts — copy and paste',
		'These are drafts for manual posting, not confirmation of publication or deployment. Check that each article is live before posting to X.',
	];
	if (payloads.length === 0) {
		sections.push('No new blog posts selected; no X drafts to copy.');
	}
	for (const post of payloads) {
		// A longer fence keeps backticks in article copy inside the literal text block.
		const fence = '`'.repeat(
			Math.max(3, ...Array.from(post.x.matchAll(/`+/gu), (match) => match[0].length + 1)),
		);
		sections.push(`### ${post.slug}`, `${fence}text\n${post.x}\n${fence}`);
	}
	appendFileSync(summaryPath, `${sections.join('\n\n')}\n\n`, 'utf8');
}

export async function runCli(argumentsList = process.argv.slice(2), environment = process.env) {
	const options = parseArguments(argumentsList);
	if (options.help) {
		process.stdout.write(`${help()}\n`);
		return 0;
	}
	const providers = parseProviders(options.provider);
	const posts = selectPostsForOptions(options);
	if (posts.length === 0) {
		writeXDraftSummary([], environment.GITHUB_STEP_SUMMARY);
		output({ mode: options.publish ? 'published' : 'dry-run', providers, posts: [] });
		return 0;
	}
	const dryRunMastodonLimit =
		environment.MASTODON_MAX_CHARACTERS || DEFAULT_MASTODON_MAX_CHARACTERS;
	const payloads = posts.map((post) => ({
		...post,
		...composeAnnouncement(post, { mastodonMaxCharacters: dryRunMastodonLimit }),
	}));
	writeXDraftSummary(payloads, environment.GITHUB_STEP_SUMMARY);
	if (!options.publish) {
		output({
			mode: 'dry-run',
			providers,
			posts: payloads.map(({ title, description, slug, url, mastodon, x }) => ({
				title,
				description,
				slug,
				url,
				mastodon,
				x,
			})),
		});
		return 0;
	}

	const configuration = readProviderConfiguration(providers, environment);
	for (const payload of payloads) {
		if (
			providers.includes('mastodon') &&
			Array.from(payload.mastodon).length > configuration.mastodon.maxCharacters
		) {
			throw new PublisherError(
				`Mastodon payload for ${payload.slug} exceeds the configured character limit.`,
			);
		}
		if (providers.includes('x')) {
			const parsed = twitter.parseTweet(payload.x);
			if (!parsed.valid || parsed.weightedLength > X_MAX_WEIGHTED_LENGTH) {
				throw new PublisherError(
					`X payload for ${payload.slug} exceeds the weighted character limit.`,
				);
			}
		}
	}
	if (options.waitForReadiness) {
		for (const payload of payloads) {
			await waitForPublicReadiness(payload.url, {
				timeoutSeconds: environment.SOCIAL_READINESS_TIMEOUT_SECONDS ?? 300,
				pollSeconds: environment.SOCIAL_READINESS_POLL_SECONDS ?? 10,
			});
		}
	}
	const results = await publishPosts(payloads, {
		providers,
		configuration,
		timeoutMilliseconds: 15_000,
	});
	output({ mode: 'published', results });
	return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	runCli().catch((error) => {
		const detail = error.cause instanceof Error ? ` ${error.cause.message}` : '';
		process.stderr.write(`Social publisher failed: ${error.message}${detail}\n`);
		process.exitCode = 1;
	});
}
