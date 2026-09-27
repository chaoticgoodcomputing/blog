---
status: accepted
date: 2026-09-26
---

# `.mdx` pages at their own slugs, with their clean URLs as aliases

_Supersedes [ADR-0004](./0004-mdx-pages-at-their-clean-urls.md). The owner decided it on
2026-09-26, reviewing the v5 site, after bug A turned up on Linux. It overrules the clean URLs that
[#23](https://github.com/chaoticgoodcomputing/blog/issues/23) and
[#65](https://github.com/chaoticgoodcomputing/blog/issues/65) chose._

An `.mdx` page's slug is exactly what core's `slugifyFilePath` gives its file, extension kept:
`resume.mdx` lives at `/resume.mdx`, and `lab/life.mdx` at `/lab/life.mdx`. That is the ecosystem's
convention. Stock `canvas-page` slugs `foo.canvas` as `foo.canvas`
([pageType.ts:66](https://github.com/quartz-community/canvas-page/blob/8699230b7728cdd0a0ae3603c7ba18f48d3d55a4/src/pageType.ts#L66)),
and `bases-page` does the same for `.base`. The page's **clean URL**, its path without the extension,
where v4 published it, still works. `cgc-mdx` adds it to the page's aliases, so stock
`alias-redirects` writes a redirect from `/resume` to `/resume.mdx`. Links written without the
extension go to the page itself, not through the redirect.

> Links to stock plugins point at the commits their installed 1.0.0 releases were tagged from:
> `alias-redirects` at `96411dc`, `canvas-page` at `8699230`. Links to Quartz 5 point at upstream
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e) (v5.0.0).

## Why

**Bug A: stock alias-redirects wrote a redirect stub over every `.mdx` page's `.mdx` URL.**
`alias-redirects` has `enableCaseRedirects` on by default
([emitter.ts:32](https://github.com/quartz-community/alias-redirects/blob/96411dcff962b50609754cacc88c33b7cbd581df/src/emitter.ts#L32)),
and the site turns it on for good (#23). It only writes case redirects where the output filesystem
is case-sensitive: Linux, CI and production, never macOS
([emitter.ts:172-173](https://github.com/quartz-community/alias-redirects/blob/96411dcff962b50609754cacc88c33b7cbd581df/src/emitter.ts#L172-L173)).
For each page, it works the case-preserved slug out again from `relativePath`, keeping any
extension but `.md` or `.html`
([emitter.ts:86-90](https://github.com/quartz-community/alias-redirects/blob/96411dcff962b50609754cacc88c33b7cbd581df/src/emitter.ts#L86-L90)),
and writes a redirect wherever that differs from the page's slug
([emitter.ts:175-186](https://github.com/quartz-community/alias-redirects/blob/96411dcff962b50609754cacc88c33b7cbd581df/src/emitter.ts#L175-L186)).
Under ADR-0004, `resume.mdx`'s slug was `resume`. The recomputed one is `resume.mdx`, so every `.mdx`
page got a stub at `<name>.mdx.html` that sent it back to the clean URL: 9 in the fixture, 6 on the
real site. That was unseen on macOS and failed the suite and the acceptance report on Linux.

**Conforming removes the collision instead of working around it.** With the page at core's slug,
the recomputed slug is the same, and no case redirect is written for a lowercase file. A mixed-case
`.mdx` file gets a case redirect at its own mixed-case `.mdx` URL, as a mixed-case `.md` file does.
Nothing has to be listed under another slug any more either. ADR-0004's rewrite of `ctx.allSlugs`
in place, in every copy of the build context, is gone, and so is the reason for the transformer's
`markdownPlugins` hook and the emitter's `externalResources` call.

**The clean URL is an alias, added by the plugin.** The six vault pages have been linked at their
clean URLs for years, from the site and from elsewhere. An alias is how Quartz already redirects
one URL to a page: `alias-redirects` writes a redirect for every entry in a page's `aliases`
([emitter.ts:150-162](https://github.com/quartz-community/alias-redirects/blob/96411dcff962b50609754cacc88c33b7cbd581df/src/emitter.ts#L150-L162)),
on any filesystem. `cgc-mdx` adds it itself, behind the `cleanUrlAliases` option, which is on by
default. Editing the six notes' frontmatter was the other way. The plugin way was chosen because:

- **The alias follows from the file's name, not from the note.** Every `.mdx` page has a clean URL,
  and the plugin is what knows the page type moved it. A note added later gets its redirect without
  anyone remembering to write one.
- **The notes stay the writer's.** An `aliases:` entry in six notes would say nothing about the note
  and would have to be kept in step with each file's name by hand.
- **A shareable plugin can't ask a vault to edit its notes.** A site that installs `cgc-mdx` fresh,
  with no v4 URLs to keep, turns the option off.

The alias is left out when a page of the site already lives at the clean URL, such as `notes/x.md`
beside `notes/x.mdx`: the redirect would overwrite that page.

**Links go to the page, not through the redirect.** A link written with the extension,
`[[/content/notes/dice.mdx|…]]`, `[the cv](/cv.mdx)` or `[relative](cv.mdx)`, reaches the page through `crawl-links` alone, since
`ctx.allSlugs` lists the page at that slug. A link written without it, `[[/cv]]` or `[[life]]`,
names the clean URL, where `crawl-links` finds no page. It would land on the redirect, and the
backlinks and graph edges built from its target would name a page that doesn't exist. So the
transformer, still ordered before `crawl-links` (45 to 60), adds `.mdx` to such a link when it
names an `.mdx` page and no other page. A link from `/`, `./` or `../` names one path, which has to
match exactly. A bare one is matched as `crawl-links` could read it, from the root or, under
`shortest`, by the end of a slug.

## Considered alternatives

- **Keep clean slugs, and keep alias-redirects from writing the stubs.** It would need either a fork
  or patch of `alias-redirects`, which the owner ruled out, or `enableCaseRedirects` off, which #23
  needs on for v4's 89 mixed-case URLs. And a page type whose slugs disagree with core's
  `slugifyFilePath` would meet the next stock plugin that works a slug out from `relativePath`.
- **A vendored change to `slugifyFilePath`** to strip `.mdx`, as v4's fork did. ADR-0001 keeps
  vendored changes to what no plugin can do, and it would still disagree with `alias-redirects`, which
  carries its own copy of the function.
- **`aliases:` in each of the six notes.** See above.
- **Leave links without the extension to the redirect.** The reader would still arrive, one hop
  later, but the backlinks and the graph would lose the page.

## Consequences

- **The public URLs of the six vault pages change,** to `/resume.mdx`,
  `/content/notes/ai-beat-us.mdx`, `/content/notes/ants-in-the-neighborhood.mdx`,
  `/content/notes/mdx-widgets-test.mdx`, `/content/notes/roll-advantage.mdx` and
  `/content/notes/scratch/dice-widget.mdx`. Their v4 URLs redirect there. The sitemap, the feed and
  each page's canonical name the new URL. The acceptance report classes each as moved
  (`mdx-extension`) with its redirect verified, and its allowlist accepts exactly these six.
- **The host must serve `<name>.mdx.html` at `/<name>.mdx`,** as it already has to for canvas and
  base pages. The test harness does (`fileFor` in `tests/harness/site.mjs`).
- **A bare wikilink with no display text,** `[[lab/life]]`, shows its path as written: `crawl-links`
  counts the link as aliased once its target differs from its text, so its `prettyLinks` no longer
  shortens it to `life`. No vault link is written that way.
- **The transformer must still run before `crawl-links`,** as under ADR-0004.
- **A transclusion reaches the page through its inner link.** `obsidian-flavored-markdown` builds
  `![[page]]` as a blockquote carrying the target in `data-url`, with a link inside it. The link
  plugin rewrites that inner link to the `.mdx` slug, `crawl-links` gives it a `data-slug`, and the
  renderer finds the page by that, so the fixture's `![[mdx-article]]` transcludes the `.mdx` body.
  Only the blockquote's `data-url` keeps the clean URL. No vault page transcludes an `.mdx` page.
- **Out of scope:** an `index.mdx` page, whose slug is `…/index.mdx`, and what it means for folder
  URLs (the `is-index` question).
