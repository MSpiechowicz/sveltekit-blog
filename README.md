# Personal Blog

Hi! This is my personal blog. In case you want to fork it, please make sure to change the content to fit your needs.

## Dependencies

Below you can find list of the dependencies that are used to build this blog:

| Name        | URL                     |
| ----------- | ----------------------- |
| Bun         | https://bun.sh          |
| SvelteKit   | https://kit.svelte.dev  |
| TailwindCSS | https://tailwindcss.com |
| Shadcn/ui   | https://ui.shadcn.com   |
| Vite        | https://vitejs.dev      |
| mdsvex      | https://mdsvex.com      |

## Installation

Use Node.js 24 LTS for Vercel builds and Bun for dependency installation. Install the committed lockfile with `bun install --frozen-lockfile` in CI.

To start using this blog, you need to install the dependencies first. You can do that by running the following command:

```bash
bun install
```

Then you can start the development server by running the following command:

```bash
bun dev
```

Run `bun audit` after dependency updates. The `cookie` override keeps SvelteKit's cookie parser/serializer on patched 0.7.x releases because SvelteKit still declares the vulnerable 0.6.x range; remove it when upstream requires a patched release.

## Content

The content of this blog is stored in the `src/lib/blog` directory. You can add new blog posts by creating a new `.svx` file in that directory.

Article pages include server-rendered Open Graph and X card metadata using the post's `title`, `description`, and canonical URL. Add optional `image` and `imageAlt` frontmatter to choose an article-specific preview; otherwise the site logo is used. Store local preview images in `static/images/` and reference them as `/images/filename.png`. Image URLs are resolved against the configured site URL so social crawlers receive absolute URLs.

The Oh My Pi Usage Dashboard preview comes from that project's `docs/assets/dashboard.png` and shows synthetic usage data, not live account readings. Social platforms cache link cards, so deploying metadata changes may not immediately refresh cards on existing posts. Updating an existing article's image or description does not trigger another automatic announcement.

## Social publishing

The `Publish new blog posts` workflow announces a post only when a push to the repository's default branch introduces a previously absent `slug` in `src/lib/blog/**/*.svx`. It compares the push's `before` and `after` revisions, so an edit, removal, filename rename with the same slug, or unrelated push does not repost an entry. An initial push with an all-zero base and unavailable Git history fail closed rather than announcing the archive.

Both automatic publishing and manual Actions previews/recovery currently target Mastodon only. No X credentials or API credits are required. X support remains in the local publisher for later use, but is not exposed by the workflow.

The announcement is made from the post's human-written frontmatter `description`, not generic or AI-generated copy. It always keeps the canonical URL read from the existing site configuration, for example:

```text
My open-source Home Assistant integration brings Track Things records, automations, and guided Assist conversations into your home.

https://mspiechowicz.com/blog/track-things-home-assistant
```

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
```

The manual Actions preview also works before account setup. An unset Mastodon limit uses 500 characters for previews only; live Mastodon publishing still requires the configured instance limit. Pushes with no newly introduced slugs exit without credentials or network requests.

### Copy the X draft from GitHub Actions

Open **Actions → Publish new blog posts → select a run → Summary**. The **X drafts — copy and paste** section contains a separate plain-text block for each selected article, using its description and canonical link within X's weighted character limit. Copy the block into X and publish manually; no X API credentials or credits are needed.

Drafts appear for automatic new-post runs and manual previews/recovery. They are written before Mastodon publishing, so they remain available if publishing fails. A draft does not confirm deployment or delivery; check that the article is live before posting. GitHub's notification email links to the run, but does not contain the draft itself.

Merging workflow or publisher changes alone does not trigger automatic publishing. Existing article edits do not select a new slug, and the publisher exits without network requests when no new posts are selected. To preview an already published article, use manual `preview` mode; `live` is an explicit recovery action and can repost it.

### Deployment readiness and recovery

Automatic live delivery waits for every selected public canonical URL to return a successful response before any provider write. The bounded default is 300 seconds, polling every 10 seconds; `SOCIAL_READINESS_TIMEOUT_SECONDS` and `SOCIAL_READINESS_POLL_SECONDS` change those limits. This confirms reachability only, not that the response is the deployment revision just pushed.

For a confirmed provider failure, use **Actions → Publish new blog posts → Run workflow**. It starts in `preview` mode. Inspect your Mastodon account and the failed job first, preview the exact existing slug, then select `live` to recover that post. A rerun of an automatic live workflow intentionally stops instead of replaying writes.

A failure or interrupted request can occur after Mastodon already accepted a post, and replaying any uncertain write can create a duplicate. Mastodon's deterministic idempotency key has limited provider retention only. Always inspect the account before recovery.

### Optional X support (inactive)

The local publisher still supports `--provider x` or `--provider all`; omitting `--provider` selects both providers. X requires `X_CONSUMER_KEY`, `X_CONSUMER_SECRET`, `X_ACCESS_TOKEN`, and `X_ACCESS_TOKEN_SECRET` in the local environment, OAuth 1.0a user-context write permission, and separately billed X API access. X Premium does not cover API usage. Enabling X in Actions later also requires an explicit workflow change to provide its secrets and select it.

When using both providers locally, delivery is not atomic. Inspect both accounts before recovery and target only the failed provider; X has no durable idempotency guarantee here.

## License

This blog is licensed under the MIT License. You can find more information in the `LICENSE` file.

## Additional useful links

- graphics were taken from [the Svg Repo](https://www.svgrepo.com/) website
- favicon was created at [the Favicon](https://favicon.io/) website
- personal logo was created at [the Logo Maker](https://www.adobe.com/express/create/logo) website.
