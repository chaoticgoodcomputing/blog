// A feed item's content: its note's page as the build wrote it, its body alone, as HTML a feed
// reader can show anywhere. It is what a reader of the feed reads in place of the page, and what a
// site that copies the feed (DEV's import of it) publishes, so it ends with a link to the page,
// where the note can be answered (Discussion.astro). A cross-post is the same body as Markdown, for
// a site the note is posted to by hand or by its API (scripts/crosspost.ts).
//
// It is made from the page, not the note's source, as its Markdown copy is (./markdown-copies.ts),
// and leaves out what the copy does: what is around the body, and what only a pointer or a script
// uses. Its links and images are whole addresses, so they lead back to the site from anywhere.
//
// Where it is read, nothing of the site's runs and none of its styles apply, so it is plain HTML:
// a drawing is its PNG where it has one, since not every reader shows an SVG (DEV's image proxy
// can't); a callout is a quote, headed by its title; what only works on the page (a widget, a diagram, an
// annotated document's annotations) is a quote that says so, and links to the page; a link to a
// note the site doesn't publish is its text; and nothing keeps a style of its own.

import { parse, type HTMLElement } from "node-html-parser"
import { site as siteConfig } from "../site.config.ts"
import { NOT_TEXT, toMarkdown } from "./markdown-copies.ts"
import type { Note } from "./notes.ts"

/** What only works on the page: a widget, a Mermaid diagram, an annotated document's annotations. */
const INTERACTIVE = ["astro-island", "mermaid-diagram", "section.annotations"]

/** What a page draws in one colour scheme only: a drawing's dark version, beside its light one. */
const ONE_SCHEME = [".excalidraw-dark"]

/** The attributes that hold an address, and those that hold a list of them with sizes. */
const ADDRESSES = ["href", "src", "poster"]
const SOURCE_SETS = ["srcset"]

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function whole(address: string, base: URL): string {
  if (address.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(address)) return address
  try {
    return new URL(address, base).href
  } catch {
    return address
  }
}

/** What of a note the content needs: its title and its page's address. */
type ContentNote = Pick<Note, "title" | "url">

/**
 * The body of `note`'s page, from `html`, its page as built, as plain HTML: the page's `article`,
 * else its `main`, without the furniture around it. `site` is the site's address.
 */
export function plainBody(note: ContentNote, html: string, site: URL, drawingPngs: Map<string, string> = new Map()): HTMLElement {
  // A code block's highlighting is elements too, which the parser keeps as text by default.
  const root = parse(html, { blockTextElements: { script: true, noscript: true, style: true } })
  const body: HTMLElement | null = root.querySelector("main article.prose") ?? root.querySelector("main")
  if (!body) throw new Error(`${note.url} has no main element to put in the feed`)
  const page = new URL(note.url, site)

  const notice = `<blockquote><p>This interactive content can only be viewed on the <a href="${escape(page.href)}">live site</a>.</p></blockquote>`
  for (const selector of INTERACTIVE) for (const element of body.querySelectorAll(selector)) element.replaceWith(notice)
  for (const selector of [...NOT_TEXT, ...ONE_SCHEME]) for (const element of body.querySelectorAll(selector)) element.remove()

  // A callout is a quote: its title, in bold, where it is more than the name of its kind, then its
  // content. Innermost first, so a callout in a callout is a quote in a quote.
  for (const callout of body.querySelectorAll("[data-callout]").reverse()) {
    const kind = callout.getAttribute("data-callout") ?? ""
    const title = callout.querySelector(".callout-title")?.text.trim() ?? ""
    const content = callout.querySelector(".callout-content")?.innerHTML.trim() ?? ""
    const heading = title && title.toLowerCase() !== kind.toLowerCase() ? `<p><strong>${escape(title)}</strong></p>` : ""
    callout.replaceWith(`<blockquote>${heading}${content}</blockquote>`)
  }

  // A drawing's SVG is its PNG, where it has one (src/lib/drawings.ts).
  for (const image of body.querySelectorAll("img")) {
    const png = drawingPngs.get(image.getAttribute("src") ?? "")
    if (png) image.setAttribute("src", png)
  }

  // A link to a note the site doesn't publish leads nowhere: it is its text.
  for (const link of body.querySelectorAll("a.is-unresolved")) link.replaceWith(link.innerHTML)

  for (const element of body.querySelectorAll("*")) {
    for (const name of ADDRESSES) {
      const value = element.getAttribute(name)
      if (value !== undefined) element.setAttribute(name, whole(value, page))
    }
    for (const name of SOURCE_SETS) {
      const value = element.getAttribute(name)
      if (value === undefined) continue
      const sources = value.split(",").map((source) => {
        const [address = "", ...size] = source.trim().split(/\s+/)
        return [whole(address, page), ...size].join(" ")
      })
      element.setAttribute(name, sources.join(", "))
    }
    // A link within the page leads nowhere outside it: it is its text.
    if (element.tagName === "A" && element.getAttribute("href")?.startsWith("#")) element.removeAttribute("href")
  }

  return body
}

/** What the content ends with: where the note was first published, and can be answered. */
const firstPublished = (title: string) =>
  `${title} was first published on ${siteConfig.title}, where you can reply to it on Bluesky or from your own site.`

/** The content of `note`'s item: its page's plain body, keeping no style of its own, then a link to the page. */
export function feedContent(note: ContentNote, html: string, site: URL, drawingPngs?: Map<string, string>): string {
  const body = plainBody(note, html, site, drawingPngs)
  for (const element of body.querySelectorAll("*")) {
    for (const name of Object.keys(element.attributes)) {
      if (name === "style" || name.startsWith("data-")) element.removeAttribute(name)
    }
  }
  const page = new URL(note.url, site).href
  const link = `<a href="${escape(page)}">${escape(note.title)}</a>`
  return `${body.innerHTML.trim()}\n<hr />\n<p>${firstPublished(link)}</p>`
}

/**
 * `note`'s cross-post: its page's plain body as Markdown, as its Markdown copy is written
 * (./markdown-copies.ts), then a link to the page.
 */
export function crosspostMarkdown(note: ContentNote, html: string, site: URL, drawingPngs?: Map<string, string>): string {
  const page = new URL(note.url, site).href
  const text = toMarkdown(plainBody(note, html, site, drawingPngs).innerHTML, site)
  return `${text}\n\n---\n\n*${firstPublished(`[${note.title.replace(/[[\]]/g, "")}](${page})`)}*\n`
}
