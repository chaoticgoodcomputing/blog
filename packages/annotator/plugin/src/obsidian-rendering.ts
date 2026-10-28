// What the sidebar shows of Obsidian: a comment's Markdown as Obsidian renders it in the note, and
// Obsidian's styles to show it with.

import { type App, Component, MarkdownRenderer } from "obsidian"
import type { StylesReply } from "./protocol.ts"

/** A comment's Markdown, rendered as Obsidian renders it in the annotation note at `sourcePath`. */
export async function renderMarkdown(app: App, markdown: string, sourcePath: string): Promise<string> {
  const container = document.createElement("div")
  const component = new Component()
  component.load()
  try {
    await MarkdownRenderer.render(app, markdown, container, sourcePath, component)
    return container.innerHTML
  } finally {
    component.unload()
  }
}

/**
 * Obsidian's styles: every rule of its stylesheets, with relative addresses made absolute against
 * the sheet's, as the sidebar is elsewhere; and on `:host`, the variables of Obsidian's light theme,
 * whatever the theme, since the Hypothesis sidebar is light. A sheet whose rules can't be read (one
 * from another origin) is passed over.
 */
export function obsidianStyles(): StylesReply {
  let css = ""
  let fonts = ""
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    const base = sheet.href ?? document.baseURI
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSImportRule) continue
      const text = absoluteUrls(rule.cssText, base)
      if (rule instanceof CSSFontFaceRule) fonts += `${text}\n`
      else css += `${text}\n`
    }
  }
  return { css: `:host {\n${lightThemeVariables()}}\n${css}`, fonts }
}

/** Obsidian's CSS variables, as its light theme sets them: read off an element of that theme. */
function lightThemeVariables(): string {
  const probe = document.body.createDiv({ cls: "theme-light" })
  probe.style.display = "none"
  try {
    const computed = getComputedStyle(probe)
    let variables = ""
    for (let i = 0; i < computed.length; i++) {
      const name = computed[i]!
      if (name.startsWith("--")) variables += `  ${name}: ${computed.getPropertyValue(name)};\n`
    }
    return variables
  } finally {
    probe.remove()
  }
}

/** A rule's `url(…)`s, made absolute against `base`. */
const absoluteUrls = (text: string, base: string) =>
  text.replace(/url\((["']?)([^)"']+)\1\)/g, (whole, quote: string, url: string) => {
    if (/^(data|blob|[a-z][a-z0-9+.-]*):/i.test(url) && !url.startsWith("//")) return whole
    try {
      return `url(${quote}${new URL(url, base).href}${quote})`
    } catch {
      return whole
    }
  })
