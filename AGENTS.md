# Article and social-copy authoring

When creating or editing an article in `src/lib/blog/**/*.svx`, read the complete article and author or update its social announcements as part of the same work. Preserve the article's SEO `description`; social copy is a separate editorial field, not a reason to rewrite search metadata. Preserve unrelated metadata and article content.

## Frontmatter contract

Add a `social` YAML mapping containing exactly three nonempty string fields: `mastodon`, `x`, and `linkedin`. Use a folded YAML block scalar (`>-`) for each value. Although the publisher accepts articles without this optional mapping, agents creating or editing articles must supply all three fields together.

- `mastodon`: natural, conversational copy of no more than 350 characters before the appended link.
- `x`: concise, direct copy of no more than 240 weighted characters before the appended link; prefer 210 or fewer plain characters to leave comfortable room. Non-ASCII characters can have different platform weights, so plain character counts are not always sufficient.
- `linkedin`: a personal post in the author's own first-person voice, written the way someone talks to colleagues about their work rather than as a summary of the article. Open with the thought, opinion or reason behind the work, not with a greeting, a launch announcement or a description of the article ("Hello, ...", "I'm happy to share", "The article describes ..."). Write 2–5 short paragraphs, usually around 600–1,500 characters, and separate paragraphs with a blank line inside the folded scalar; the publisher keeps those breaks for LinkedIn. Contractions, a short aside and an honest opinion are welcome when the article or the author supports them; mark opinions as opinions. Prefer one or two concrete details over an inventory of features, and end with a natural sentence about what the post covers or why it might interest the reader. Use a shorter post when a sparse article cannot support more without padding or invention.

Write prose only in these values. Do not include the canonical article URL, a placeholder for it, or a Markdown link to it. The publisher appends a blank line and the canonical URL for each platform; account for that addition when checking final platform limits. Keep links out of the authored copy rather than duplicating the appended article link.

## Editorial expectations

- Tailor each platform's copy to its audience rather than duplicating one announcement three times. Mastodon and X may be informal and brief; LinkedIn is longer and more reflective, but still personal rather than corporate.
- Consult nearby articles and recent social copy before writing. Vary the opening, emphasis and sentence structure across posts. Do not repeatedly begin with "I created", "I built", or a generic launch announcement. Do not open LinkedIn posts with a greeting or a recurring formula.
- Ground every statement in the article. Do not invent results, adoption, performance improvements, supported features, guarantees or testing claims. Keep plans distinct from completed work and preserve qualifications such as unverified hardware or platform support.
- Use a factual human voice, not promotional superlatives, forced engagement questions or padded summaries. First-person observations are appropriate when supported by the article. Historical articles describe the state at the time of writing, not an independently verified current product state.
- Review and update all three fields when article edits change the facts or emphasis. Keep one intentional announcement per platform; multiple runtime variants are not needed.

## Publishing and verification

The agent authors this copy during article work and commits it as content. No runtime LLM, generated template rotation or random canned openings are required.

Only Mastodon is automated. X and LinkedIn announcements are summary drafts for manual review and posting, not invitations to add automated publishing to those platforms.

Never publish a live social post merely to verify changes. Use dry-run or local preview paths and inspect the rendered announcements, including the appended URL, instead.
