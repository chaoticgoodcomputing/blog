// The differences between the v4 and v5 builds of the real site that a decision expects.
//
// Every entry cites the ticket that decided it (`ticket`), and says what it accepts (`summary`) in
// words a reader of the report can check against that ticket. The report refuses to run with an
// entry that cites none. A difference no entry allows fails the report: to accept one, get it
// decided on a ticket first, then add the entry here citing it.
//
// `allows(difference, { v4, v5, caseSensitive, vault })` sees one difference (compare.mjs documents
// their shapes), both sites as read.mjs reads them, and the vault directory they were built from.
// The first entry that allows a difference is the one the report cites, so a narrow entry goes
// before a broad one it overlaps. An entry that accepts a moved page only because its old URL
// redirects says so with `needsRedirect`: where the filesystem can hold no such redirect, the report
// can't pass on it unseen.
import fs from "node:fs"
import path from "node:path"

const sameSet = (values, expected) => values.length === expected.length && expected.every((value) => values.includes(value))

// Whether a tag page's URL is served from that tag's description file in the vault (#43):
// tags/<t>/index.md serves /tags/<t>/ until the cutover rename, and tags/<t>.md serves /tags/<t>
// after it, where the tag's own page shows its description (#72).
function isDescribedTag(url, vault) {
  const [, tag, slash] = /^\/tags\/(.+?)(\/?)$/.exec(url) ?? []
  if (!tag) return false
  const folderNote = fs.existsSync(path.join(vault, "tags", tag, "index.md"))
  return slash ? folderNote : folderNote || fs.existsSync(path.join(vault, "tags", `${tag}.md`))
}

// Whether a URL is a plugin note's, /plugins/<pkg>, with the plugin's README linked into the vault
// at plugins/<pkg>.md (#48).
function isPluginNote(url, vault) {
  const [, pkg] = /^\/plugins\/([^/]+)$/.exec(url) ?? []
  return Boolean(pkg) && fs.existsSync(path.join(vault, "plugins", `${pkg}.md`))
}

// Whether a head difference is one value of a page only v5 serves (compare.mjs compares its head with
// an empty one), as a page search engines index at its own URL carries it: a canonical naming that
// URL, and no noindex. Its other values, such as article:* and JSON-LD, have nothing in v4 to differ
// from, so they are accepted with the page.
function indexedAtOwnUrl(d, { v4, v5 }) {
  if (d.area !== "head" || v4.pages.has(d.url) || d.removed.length) return false
  if (d.field === "canonical") return sameSet(d.added, [`${v5.origin}${d.url}`])
  if (d.field === "robots") return !d.added.includes("noindex")
  return d.field !== "refresh"
}

// The vault's .mdx pages when the owner moved them to their .mdx URLs, on 2026-09-26.
const MDX_PAGES = new Set([
  "/resume",
  "/content/notes/ants-in-the-neighborhood",
  "/content/notes/mdx-widgets-test",
  "/content/notes/roll-advantage",
  "/content/notes/scratch/dice-widget",
])

export const ALLOWLIST = [
  {
    ticket: 48,
    summary:
      "/widgets/README is retired, with no redirect: its reference moves into the MDX plugin's note (/plugins/quartz-mdx since #94), whose widgets/README alias v5 lowercases, so only /widgets/readme redirects there. The old URL 404s after cutover, and leaves the sitemap and RSS.",
    allows: (d, { v5 }) =>
      d.url === "/widgets/README" &&
      ((d.area === "url" && (d.change === "removed" || d.change === "moved")) ||
        ((d.area === "sitemap" || d.area === "rss") && d.change === "removed") ||
        (d.area === "head" && d.field === "refresh" && d.removed.length === 0 && sameSet(d.added, [`${v5.origin}/plugins/quartz-mdx`]))),
  },
  {
    ticket: 48,
    summary:
      "A shareable plugin's README is published as its plugin note at /plugins/<pkg>, listed in the sitemap and indexed like v4's other notes: its canonical is its own URL, and it is not noindex. v4 leaves out quartz-mdx's until cutover, since its alias would race v4's own /widgets/README. Only a note the vault links at plugins/<pkg>.md.",
    allows: (d, context) =>
      isPluginNote(d.url, context.vault) &&
      ((((d.area === "url" && d.kind === "page") || d.area === "sitemap") && d.change === "added") || indexedAtOwnUrl(d, context)),
  },
  {
    ticket: 93,
    summary:
      "A plugin converted to an npm package moves its plugin note from /plugins/cgc-<name> to /plugins/quartz-<name>, its package's name, with no redirect: the old URL leaves the site and the sitemap. Only where the vault links plugins/quartz-<name>.md and no longer links plugins/cgc-<name>.md.",
    allows: (d, { vault }) => {
      const [, name] = /^\/plugins\/cgc-([^/]+)$/.exec(d.url) ?? []
      return (
        Boolean(name) &&
        !isPluginNote(d.url, vault) &&
        isPluginNote(`/plugins/quartz-${name}`, vault) &&
        ((d.area === "url" && d.kind === "page" && d.change === "removed") || (d.area === "sitemap" && d.change === "removed"))
      )
    },
  },
  {
    ticket: 23,
    summary:
      "v5 lowercases page URLs, and stock alias-redirects (enableCaseRedirects, on permanently) serves a redirect at each mixed-case v4 URL. The ticket counted ten outside scratch/; the vault now has more, mostly private.",
    needsRedirect: true,
    allows: (d) =>
      d.area === "url" && d.change === "moved" && d.kind === "page" && sameSet(d.how, ["lowercase"]) && d.redirect !== "missing",
  },
  {
    ticket: 53,
    summary:
      "The owner's 2026-09-26 decision (bug A, overruling the clean URLs of #23 and #65): the vault's six .mdx pages are served at their .mdx URLs, as stock page types keep a file's extension (cgc-mdx ADR-0005), and each v4 URL is cgc-mdx's alias, which alias-redirects redirects there. Only these six, and only with the redirect seen.",
    needsRedirect: true,
    allows: (d) =>
      d.area === "url" && d.change === "moved" && d.kind === "page" && sameSet(d.how, ["mdx-extension"]) && d.redirect === "verified" && MDX_PAGES.has(d.url),
  },
  {
    ticket: 26,
    summary:
      "The owner's 2026-09-26 decision: v5 lowercases asset URLs as it does page URLs, and the old mixed-case asset URLs are given up. GitHub Pages can't redirect a file, and a meta refresh can't stand in for an image or a PDF. Only a file moved by lowercasing alone.",
    allows: (d) => d.area === "url" && d.change === "moved" && d.kind === "file" && sameSet(d.how, ["lowercase"]),
  },
  {
    ticket: 81,
    summary:
      "The owner's 2026-09-26 decision: the notebook /assets/textimagegen/textimagegen.ipynb moves to index.ipynb, as a folder note, and the old URL is given up.",
    allows: (d) =>
      d.area === "url" && d.change === "moved" && d.kind === "file" && sameSet(d.how, ["folder-note"]) && d.url === "/assets/textimagegen/textimagegen.ipynb",
  },
  {
    ticket: 81,
    summary:
      "The owner's 2026-09-26 decision: the ants article, which has no prose of its own, gives its RSS reading time as 0 min where v4 gave 1 min. The description is otherwise unchanged.",
    allows: (d) =>
      d.area === "rss" &&
      d.change === "changed" &&
      d.field === "description" &&
      d.url === "/content/notes/ants-in-the-neighborhood" &&
      d.removed.length === 1 &&
      d.added.length === 1 &&
      d.removed[0].replace(/\(1 min read\)$/, "(0 min read)") === d.added[0],
  },
  {
    ticket: 42,
    summary: "Folder pages are dropped and folder-page is disabled: they were never in the sitemap, and nothing links to them.",
    allows: (d, { v4 }) =>
      d.area === "url" && d.change === "removed" && d.kind === "page" && d.url.endsWith("/") && /^Folder: /.test(v4.pages.get(d.url)?.title ?? ""),
  },
  {
    ticket: 43,
    summary: "A tag's canonical URL is /tags/<t>. v4's /tags/<t>/ moves there, and the old URL gets no redirect.",
    allows: (d) => d.area === "url" && d.change === "moved" && d.kind === "page" && sameSet(d.how, ["tag-slash"]),
  },
  {
    ticket: 43,
    summary:
      "A tag description file is its tag's page, even for a tag no page uses, indexed at its own URL as v4's tag pages are. It stays at /tags/<t>/ until the cutover rename to tags/<t>.md, then serves /tags/<t>. Only a tag with a description file in the vault.",
    allows: (d, context) =>
      isDescribedTag(d.url, context.vault) && ((d.area === "url" && d.change === "added" && d.kind === "page") || indexedAtOwnUrl(d, context)),
  },
  {
    ticket: 37,
    summary:
      "Annotation PDFs are served as mirrors, named by a hash of their source URL with no extension, under /assets/annotated-documents/. The old PDF URLs are given up.",
    allows: (d) =>
      d.area === "url" &&
      d.url.startsWith("/assets/annotated-documents/") &&
      (((d.change === "removed" || d.change === "moved") && /\.pdf$/i.test(d.url)) ||
        (d.change === "added" && /^\/assets\/annotated-documents\/[^/.]+$/.test(d.url))),
  },
  {
    ticket: 28,
    summary: "Private pages are noindex without v4's nofollow, so the stubs' links pass value to public pages.",
    allows: (d) => d.area === "head" && d.field === "robots" && sameSet(d.removed, ["nofollow"]) && d.added.length === 0,
  },
  {
    ticket: 28,
    summary: "The private tag's own page, a list of private stubs, is treated as a private page: noindex, and out of the sitemap.",
    allows: (d) =>
      /^\/tags\/private\/?$/.test(d.url) &&
      ((d.area === "head" && d.field === "robots" && sameSet(d.added, ["noindex"]) && d.removed.length === 0) ||
        (d.area === "sitemap" && d.change === "removed")),
  },
]

// Not allowances. Each labels differences an open ticket is expected to close, so the report can say
// what it is waiting on. A pending difference still fails the report.
export const PENDING = []

/** Throws unless every entry cites a ticket and says what it accepts. */
export function checkAllowlist(entries = ALLOWLIST) {
  entries.forEach((entry, i) => {
    if (!Number.isInteger(entry.ticket) || entry.ticket <= 0) throw new Error(`allowlist entry ${i + 1} cites no ticket`)
    if (typeof entry.summary !== "string" || !entry.summary.trim()) throw new Error(`allowlist entry ${i + 1} (#${entry.ticket}) has no summary`)
    if (typeof entry.allows !== "function") throw new Error(`allowlist entry ${i + 1} (#${entry.ticket}) has no allows()`)
  })
}
