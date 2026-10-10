import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import sharp from "sharp"
import { expect, test } from "vitest"
import { getNote } from "../src/lib/notes.ts"
import {
  drawShareCard,
  shareCardDrawer,
  shareCardOf,
  shareCardPages,
  shareCardUrl,
  type ShareCard,
} from "../src/lib/share-card.ts"

const note = (id: string) => getNote(id)!
const SITE = new URL("https://blog.chaoticgood.computer")

// The image's pixels, three bytes each, and its width.
async function pixels(png: Buffer, region?: { top: number; height: number }) {
  const image = region ? sharp(png).extract({ left: 0, width: 1200, ...region }) : sharp(png)
  const { data, info } = await image.removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width }
}

const hex = (data: Buffer, at: number) =>
  `#${[data[at], data[at + 1], data[at + 2]].map((byte) => byte!.toString(16).padStart(2, "0")).join("")}`

// Whether two images of a size differ by more than a few steps in any channel of any pixel. A card
// is a PNG of at most 256 colours, each image's own, so the same drawing may be a step apart.
const differs = (a: Buffer, b: Buffer) => a.some((byte, at) => Math.abs(byte - b[at]!) > 6)

// How many pixels are within a few steps of a colour, given as `#rrggbb`.
async function count(png: Buffer, color: string): Promise<number> {
  const { data } = await pixels(png)
  const want = [1, 3, 5].map((at) => parseInt(color.slice(at, at + 2), 16))
  let found = 0
  for (let at = 0; at < data.length; at += 3) {
    if (want.every((value, channel) => Math.abs(data[at + channel]! - value) <= 6)) found++
  }
  return found
}

test("a note's share card says its title, description, date, reading time and tags", () => {
  expect(shareCardOf({ note: note("share-card/pruning-roses") })).toEqual({
    title: "Pruning Roses",
    description: "When and how to cut back a rose.",
    date: "Feb 14, 2026",
    readingTime: "2 min read",
    tags: ["horticulture/seasons", "writing/tutorials"],
  })
})

test("a note with no description has a card with none", () => {
  expect(shareCardOf({ note: note("share-card/long-title") })).toEqual({
    title:
      "Everything I Learned Building a Static Site Generator Twice Over, Including the Parts I Would Rather Forget About Entirely",
    date: "Feb 15, 2026",
    readingTime: "1 min read",
    tags: [],
  })
})

test("a note with no text has its date alone, as its page does", () => {
  expect(shareCardOf({ note: note("share-card/blank") })).toEqual({
    title: "Blank",
    date: "Feb 16, 2026",
    tags: ["horticulture"],
  })
})

test("a tag page's card says what the page's head does, with the tag's badge", () => {
  // engineering/ai has no description note: its page is titled by its tag name.
  expect(shareCardOf({ tag: "engineering/ai" })).toEqual({ title: "#ai", tags: ["engineering/ai"] })
  // ledger's description note, tags/ledger.md, titles and describes its page (ticket 12).
  expect(shareCardOf({ tag: "ledger" })).toEqual({
    title: "#ledger",
    description: "What the ledger keeps.",
    tags: ["ledger"],
  })
  expect(shareCardOf({ tag: "ledger/accounts" })).toEqual({ title: "#accounts", tags: ["ledger/accounts"] })
})

test("the tags index's card is its title alone", () => {
  expect(shareCardOf({ tag: undefined })).toEqual({ title: "Tags", tags: [] })
})

test("a page's card is under /share-cards, at the page's own address", () => {
  const roses = note("share-card/pruning-roses")
  expect(shareCardUrl({ kind: "note", url: roses.url, note: roses })).toBe("/share-cards/share-card/pruning-roses.png")
  expect(shareCardUrl({ kind: "home", url: "/", note: note("index") })).toBe("/share-cards/index.png")
  expect(shareCardUrl({ kind: "tag", url: "/tags/engineering/ai", tag: "engineering/ai" })).toBe(
    "/share-cards/tags/engineering/ai.png",
  )
})

test("the tags index has a card, and the 404 page none", () => {
  expect(shareCardUrl({ kind: "tag", url: "/tags" })).toBe("/share-cards/tags.png")
  expect(shareCardUrl({ kind: "404", url: "/404" })).toBeUndefined()
})

test("a private page has no card, nor a private tag's page", () => {
  const diary = note("content/seo/diary")
  expect(diary.isPrivate).toBe(true)
  expect(shareCardUrl({ kind: "note", url: diary.url, note: diary })).toBeUndefined()
  expect(shareCardUrl({ kind: "tag", url: "/tags/private/work", tag: "private/work" })).toBeUndefined()
  const cards = shareCardPages().map(({ url }) => url)
  expect(cards).not.toContain(`/share-cards${diary.url}.png`)
  expect(cards).not.toContain("/share-cards/tags/private.png")
  expect(cards).not.toContain("/share-cards/tags/private/work.png")
})

test("a card is drawn for every indexable page: each public note's, and each tag's but a private one's", () => {
  const cards = new Map(shareCardPages().map(({ url, subject }) => [url, subject]))
  expect(cards.get("/share-cards/share-card/pruning-roses.png")).toEqual({ note: note("share-card/pruning-roses") })
  expect(cards.get("/share-cards/index.png")).toEqual({ note: note("index") })
  expect(cards.get("/share-cards/tags/horticulture.png")).toEqual({ tag: "horticulture" })
  expect(cards.get("/share-cards/tags/horticulture/seasons.png")).toEqual({ tag: "horticulture/seasons" })
  expect(cards.get("/share-cards/tags.png")).toEqual({ tag: undefined })
})

test("each card's route parameter is its address under /share-cards, without .png", () => {
  const params = new Map(shareCardPages().map(({ url, card }) => [url, card]))
  expect(params.get("/share-cards/index.png")).toBe("index")
  expect(params.get("/share-cards/share-card/pruning-roses.png")).toBe("share-card/pruning-roses")
  expect(params.get("/share-cards/tags/horticulture/seasons.png")).toBe("tags/horticulture/seasons")
  expect(params.get("/share-cards/tags.png")).toBe("tags")
})

test("a card is drawn for every tag page, and for no tag without one (ticket 12)", () => {
  const cards = new Set(shareCardPages().map(({ url }) => url))
  // ledger/sealed is carried only by a private page, and has a tag page all the same.
  expect(cards).toContain("/share-cards/tags/ledger/sealed.png")
  // tags/unworn.md describes a tag no note carries: it has no tag page, and no card.
  expect(cards).not.toContain("/share-cards/tags/unworn.png")
  // A description note is not published, so it has no card of its own as a note.
  expect([...cards].filter((url) => url.startsWith("/share-cards/tags/ledger"))).toEqual([
    "/share-cards/tags/ledger.png",
    "/share-cards/tags/ledger/accounts.png",
    "/share-cards/tags/ledger/sealed.png",
  ])
})

test("a card is a 1200 by 630 PNG, on the dark palette's background", async () => {
  const png = await drawShareCard(shareCardOf({ note: note("share-card/pruning-roses") }), SITE)
  const { width, height, format } = await sharp(png).metadata()
  expect({ width, height, format }).toEqual({ width: 1200, height: 630, format: "png" })
  const { data } = await pixels(png, { top: 0, height: 1 })
  expect(hex(data, 0)).toBe("#161618")
})

test("a card's tags are drawn in their dark colours", async () => {
  // horticulture is light-dark(#1a8a1a, #00FF00), and writing light-dark(#9a7400, #FFD637).
  const png = await drawShareCard({ title: "Tagged", tags: ["horticulture/seasons", "writing/tutorials"] }, SITE)
  expect(await count(png, "#00ff00")).toBeGreaterThan(100)
  expect(await count(png, "#ffd637")).toBeGreaterThan(100)
  const untagged = await drawShareCard({ title: "Tagged", tags: [] }, SITE)
  expect(await count(untagged, "#00ff00")).toBe(0)
})

test("a long title is cut to fit, and leaves the card's foot where every card has it", async () => {
  const foot: Omit<ShareCard, "title"> = { date: "Feb 15, 2026", readingTime: "1 min read", tags: ["engineering"] }
  const long = shareCardOf({ note: note("share-card/long-title") }).title
  const bottom = { top: 480, height: 150 }
  const short = await pixels(await drawShareCard({ title: "Short", ...foot }, SITE), bottom)
  const cut = await pixels(await drawShareCard({ title: long, ...foot }, SITE), bottom)
  const described = await pixels(
    await drawShareCard({ title: long, description: "A description that runs on. ".repeat(30), ...foot }, SITE),
    bottom,
  )
  expect(differs(cut.data, short.data)).toBe(false)
  expect(differs(described.data, short.data)).toBe(false)
})

test("a long title is cut to two lines, and draws nothing in the room a third would take", async () => {
  // The title's two lines are at 168 to 322, under the site's row; the foot starts at 474. With no
  // description, everything between is the background.
  const long = shareCardOf({ note: note("share-card/long-title") }).title
  const { data } = await pixels(await drawShareCard({ title: long, tags: [] }, SITE), { top: 330, height: 120 })
  const colours = new Set<string>()
  for (let at = 0; at < data.length; at += 3) colours.add(hex(data, at))
  expect([...colours]).toEqual(["#161618"])
})

test("a card draws every tag it has room for", async () => {
  // Three tags with the foot to themselves, as on a tag page's card: writing is #FFD637, projects
  // #FF0000 and horticulture #00FF00 in the dark scheme.
  const png = await drawShareCard({ title: "Tagged", tags: ["writing", "projects", "horticulture"] }, SITE)
  expect(await count(png, "#ffd637")).toBeGreaterThan(100)
  expect(await count(png, "#ff0000")).toBeGreaterThan(100)
  expect(await count(png, "#00ff00")).toBeGreaterThan(100)
})

test("a card with more tags than it has room for draws those that fit, and says how many more there are", async () => {
  // A Pattern Language annotation's tags: the first is long, and leaves no room for the others.
  const foot = { date: "Feb 15, 2026", readingTime: "12 min read" }
  const first = "writing/annotations/a-pattern-language"
  const all = await drawShareCard({ title: "Tagged", ...foot, tags: [first, "projects/games/the-neighborhood", "horticulture"] }, SITE)
  expect(await count(all, "#ffd637")).toBeGreaterThan(100)
  expect(await count(all, "#ff0000")).toBe(0)
  expect(await count(all, "#00ff00")).toBe(0)
  // `+2` is drawn where a card with the one tag has nothing.
  const one = await drawShareCard({ title: "Tagged", ...foot, tags: [first] }, SITE)
  const end = { top: 500, height: 80 }
  expect(differs((await pixels(all, end)).data, (await pixels(one, end)).data)).toBe(true)
})

test("a card is drawn once, and the next build takes it from the cache until what it shows changes", async () => {
  const cache = fs.mkdtempSync(path.join(os.tmpdir(), "astro-share-cards-"))
  try {
    const roses = shareCardOf({ note: note("share-card/pruning-roses") })
    const build = shareCardDrawer(cache)
    const drawn = await build.draw(roses, SITE)
    expect(build.drawn).toBe(1)

    const next = shareCardDrawer(cache)
    expect((await next.draw(roses, SITE)).equals(drawn)).toBe(true)
    expect(next.drawn).toBe(0)
    await next.draw({ ...roses, readingTime: "3 min read" }, SITE)
    await next.draw(roses, new URL("https://example.com"))
    expect(next.drawn).toBe(2)
  } finally {
    fs.rmSync(cache, { recursive: true, force: true })
  }
})
