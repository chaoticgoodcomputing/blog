---
status: accepted
date: 2026-09-24
---

# Mirrors are pinned, and a missing one degrades the page instead of failing the build

`cgc-annotator` fetches each annotation page's source document at build time and emits its own
**mirror**. It keeps that mirror in a cache and never fetches the URL again. When no mirror is
available, the page still builds. Only the viewer degrades: the annotations render with the
passages they quote, plus a link to read along at the source URL. The build logs a warning and
does not fail.

## Why

**Pinning is the correct behaviour, not only the fast one.** Annotations are anchored to text
positions in one specific file, and each carries PDF.js's `documentFingerprint`. If the file at a
URL changes, the anchors break whether we fetch the new copy or not, so the first copy fetched
stays the one to serve. A cache hit never touches the network. The only way to refresh a mirror
is on purpose: evict its cache entry.

**Failing the build would spread someone else's flakiness.** Elsewhere we fail the build rather
than the runtime (`cgc-mdx` fails on an unresolved import). But an annotator depends on content it
doesn't own. A source host that blocks CI machines, such as a PDF behind Cloudflare, or a private
PDF the build can't reach, would make an annotation page impossible to build through no fault of
its author. A plugin that passes that fragility on to every site using it fails the shareability
test in [ADR-0001](../../../../../docs/adr/0001-customization-through-plugins.md). The reader
loses the PDF, not the notes.

## Considered options

- **Committing mirrors to the repo.** Rejected. Third-party binaries never go on `main`.
  Carrying them on the deploy branch as build output is accepted only as a temporary necessity.
- **Revalidating on each build (ETag, TTL).** Rejected. It spends network on every build to fetch
  a changed document the annotations no longer match.
- **Failing the build when a fetch fails.** Rejected, for the reason above.

## Consequences

- **The build doesn't know whether a mirror exists, and doesn't need to.** The page renders
  before the emitter fetches anything, so the viewer decides in the browser whether to fall back.
  The same fallback covers a mirror that fails to load at runtime.
- **A mirror is named by a hash of its source URL**, with no extension. That is the only
  identity the page has at render time. Mirrors are fetched only from JS and never linked, and
  they stay out of search engines through the site's `robots.txt`, which the plugin doesn't own.
- **A future slice is taken from a pinned mirror**, so several annotation pages sharing one
  source document never trigger a second fetch.
