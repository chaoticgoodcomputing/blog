// What the site sends another site when a note links to it: a mention excerpt, a page of its own
// holding only the note's paragraphs that link there, as one h-entry. The webmention's source is
// that page, not the note, since a receiver shows what the source's h-entry holds, and a page has
// one h-entry for every site it links to (webmention.io's parser, XRay, takes the h-entry whose
// `u-url` is the address it fetched). A reader who follows the mention from the other site is sent
// on to the note, at the first of those paragraphs.
//
// Read from the pages the build wrote (src/integrations/mention-excerpts.ts), so a link written as
// HTML in a note, or in an MDX note's JSX, is seen as well as one written in Markdown.

import { createHash } from "node:crypto"
import { parse, type HTMLElement } from "node-html-parser"
import { isExternal } from "./external-links.ts"

/** Where a mention excerpt's blocks are cut from: the nearest of these around a link. */
const BLOCKS = "p, li, blockquote, dd, dt, td, th, figcaption"

/**
 * The attribute that marks what in a note's body sends no webmention for its links: a widget that
 * links to every site it charts, say, which doesn't mention them in the note's words.
 */
export const NO_WEBMENTION = "data-no-webmention"

/** The address mention excerpts are under, from the site's root. */
export const MENTION_EXCERPTS = "/mentions"

/** The file the build writes beside the pages: every mention excerpt, for the deploy to send. */
export const MENTION_MANIFEST = "webmentions.json"

/** The note a page shows, as a mention excerpt needs it. */
export interface ExcerptNote {
  title: string
  /** Its address from the site's root. */
  url: string
  date: Date | undefined
}

/** One entry of the manifest: a mention excerpt, the page it mentions, and what it says. */
export interface ManifestEntry {
  /** The mention excerpt's whole address: the webmention's source. */
  source: string
  /** The page on another site the note links to: the webmention's target. */
  target: string
  /** The note's whole address. */
  note: string
  /** A hash of what the excerpt says, so the deploy sends it again when that changes. */
  digest: string
}

/**
 * The page on another site an external link goes to, as a webmention names it: the link's whole
 * address without its fragment, since a receiver knows its pages by their address.
 */
export function mentionTarget(href: string): string {
  const url = new URL(href)
  url.hash = ""
  return url.href
}

/**
 * A note page's external links, each target with the blocks of the note's body that link to it,
 * in the order the note has them, as HTML. The body is the page's `.prose` in `main`; a link the
 * site shell or the related content holds is not the note's, nor is one inside what is marked
 * `NO_WEBMENTION`. `site` is the site's address.
 */
export function linkingBlocks(html: string, site: string): Map<string, HTMLElement[]> {
  const page = parse(html)
  const body = page.querySelector("main article.prose")
  const found = new Map<string, HTMLElement[]>()
  if (!body) return found
  for (const link of body.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href")!
    if (!isExternal(href, site)) continue
    if (link.closest(`[${NO_WEBMENTION}]`)) continue
    const target = mentionTarget(href)
    const near = link.closest(BLOCKS)
    // A link outside any block, such as one on its own in a callout's title, is its own block.
    const block = near && isInside(near, body) ? near : link
    const blocks = found.get(target) ?? []
    if (!blocks.includes(block)) blocks.push(block)
    found.set(target, blocks)
  }
  return found
}

const isInside = (node: HTMLElement, root: HTMLElement): boolean => {
  for (let at: HTMLElement | null = node.parentNode; at; at = at.parentNode) if (at === root) return true
  return false
}

/**
 * A block as a mention excerpt holds it: without what the site draws for its own reader (the
 * new-tab icon and its label), and with every address whole, from the note's, since the receiver
 * shows it on another site.
 */
export function excerptBlock(block: HTMLElement, noteAddress: string): string {
  const copy = parse(block.outerHTML)
  for (const drawn of copy.querySelectorAll(".new-tab")) drawn.remove()
  for (const element of copy.querySelectorAll("[href], [src]")) {
    for (const name of ["href", "src"]) {
      const value = element.getAttribute(name)
      if (value === undefined) continue
      // The parser writes a value's quotes escaped, and not its ampersands.
      if (URL.canParse(value, noteAddress)) element.setAttribute(name, new URL(value, noteAddress).href.replace(/&/g, "&amp;"))
    }
  }
  const html = copy.toString()
  return block.tagName === "A" ? `<p>${html}</p>` : html
}

/** The mention excerpt's address, from the site's root, for a note's link to `target`. */
export function excerptAddress(noteUrl: string, target: string): string {
  const note = noteUrl === "/" ? "index" : noteUrl.slice(1)
  const hash = createHash("sha256").update(target).digest("hex").slice(0, 12)
  return `${MENTION_EXCERPTS}/${note}/${hash}`
}

/**
 * The note's address with a text fragment for the start of the first block, so the browser that
 * follows a mention scrolls to the paragraph that mentions the other site and marks it. A browser
 * without text fragments opens the note at the top.
 */
export function noteAtBlock(noteAddress: string, firstBlockText: string): string {
  const words = firstBlockText.trim().split(/\s+/).filter(Boolean).slice(0, 8)
  if (words.length === 0) return noteAddress
  // A text fragment's own delimiters, `-`, `,` and `&`, are written percent-encoded.
  const encoded = encodeURIComponent(words.join(" ")).replace(/-/g, "%2D").replace(/,/g, "%2C")
  return `${noteAddress}#:~:text=${encoded}`
}

const escape = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export interface ExcerptPage {
  /** The mention excerpt's whole address. */
  address: string
  /** The note's whole address. */
  noteAddress: string
  note: ExcerptNote
  /** The excerpt's blocks, as `excerptBlock` gives them. */
  blocks: string[]
  /** Where the browser goes: the note, at the first block. */
  continueTo: string
  author: { name: string; url: string }
  locale: string
}

/**
 * A mention excerpt's page. One h-entry: its `u-url` its own address, its name the note's title,
 * its content the blocks, its author the site's. It is no page of the site's own: it is not
 * indexed, its canonical page is the note, and a reader is sent on to the note at once.
 */
export function excerptPage(page: ExcerptPage): string {
  const { address, noteAddress, note, blocks, continueTo, author, locale } = page
  const published = note.date
    ? `<time class="dt-published" datetime="${note.date.toISOString()}">${escape(note.date.toISOString().slice(0, 10))}</time>`
    : ""
  return `<!doctype html>
<html lang="${escape(locale)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(note.title)}</title>
    <meta name="robots" content="noindex" />
    <link rel="canonical" href="${escape(noteAddress)}" />
    <script>location.replace(${JSON.stringify(continueTo).replace(/</g, "\\u003c")})</script>
    <style>
      :root { color-scheme: light dark; }
      body { max-width: 40rem; margin: 2rem auto; padding: 0 1rem; font-family: Georgia, serif; line-height: 1.5; }
    </style>
  </head>
  <body>
    <article class="h-entry">
      <h1 class="p-name">${escape(note.title)}</h1>
      <p>
        <a class="p-author h-card" href="${escape(author.url)}">${escape(author.name)}</a>
        ${published}
        <a class="u-url" href="${escape(address)}" hidden></a>
      </p>
      <div class="e-content">
${blocks.map((block) => `        ${block}`).join("\n")}
      </div>
      <p><a href="${escape(continueTo)}">Read the whole note</a></p>
    </article>
  </body>
</html>
`
}

/** A hash of what a mention excerpt says. */
export const excerptDigest = (note: ExcerptNote, blocks: string[]): string =>
  createHash("sha256")
    .update(JSON.stringify([note.title, note.date?.toISOString() ?? null, blocks]))
    .digest("hex")
    .slice(0, 16)
