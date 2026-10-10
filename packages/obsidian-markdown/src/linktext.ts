// Link text: what sits between `[[` and `]]`, and how it splits into a linkpath, a subpath and an
// alias. `parseLinktext` and `getLinkpath` are Obsidian's functions of the same names.

import { slug } from "github-slugger"

/**
 * Split a link's target into its linkpath and its subpath: `note#Heading` is `note` and `#Heading`,
 * `#^block` is the empty path and `#^block`.
 */
export function parseLinktext(linktext: string): { path: string; subpath: string } {
  const hash = linktext.indexOf("#")
  if (hash === -1) return { path: linktext.trim(), subpath: "" }
  return { path: linktext.slice(0, hash).trim(), subpath: linktext.slice(hash).trim() }
}

/** The linkpath of a link's target: the target without its subpath. */
export function getLinkpath(linktext: string): string {
  return parseLinktext(linktext).path
}

/** What Obsidian shows for a link with no alias: `note > Heading` for `note#Heading`. */
export function defaultDisplayText(link: string): string {
  const { path, subpath } = parseLinktext(link)
  const parts = subpath.split("#").filter(Boolean)
  return [path, ...parts].filter(Boolean).join(" > ")
}

export interface ParsedWikilink {
  embed: boolean
  link: string
  alias?: string
  displayText: string
}

/**
 * Read a wikilink from its source text, `[[target|alias]]` or `![[target|alias]]`. Null for
 * anything else. Inside a table the pipe is written `\|`, so one backslash before it is dropped.
 */
export function parseWikilink(original: string): ParsedWikilink | null {
  const match = /^(!?)\[\[([^\]]+)\]\]$/.exec(original)
  if (!match) return null
  const inner = match[2]!
  const pipe = inner.indexOf("|")
  let link = pipe === -1 ? inner : inner.slice(0, pipe)
  if (pipe !== -1 && link.endsWith("\\")) link = link.slice(0, -1)
  link = link.trim()
  if (!link) return null
  const alias = pipe === -1 ? undefined : inner.slice(pipe + 1).trim() || undefined
  return {
    embed: match[1] === "!",
    link,
    ...(alias === undefined ? {} : { alias }),
    displayText: alias ?? defaultDisplayText(link),
  }
}

/** Whether a Markdown link's URL points outside the vault: it has a scheme, or is protocol-relative. */
export function isExternalUrl(url: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//")
}

/**
 * A Markdown link's URL as a link's target: Markdown writes a space in it as `%20`, and the vault
 * names its files with the space.
 */
export function decodeLinkUrl(url: string): string {
  try {
    return decodeURI(url)
  } catch {
    return url
  }
}

/** An embed's alias is a size when it reads `300` or `300x200`, for an image or a drawing alike. */
export function parseSize(alias: string | undefined): { width: number; height?: number } | null {
  const match = /^(\d+)(?:x(\d+))?$/.exec(alias ?? "")
  if (!match) return null
  return { width: Number(match[1]), ...(match[2] ? { height: Number(match[2]) } : {}) }
}

/** How a heading is compared with a link's subpath: by its slug, so case and punctuation don't matter. */
export function headingKey(heading: string): string {
  return slug(heading)
}

/** A tag with its `#`, however it was written: frontmatter writes `a/b`, a note's body `#a/b`. */
export function normalizeTag(tag: string): string {
  const trimmed = tag.trim()
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`
}
