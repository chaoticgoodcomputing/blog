// A page's new annotation note, made on its first annotation in the browser: where it goes, by the
// settings' path pattern, and what it says, from the settings' template or the plugin's own
// properties. Nothing here reaches Obsidian, so the tests run it as it is.

/** A page the client names, as an annotation made on it names it. */
export interface Page {
  uri: string
  title?: string
  /** The page is a PDF, opened in the browser: its note is a PDF's, which Obsidian can show. */
  pdf?: boolean
}

/** What a path pattern and a template may name of a page: `{name}` in a path, `{{name}}` in a template. */
export interface PageVariables {
  /** The page's title, else its address. */
  title: string
  /** The title, with a dash for each run of what a file name can't hold, spaces too: `Pickle-Wikipedia`. */
  "sanitized-title": string
  /** The page's address, as the client names it. */
  url: string
  /** The page's host, without `www.`: `en.wikipedia.org`. */
  domain: string
  /** The page's whole path, lowercased, words joined by hyphens: `wiki-pickle-food`. */
  slug: string
  /** The day the note is made: `2026-11-05`. */
  date: string
}

export const VARIABLES = ["title", "sanitized-title", "url", "domain", "slug", "date"] as const

/** The pattern a new note's path has when the settings name none: its title, in Obsidian's folder for new notes. */
export const DEFAULT_PATTERN = "{title}"

/** The longest a part of a path is, made from a variable. */
const MAX_PART = 100

/** What no file or folder name may hold, in Obsidian or a file system, and what breaks a link to a note. */
const ILLEGAL = /[\\/:*?"<>|#^[\]\u0000-\u001f\u007f]+/g

/**
 * A value made fit to be a part of a path: underscores for what a name can't hold, no leading or
 * trailing dots or spaces, none longer than a name may be. Never empty.
 */
export function sanitize(value: string): string {
  const name = value
    .replace(ILLEGAL, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PART)
    .replace(/^[.\s]+|[.\s]+$/g, "")
  return name || "_"
}

/** A value with a dash for each run of what a file name can't hold, or of spaces, and none at its ends. Never empty. */
function dashed(value: string): string {
  const name = value
    .replace(/[\s\\/:*?"<>|#^[\]\u0000-\u001f\u007f-]+/g, "-")
    .slice(0, MAX_PART)
    .replace(/^[-.]+|[-.]+$/g, "")
  return name || "untitled"
}

/** A page's variables, as they are, before any is made a path's part. */
export function pageVariables(page: Page, date: string): PageVariables {
  let url: URL | undefined
  try {
    url = new URL(page.uri)
  } catch {}
  const path = url ? safeDecode(url.pathname) : ""
  const domain = url?.hostname.toLowerCase().replace(/^www\./, "") || "local"
  const slug =
    path
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_PART)
      .replace(/-+$/, "") || "index"
  const fromAddress = url ? [domain, ...path.split("/").filter(Boolean)].join(" ") : page.uri
  const title = page.title?.trim() || fromAddress
  return { title, "sanitized-title": dashed(title), url: page.uri, domain, slug, date }
}

const safeDecode = (text: string) => {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

/**
 * A new note's path in the vault, without `.md`: the pattern, with each `{variable}` the page's,
 * sanitized. The pattern's own slashes are folders; a variable's never are. A `{name}` the pattern
 * names that is no variable is kept as it is.
 */
export function notePath(pattern: string, variables: PageVariables): string {
  const filled = (pattern.trim() || DEFAULT_PATTERN).replace(/\{([\w-]+)\}/g, (whole, name: string) =>
    name in variables ? sanitize(variables[name as keyof PageVariables]) : whole,
  )
  return filled
    .replace(/\.md$/i, "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/")
}

/**
 * A template, with each `{{variable}}` the page's. In the frontmatter, a variable that is a
 * property's whole value is written as a YAML string, so a title with a colon or a quote is still
 * one; anywhere else, as it is. A `{{name}}` that is no variable is kept, for another plugin's.
 */
export function fillTemplate(template: string, variables: PageVariables): string {
  const value = (name: string) => (name in variables ? variables[name as keyof PageVariables] : undefined)
  const fill = (text: string) => text.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (whole, name: string) => value(name) ?? whole)
  const frontmatter = FRONTMATTER.exec(template)
  if (!frontmatter) return fill(template)
  const properties = frontmatter[1]!.replace(/^([^:\n]+:[ \t]*)\{\{\s*([\w-]+)\s*\}\}[ \t]*$/gm, (whole, key: string, name: string) => {
    const filled = value(name)
    return filled === undefined ? whole : `${key}${JSON.stringify(filled)}`
  })
  return `---\n${fill(properties)}\n---\n${fill(template.slice(frontmatter[0].length))}`
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

/** The property naming what kind of document a note's target is, and the kind a page in the browser is. */
export const TYPE_PROPERTY = "annotation-target-type"
export const WEB_TYPE = "web"

/**
 * A note's text with the page as its annotation target, and, for a web page, its target type: in
 * place of any the template wrote, at the end of its frontmatter, or in frontmatter of its own. In
 * the text, not after it is made, so whatever else writes to the new note (Templater) keeps them.
 */
export function withTarget(text: string, page: Page): string {
  const lines = [`annotation-target: ${JSON.stringify(page.uri)}`, ...(page.pdf ? [] : [`${TYPE_PROPERTY}: ${WEB_TYPE}`])]
  const frontmatter = FRONTMATTER.exec(text)
  if (!frontmatter) return `---\n${lines.join("\n")}\n---\n${text}`
  // A property, with any lines of a list or a block under it.
  const ours = /^annotation-target(?:-type)?:.*(?:\r?\n[ \t]+.*)*$/gm
  const kept = frontmatter[1]!.replace(ours, "").replace(/\n{2,}/g, "\n").replace(/^\n|\n$/g, "")
  return `---\n${[...(kept ? [kept] : []), ...lines].join("\n")}\n---\n${text.slice(frontmatter[0].length)}`
}

/**
 * A page's new annotation note when the settings name no template: the vault's annotation
 * template's properties (content/templates/annotation.template.md), and nothing else; the
 * annotations follow.
 */
export function defaultNote(variables: PageVariables): string {
  return ["---", `title: ${JSON.stringify(variables.title)}`, `date: ${variables.date}`, "tags:", "  - writing/annotations", "---", ""].join("\n")
}

/** A page's new note's text: the template's, or the default's, with the page as its target. */
export function newNote(page: Page, date: string, template?: string): string {
  const variables = pageVariables(page, date)
  return withTarget(template === undefined ? defaultNote(variables) : fillTemplate(template, variables), page)
}
