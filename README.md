# Personal Blog

Hi! This is my personal blog. In case you want to fork it, please make sure to change the content to fit your needs.

## Dependencies

Below you can find list of the dependencies that are used to build this blog:

| Name          | URL                         |
| ------------- | --------------------------- |
| Bun           | https://bun.sh              |
| SvelteKit     | https://svelte.dev/docs/kit |
| TailwindCSS   | https://tailwindcss.com     |
| shadcn-svelte | https://shadcn-svelte.com   |
| Vite          | https://vite.dev            |
| mdsvex        | https://mdsvex.com          |

## Installation

Use Node.js 24 LTS for development, CI, and Vercel builds, with Bun 1.4.2 for dependency installation. The package manager is declared in `package.json`; `bun.lock` is the committed text lockfile. Install it with `bun install --frozen-lockfile` in CI. Vercel's adapter does not yet support building with Node.js 26.

To start using this blog, you need to install the dependencies first. You can do that by running the following command:

```bash
bun install
```

Then you can start the development server by running the following command:

```bash
bun dev
```

Run `bun audit` after dependency updates. The `cookie` override keeps SvelteKit's cookie parser/serializer on patched 0.7.x releases because SvelteKit still declares the vulnerable 0.6.x range; remove it when upstream requires a patched release.

### Current toolchain

The project uses Svelte 5 runes and snippets, SvelteKit 2, Vite 8, Bits UI 2, and Tailwind CSS 4. Tailwind runs through `@tailwindcss/vite`; theme tokens and utilities live in `src/app.css`, with no separate Tailwind or PostCSS configuration. Component styles that use `@apply` reference that stylesheet.

TypeScript is held at `~6.0.3`, the newest stable release supported by SvelteKit, svelte-check, and typescript-eslint. TypeScript 7 is not yet within their declared peer ranges. Other direct dependencies use the current stable releases available at migration time. Historical blog posts describe the stack at their original publication dates and are intentionally unchanged.

After dependency changes, run:

```bash
bun run check
bun run test --run
bun run lint
bun run build
bun audit
```

With Node.js 24, `VERCEL=1 bun run build` also verifies the installed Vercel adapter and generates the deployment output without publishing it.

## Content

The content of this blog is stored in the `src/lib/blog` directory. You can add new blog posts by creating a new `.svx` file in that directory.

Article detail pages keep the title and prose in the same centered column, up to 800px wide, which narrows naturally on smaller screens.

Article pages include server-rendered Open Graph and X card metadata using the post's `title`, `description`, and canonical URL. Add optional `image` and `imageAlt` frontmatter to choose an article-specific preview; otherwise the site logo is used. Store local preview images in `static/images/` and reference them as `/images/filename.png`. Image URLs are resolved against the configured site URL so social crawlers receive absolute URLs.

The Oh My Pi Usage Dashboard preview comes from that project's `docs/assets/dashboard.png` and shows synthetic usage data, not live account readings. Social platforms cache link cards, so deploying metadata changes may not immediately refresh cards on existing posts. Updating an existing article's image or description does not trigger another automatic announcement.

If an existing post still shows a text-only card, inspect the platform's cached preview separately from the live page. Deploying correct tags does not force an existing card to refresh. Mastodon's public status API exposes `card.image`; a null value means that stored card has no thumbnail. Ask the instance administrator to investigate/refetch that card rather than rerunning the publisher. X and LinkedIn maintain independent caches, so a working LinkedIn preview does not imply an older X or Mastodon card has refreshed. Avoid deleting or reposting automatically just to refresh a preview.

## Social publishing

The `Publish new blog posts` workflow announces a post only when a push to the repository's default branch introduces a previously absent `slug` in `src/lib/blog/**/*.svx`. It compares the push's `before` and `after` revisions, so an edit, removal, filename rename with the same slug, or unrelated push does not repost an entry. An initial push with an all-zero base and unavailable Git history fail closed rather than announcing the archive.

Automatic publishing and manual Actions recovery target **Mastodon only**. Every run summary includes separate Mastodon, X, and LinkedIn sections for the selected articles. X and LinkedIn are copy-and-paste drafts; neither API is called by the workflow and neither needs credentials. Their API providers remain available for explicit local use.

Announcements use article-specific `social.mastodon`, `social.x`, and `social.linkedin` frontmatter, each a non-empty YAML string without the article URL. The publisher appends the canonical URL from site configuration and preserves it when truncating to platform limits. Articles without a `social` mapping fall back to their SEO `description`; a partial or malformed mapping fails rather than silently ignoring missing copy.

Write distinct, factual copy for each platform rather than reusing the description or adding randomly selected canned introductions. Mastodon is conversational; X is compact. LinkedIn starts with a polite, more formal greeting such as “Hello, …” and develops the topic in several substantive sentences with more context. Vary the angle and opening between articles; avoid a recurring “I created…” formula. `AGENTS.md` instructs authoring agents to write this copy alongside articles and review recent announcements for repetition. No LLM API, credentials, or nondeterministic rewriting runs in CI: preview and delivery use the same committed copy.

### Account and repository setup

Enable the workflow after configuring these repository secrets:

| Secret                  | Purpose                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `MASTODON_INSTANCE`     | HTTPS URL of the Mastodon instance, for example `https://mastodon.social` |
| `MASTODON_ACCESS_TOKEN` | A Mastodon user token with the `write:statuses` scope                     |

Also add the non-secret repository variable `MASTODON_MAX_CHARACTERS`. Set it to the selected instance's supported status limit (from its instance configuration); live publishing refuses to guess this limit. The workflow never exposes these values to browser code or tracked files.

The Mastodon token must belong to the account that will post. The current instance is `https://social.josko.org`, with a supported limit of 500 characters.

### Preview, readiness, and recovery

Local execution is a credential-free preview by default. These commands render exact payloads and make no publishing requests:

```bash
# Compare the two revisions from an automatic push.
node scripts/social-post.js --before <before-sha> --after <after-sha> --provider mastodon --dry-run

# Preview one existing post, including the representative Home Assistant article.
node scripts/social-post.js --slug track-things-home-assistant --provider mastodon --dry-run

# Preview LinkedIn copy without publishing it.
node scripts/social-post.js --slug track-things-home-assistant --provider linkedin --dry-run
```

The manual Actions preview also works before account setup. An unset Mastodon limit uses 500 characters for previews only; live Mastodon publishing still requires the configured instance limit. Pushes with no newly introduced slugs exit without credentials or network requests.

### Copy social drafts from GitHub Actions

Open **Actions → Publish new blog posts → select a run → Summary**. Each selected article has copy in three separate sections:

- **Mastodon copy**: the exact prepared announcement, not a delivery receipt. Automatic live runs send it to Mastodon; inspect results before posting manually to avoid duplicates.
- **X drafts — copy and paste**: compact copy within X's weighted character limit.
- **LinkedIn drafts — copy and paste**: a longer, greeting-led professional announcement.

Copy X and LinkedIn drafts into their respective platforms and publish manually. No developer app setup or API access is needed. The sections appear for automatic new-post runs and manual previews/recovery, before readiness checks and Mastodon publishing, so drafts remain available if those fail. Runs with no selected posts show an empty-state message in each section. Check that the article is live before posting: drafts confirm neither deployment nor delivery. GitHub's notification email links to the run but does not contain the copy itself.

Merging workflow or publisher changes alone does not trigger automatic publishing. Existing article edits do not select a new slug, and the publisher exits without network requests when no new posts are selected. To preview an already published article, use manual `preview` mode; `live` is an explicit recovery action and can repost it.

### Deployment readiness and recovery

Automatic live delivery waits for every selected public canonical URL to return a successful response before any provider write. The bounded default is 300 seconds, polling every 10 seconds; `SOCIAL_READINESS_TIMEOUT_SECONDS` and `SOCIAL_READINESS_POLL_SECONDS` change those limits. This confirms reachability only, not that the response is the deployment revision just pushed.

For a confirmed Mastodon failure, use **Actions → Publish new blog posts → Run workflow**. It starts in `preview` mode. Inspect your Mastodon account and the failed job, preview the exact existing slug, then select `live` to recover that post. A rerun of an automatic live workflow intentionally stops instead of replaying writes.

A failure or interrupted request can occur after Mastodon accepted a post, and replaying an uncertain write can create a duplicate. Mastodon's deterministic idempotency key has limited provider retention. Always inspect the account before recovery.

### Optional API providers (inactive in Actions)

The local publisher supports `--provider linkedin`, `--provider x`, comma-separated providers, or `--provider all`. Omitting `--provider` selects all three, but execution remains a dry run unless `--publish` is explicitly supplied. Use `--provider mastodon` to match the workflow. Enabling another provider in Actions requires an explicit workflow change.

For optional LinkedIn API publishing, create an app associated with a LinkedIn Page in the [Developer Portal](https://www.linkedin.com/developers/apps) and enable **Share on LinkedIn**. Set local environment variables `LINKEDIN_ACCESS_TOKEN` (member OAuth token with `w_member_social`) and `LINKEDIN_AUTHOR_URN` (the same member's `urn:li:person:...`, not a profile URL). This posts to the personal profile, not the associated Page. For member identification, enable **Sign In with LinkedIn using OpenID Connect**, authorize `openid profile`, and prefix the `sub` returned by `GET https://api.linkedin.com/v2/userinfo` with `urn:li:person:`. Tokens must be replaced when expired or revoked; the publisher does not refresh them. See LinkedIn's [sharing API](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin) and [member identification guide](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2). None of this setup is needed for summary drafts.

Optional X API publishing requires local `X_CONSUMER_KEY`, `X_CONSUMER_SECRET`, `X_ACCESS_TOKEN`, and `X_ACCESS_TOKEN_SECRET`, OAuth 1.0a user-context write permission, and separately billed X API access. X Premium does not cover API usage.

Local multi-provider delivery is sequential, not atomic. Inspect every selected account before recovery and target only the failed provider; X and LinkedIn have no idempotency guarantee here.

## License

This blog is licensed under the MIT License. You can find more information in the `LICENSE` file.

## Additional useful links

- graphics were taken from [the Svg Repo](https://www.svgrepo.com/) website
- favicon was created at [the Favicon](https://favicon.io/) website
- personal logo was created at [the Logo Maker](https://www.adobe.com/express/create/logo) website.
