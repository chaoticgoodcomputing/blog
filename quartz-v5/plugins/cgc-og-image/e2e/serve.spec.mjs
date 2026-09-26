// Drawing a card for every page is the slowest thing a build does, and nobody shares a link to a
// local preview, so `quartz build --serve` draws none (v4's `generateOnServe: false`). A build does.
import fs from "node:fs"
import { test, expect } from "../../../tests/harness/test.mjs"
import { buildScratchSite } from "../../../tests/harness/site.mjs"

const CONTENT = { "index.md": "---\ntitle: Home\ntags: [writing/articles]\n---\nA page that gets a card.\n" }
const cards = (dir) => fs.readdirSync(dir, { recursive: true }).filter((file) => file.endsWith("-og-image.webp"))

test("a serve run draws no cards, where a build of the same site does", async () => {
  test.setTimeout(180_000)
  const built = await buildScratchSite("og-build", CONTENT, { keep: true })
  const served = await buildScratchSite("og-serve", CONTENT, { keep: true, serve: true })
  try {
    expect(built.code, built.output).toBe(0)
    expect(served.code, served.output).toBe(0)
    expect(cards(built.public)).toContain("index-og-image.webp")
    // The serve run did build the site...
    expect(fs.existsSync(`${served.public}/index.html`)).toBe(true)
    // ...without a card.
    expect(cards(served.public)).toEqual([])
  } finally {
    for (const site of [built, served]) site.remove()
  }
})
