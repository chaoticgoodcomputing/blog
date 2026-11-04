// Each indexable note's page as Markdown, at its address with `.md` after it, and `/llms.txt`, the
// site's index of them (https://llmstxt.org). They are for agents: a page's HTML is mostly the site
// around it, its styles and its icons, and a copy is its text alone. The search integration's
// pages are the ones copied (src/integrations/markdown-copies.ts writes them).
//
// A copy is made from the page as the build wrote it, not from the note's source, so it says what
// the page says: an annotated document's annotations, an embedded note, a widget's fallback text.
// The robots.txt asks search engines' crawlers not to fetch the copies, so a copy is never a search
// result in its page's place (public/robots.txt).

import { parse, type HTMLElement } from "node-html-parser"
import TurndownService from "turndown"
// @ts-expect-error: the plugin ships no types.
import { gfm } from "@joplin/turndown-plugin-gfm"
import { site as siteConfig, seo } from "../site.config.ts"
import type { Note } from "./notes.ts"
import { restoreFootnotes } from "./sidenotes.ts"
import { isIndexableAt, tagAt } from "./page.ts"

/** The address of a page's copy: its address with `.md` after it, and the home page's `/index.md`. */
export function markdownCopyUrl(url: string): string {
  return url === "/" ? "/index.md" : `${url}.md`
}

/**
 * The notes with a copy: those whose page is indexable. A tag's description note has none: its page
 * is the tag's, a listing of the posts under it, which llms.txt lists itself.
 */
export function copiedNotes(notes: Note[]): Note[] {
  return notes.filter((note) => tagAt(note.url) === undefined && isIndexableAt(note.url, notes) === true)
}

// What is no part of a page's text: the furniture under its title (its tags, date, reading time and
// share panel), what follows its body, and what only a pointer or a script uses. The feed's content
// leaves out the same (src/lib/feed-content.ts).
export const NOT_TEXT = [
  "script",
  "style",
  "svg",
  "button",
  "template",
  ".tag-list",
  ".date-and-reading-time",
  ".share",
  ".after-body",
  ".heading-anchor",
  ".new-tab",
  // Icons, and KaTeX's drawing of its math: the math rule below reads the TeX KaTeX keeps beside it.
  '[aria-hidden="true"]',
]

function converter(site: URL): TurndownService {
  const service = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-", emDelimiter: "*" })
  service.use(gfm)

  // A highlighted block is its code as written, in a fence named by its language.
  service.addRule("highlighted code", {
    filter: (node) => node.nodeName === "PRE" && node.querySelector("code") !== null,
    replacement: (_content, node) => {
      const pre = node as unknown as globalThis.HTMLElement
      const code = pre.textContent?.replace(/\n$/, "") ?? ""
      const language = pre.getAttribute("data-language") ?? ""
      const fence = code.includes("```") ? "````" : "```"
      return `\n\n${fence}${language === "plaintext" ? "" : language}\n${code}\n${fence}\n\n`
    },
  })

  // Math is the TeX it was written in, which KaTeX keeps beside what it draws.
  service.addRule("math", {
    filter: (node) => (node as unknown as globalThis.HTMLElement).classList?.contains("katex"),
    replacement: (_content, node) => {
      const element = node as unknown as globalThis.HTMLElement
      const tex = element.querySelector('annotation[encoding="application/x-tex"]')?.textContent?.trim() ?? ""
      const display = element.parentElement?.classList.contains("katex-display")
      return display ? `\n\n$$\n${tex}\n$$\n\n` : `$${tex}$`
    },
  })

  // A callout is the quote Obsidian writes it as: `> [!kind] Title`.
  service.addRule("callout", {
    filter: (node) => (node as unknown as globalThis.HTMLElement).hasAttribute?.("data-callout"),
    replacement: (content, node) => {
      const kind = (node as unknown as globalThis.HTMLElement).getAttribute("data-callout")
      const lines = content.trim().split("\n")
      return `\n\n${[`[!${kind}] ${lines[0] ?? ""}`.trimEnd(), ...lines.slice(1)].map((line) => `> ${line}`.trimEnd()).join("\n")}\n\n`
    },
  })

  // Links and images are whole addresses, so a copy read anywhere leads back to the site.
  const whole = (address: string) => {
    try {
      return new URL(address, site).href
    } catch {
      return address
    }
  }
  service.addRule("whole links", {
    filter: (node) => node.nodeName === "A" && (node as unknown as globalThis.HTMLElement).getAttribute("href") !== null,
    replacement: (content, node) => {
      const href = (node as unknown as globalThis.HTMLElement).getAttribute("href")!
      const text = content.trim()
      if (!text) return ""
      return href.startsWith("#") ? text : `[${text}](${whole(href)})`
    },
  })
  service.addRule("whole images", {
    filter: "img",
    replacement: (_content, node) => {
      const image = node as unknown as globalThis.HTMLElement
      const src = image.getAttribute("src")
      return src ? `![${(image.getAttribute("alt") ?? "").replace(/[[\]]/g, "")}](${whole(src)})` : ""
    },
  })
  return service
}

/** What a copy says of its note above its text: what it is, where its page is, and when it was written. */
export function frontOf(note: Note, site: URL): string {
  const lines = [`# ${note.title}`, ""]
  if (note.description) lines.push(`> ${note.description.trim().replace(/\s*\n\s*/g, " ")}`, "")
  lines.push(`- Page: ${new URL(note.url, site).href}`)
  lines.push(`- Author: ${siteConfig.author.name}`)
  if (note.date) lines.push(`- Published: ${note.date.toISOString().slice(0, 10)}`)
  lines.push(`- Updated: ${note.modified.toISOString().slice(0, 10)}`)
  if (note.tags.length) lines.push(`- Tags: ${note.tags.join(", ")}`)
  return lines.join("\n")
}

/**
 * A page's copy: what it says of its note, then the page's text, from its HTML as built. The text is
 * the page's `article`, else its `main`, without the furniture around it.
 */
export function markdownCopy(note: Note, html: string, site: URL): string {
  const root = parse(html)
  const body: HTMLElement | null = root.querySelector("main article.prose") ?? root.querySelector("main")
  if (!body) throw new Error(`${note.url} has no main element to copy`)
  restoreFootnotes(body)
  for (const selector of NOT_TEXT) for (const element of body.querySelectorAll(selector)) element.remove()
  return `${frontOf(note, site)}\n\n---\n\n${toMarkdown(body.innerHTML, site)}\n`
}

/** HTML of a page's text as Markdown, as a copy writes it: its links and images whole addresses. */
export const toMarkdown = (html: string, site: URL): string =>
  converter(site)
    .turndown(html)
    .replace(/\n{3,}/g, "\n\n")
    .trim()

// ─── llms.txt ───────────────────────────────────────────────────────────────────────────────────

/** A section of llms.txt, and the notes in it: those whose address starts with its prefix. */
interface Section {
  title: string
  prefix: string
}

const SECTIONS: Section[] = [
  { title: "Articles", prefix: "/content/articles/" },
  { title: "Annotations", prefix: "/content/annotations/" },
  { title: "Notes", prefix: "/content/notes/" },
  { title: "Other writing", prefix: "/content/" },
  { title: "About the site", prefix: "/" },
]

/**
 * The site's llms.txt: its name, what it is, and a list of every copied note, each linked to its
 * copy with what the site describes it by, grouped by where it is and newest first.
 */
export function llmsTxt(notes: Note[], site: URL, copy: (notes: Note[]) => Note[] = copiedNotes): string {
  const copied = copy(notes)
  const remaining = new Set(copied)
  const lines = [
    `# ${siteConfig.title}`,
    "",
    `> ${seo.description.trim().replace(/\s*\n\s*/g, " ")}`,
    "",
    `Each page below links to a Markdown copy of it: the page's address with \`.md\` after it. A copy opens with the page's address, author, dates and tags.`,
  ]
  for (const section of SECTIONS) {
    const inSection = [...remaining]
      .filter((note) => note.url.startsWith(section.prefix))
      .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || a.title.localeCompare(b.title))
    if (inSection.length === 0) continue
    lines.push("", `## ${section.title}`, "")
    for (const note of inSection) {
      remaining.delete(note)
      const summary = note.summary?.trim().replace(/\s*\n\s*/g, " ")
      lines.push(`- [${note.title.replace(/[[\]]/g, "")}](${new URL(markdownCopyUrl(note.url), site).href})${summary ? `: ${summary}` : ""}`)
    }
  }
  return `${lines.join("\n")}\n`
}
