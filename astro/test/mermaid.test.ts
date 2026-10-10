import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { Vault } from "@chaoticgoodcomputing/obsidian-markdown"
import { markdownToHtml } from "satteri"
import { afterAll, beforeAll, expect, test } from "vitest"
import { hasDiagrams, mermaidDiagrams } from "../src/lib/mermaid.ts"
import { openVault } from "../src/lib/vault.ts"

/** A note rendered with the mermaid plugin alone, so the source inside is as the plugin left it. */
function render(source: string): string {
  const { html } = markdownToHtml(source, { mdastPlugins: [mermaidDiagrams()] })
  return html.trim()
}

test("a mermaid block is a diagram that holds its source as a code block", () => {
  expect(render("```mermaid\ngraph TD\n    A --> B\n```")).toBe(
    '<mermaid-diagram class="mermaid-diagram"><pre><code class="language-mermaid">graph TD\n    A --&gt; B\n</code></pre></mermaid-diagram>',
  )
})

test("a block in any other language is left a code block", () => {
  expect(render("```js\nlet a = 1\n```")).toBe('<pre><code class="language-js">let a = 1\n</code></pre>')
})

test("a mermaid block is a diagram wherever it is written", () => {
  const html = render("> [!note]\n> ```mermaid\n> graph LR\n> ```\n\n- item\n\n  ```mermaid\n  graph TD\n  ```\n")
  expect(html.match(/<mermaid-diagram class="mermaid-diagram"><pre>/g)).toHaveLength(2)
})

// A vault of this test's own, for which notes have a diagram to draw.
const FILES: Record<string, string> = {
  "drawn.md": "Before.\n\n```mermaid\ngraph TD\n    A --> B\n```\n",
  "tilde.md": "~~~~ mermaid\ngraph TD\n~~~~\n",
  "quoted.md": "> [!note]\n> ```mermaid\n> graph TD\n> ```\n",
  "listed.md": "- item\n\n  ```mermaid\n  graph TD\n  ```\n",
  "plain.md": "No diagram here, though the word mermaid is.\n\n```js\nconst mermaid = 1\n```\n\n`mermaid`\n",
  "other-language.md": "```mermaidish\ngraph TD\n```\n",
  "embeds-drawn.md": "Here it is:\n\n![[drawn]]\n",
  "embeds-embeds.md": "![[embeds-drawn]]\n",
  "embeds-plain.md": "![[plain]] ![[picture.png]]\n",
  "loop-a.md": "![[loop-b]]\n",
  "loop-b.md": "![[loop-a]]\n",
  "widget.mdx": "import X from './x'\n\n```mermaid\ngraph TD\n```\n",
}

let root: string
let vault: Vault

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "astro-mermaid-"))
  for (const [file, contents] of Object.entries(FILES)) fs.writeFileSync(path.join(root, file), contents)
  fs.writeFileSync(path.join(root, "picture.png"), "")
  vault = await openVault(root)
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

const diagrams = (file: string) => hasDiagrams(vault.getFileByPath(file)!, vault)

test("a note has a diagram when it has a mermaid block, wherever the block is written", () => {
  expect(diagrams("drawn.md")).toBe(true)
  expect(diagrams("tilde.md")).toBe(true)
  expect(diagrams("quoted.md")).toBe(true)
  expect(diagrams("listed.md")).toBe(true)
  expect(diagrams("widget.mdx")).toBe(true)
})

test("a note with no mermaid block has no diagram, whatever else it says of mermaid", () => {
  expect(diagrams("plain.md")).toBe(false)
  expect(diagrams("other-language.md")).toBe(false)
})

test("a note has a diagram when a note it embeds has one, however deep", () => {
  expect(diagrams("embeds-drawn.md")).toBe(true)
  expect(diagrams("embeds-embeds.md")).toBe(true)
  expect(diagrams("embeds-plain.md")).toBe(false)
  expect(diagrams("loop-a.md")).toBe(false)
})
