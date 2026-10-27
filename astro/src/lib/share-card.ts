// A page's share card: the image its `og:image` names, drawn when the site builds. It shows the
// site's icon and address, and the page's title, description, date, reading time and tags, in the
// site's dark palette (docs/adr/1701).

import { createHash, randomUUID } from "node:crypto"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import satori, { type SatoriOptions } from "satori"
import sharp, { type PngOptions } from "sharp"
import siteIcon from "../assets/icon.png?inline"
import { formatDate } from "./dates.ts"
import { SITE_ICONS } from "./icons.ts"
import { getNotes, type Note, type NoteFacts } from "./notes.ts"
import { isIndexable, type PageProps } from "./page.ts"
import { readingMinutes } from "./reading-time.ts"
import { bubbleParts } from "./tag-bubble.ts"
import { tagColor, tagIcon } from "./tag-dictionary.ts"
import { tagPages, tagPageTitle } from "./tag-pages.ts"
import { TAGS_INDEX, tagName, tagUrl } from "./tags.ts"

// Where the cards are, each at its page's address: `/a/b` has `/share-cards/a/b.png`, and the home
// page `/share-cards/index.png`. The endpoint's route, src/pages/share-cards/[...card].png.ts, is
// named by `card`, the part between.
const CARDS = "/share-cards"
const cardOf = (url: string) => (url === "/" ? "index" : url.slice(1))
const cardAt = (url: string) => `${CARDS}/${cardOf(url)}.png`

/**
 * The address of a page's card, from the site's root: an indexable page has one (`isIndexable`), a
 * note's page, the home page, an annotation page, a tag's page and the tags index. A private page,
 * a private tag's page and the 404 page have none: a page that asks not to be found is not drawn
 * for a link to it to show.
 */
export function shareCardUrl(page: Pick<PageProps, "kind" | "url" | "note" | "tag">): string | undefined {
  if (!isIndexable(page)) return undefined
  if (page.kind === "tag") return cardAt(page.url)
  return page.note ? cardAt(page.url) : undefined
}

/**
 * Every card the site draws, by its address and its route's `card` parameter, with what it is of:
 * each indexable note's page, the page of each tag that has one and is no private tag's
 * (src/lib/tag-pages.ts), and the tags index.
 */
export function shareCardPages(notes: Note[] = getNotes()): { url: string; card: string; subject: CardSubject }[] {
  const page = (url: string, subject: CardSubject) => ({ url: cardAt(url), card: cardOf(url), subject })
  return [
    ...notes.filter((note) => isIndexable({ kind: "note", note })).map((note) => page(note.url, { note })),
    ...tagPages(notes)
      .filter((tag) => isIndexable({ kind: "tag", tag }))
      .map((tag) => page(tagUrl(tag), { tag })),
    page(TAGS_INDEX, { tag: undefined }),
  ]
}

/** What one card says. A field it has none of is left off the card. */
export interface ShareCard {
  title: string
  description?: string
  /** The note's date, as the site prints one. */
  date?: string
  /** `3 min read`. */
  readingTime?: string
  /** Tag slugs, in the order written. */
  tags: string[]
}

/** What a card is of: a note's page, or a tag's page, or with no tag the tags index. */
export type CardSubject = { note: NoteFacts } | { tag: string | undefined }

/**
 * What a page's card says. A tag page's says what the page's head does (`tagPageTitle`), with the
 * tag's badge; the tags index's, its title alone.
 */
export function shareCardOf(subject: CardSubject): ShareCard {
  if ("tag" in subject) return { ...tagPageTitle(subject.tag), tags: subject.tag === undefined ? [] : [subject.tag] }
  const { note } = subject
  const minutes = readingMinutes(note)
  return {
    title: note.title,
    ...(note.summary !== undefined && { description: note.summary }),
    ...(note.date && { date: formatDate(note.date) }),
    // A note with no text has its date alone, as its page shows it.
    ...(minutes > 0 && { readingTime: `${minutes} min read` }),
    tags: note.tags,
  }
}

// The drawing. Satori lays the card out as a browser would a page of flex boxes, into an SVG, and
// sharp turns that into a PNG.

/** A card's size: what Open Graph and Twitter show a large image at. */
export const SHARE_CARD_SIZE = { width: 1200, height: 630 }

// The room around the card's content.
const PADDING = 64
// A tag bubble's size, and so a tag's height on the card.
const TAG_HEIGHT = 44
// The space between two tags on the foot.
const TAG_GAP = 28
// The size of the foot's text.
const FOOT_FONT_SIZE = 28

// The card is drawn in the site's own palette, as the dark scheme has it: each token of global.css
// is read for its dark value, so the palette is written in one place. Astro runs from astro/, as
// the vault's default root also supposes (src/lib/vault.ts); a stylesheet imported `?raw` would
// read as empty in the unit tests, which leave CSS out.
const TOKEN = /^\s*--([\w-]+):\s*([^;]+);/gm
const globalCss = fs.readFileSync(path.resolve("src/styles/global.css"), "utf8")
const palette = new Map([...globalCss.matchAll(TOKEN)].map(([, name, value]) => [name!, value!.trim()]))

/**
 * A colour value as the dark scheme paints it: the second of a `light-dark()` pair, and a token's
 * value for a `var(--…)`. Anything else is already one colour.
 */
function inDark(value: string): string {
  const pair = /^light-dark\((.*)\)$/s.exec(value)
  if (pair) {
    // The comma between the two, which is the one outside any parentheses.
    let depth = 0
    const inside = pair[1]!
    for (let at = 0; at < inside.length; at++) {
      if (inside[at] === "(") depth++
      else if (inside[at] === ")") depth--
      else if (inside[at] === "," && depth === 0) return inDark(inside.slice(at + 1).trim())
    }
  }
  const token = /^var\(--([\w-]+)\)$/.exec(value)
  if (token) return inDark(palette.get(token[1]!) ?? "transparent")
  return value
}

const color = (token: string) => inDark(`var(--${token})`)

// Inter, the site's text font. Satori reads neither WOFF2 nor a variable font, which is what the
// Fonts API serves the site, so the card is set from Fontsource's static WOFF files of the same
// font (docs/adr/1702). Latin Extended is there for what Latin lacks.
const require = createRequire(import.meta.url)
const FONTS: SatoriOptions["fonts"] = (["latin", "latin-ext"] as const).flatMap((subset) =>
  ([400, 700] as const).map((weight) => ({
    name: "Inter",
    weight,
    style: "normal" as const,
    data: fs.readFileSync(require.resolve(`@fontsource/inter/files/inter-${subset}-${weight}-normal.woff`)),
  })),
)

// An icon id's SVG, painted in one colour, as a data address an `<img>` can show. Material Design
// Icons are read from their installed set; the site's own from its files in src/icons
// (src/lib/icons.ts). Satori draws an `<img>`, not astro-icon's component, so the card reads the
// sets astro-icon reads itself (docs/adr/1701).
const siteIcons = import.meta.glob<string>("../icons/*.svg", { query: "?raw", import: "default", eager: true })
interface IconSet {
  icons: Record<string, { body: string; width?: number; height?: number }>
  aliases?: Record<string, { parent: string }>
  width?: number
  height?: number
}
function iconSvg(id: string, fill: string): string | undefined {
  const [prefix, name] = id.split(":") as [string, string]
  let svg: string | undefined
  if (prefix === SITE_ICONS) {
    svg = siteIcons[`../icons/${name}.svg`]?.replace(/^[\s\S]*?(?=<svg)/, "")
  } else {
    const set = require(`@iconify-json/${prefix}/icons.json`) as IconSet
    const icon = set.icons[name] ?? set.icons[set.aliases?.[name]?.parent ?? ""]
    if (icon) {
      const width = icon.width ?? set.width ?? 16
      const height = icon.height ?? set.height ?? 16
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${icon.body}</svg>`
    }
  }
  if (svg === undefined) return undefined
  // An icon is painted in one colour, whatever colours its file had, as a tag bubble paints it.
  const painted = svg.replaceAll("currentColor", fill).replace(/<svg\b/, `<svg fill="${fill}"`)
  return `data:image/svg+xml;base64,${Buffer.from(painted).toString("base64")}`
}

// An element as Satori takes one. Satori lays out flex boxes only, so every box says so.
type Element = { type: string; props: Record<string, unknown> }
type Child = Element | string | false | undefined
const box = (style: Record<string, unknown>, ...children: Child[]): Element => ({
  type: "div",
  props: { style: { display: "flex", ...style }, children: children.filter((child) => child !== false && child) },
})
const image = (src: string, size: number, style: Record<string, unknown> = {}): Element => ({
  type: "img",
  props: { src, width: size, height: size, style },
})

// A tag bubble as the site draws one (src/lib/tag-bubble.ts), then `#` and its tag name.
// A tag the foot has too little room for even alone is cut, its name with an ellipsis.
function tagBadge(tag: string): Element {
  const bubble = bubbleParts(TAG_HEIGHT)
  const icon = tagIcon(tag)
  const src = icon === undefined ? undefined : iconSvg(icon, color("dark"))
  return box(
    { alignItems: "center", gap: 12, height: TAG_HEIGHT, flexShrink: 1, minWidth: TAG_HEIGHT },
    box(
      {
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: TAG_HEIGHT,
        height: TAG_HEIGHT,
        borderRadius: TAG_HEIGHT / 2,
        border: `${bubble.rim}px solid ${inDark(tagColor(tag) ?? "var(--gray)")}`,
        backgroundColor: color("light"),
      },
      src && image(src, bubble.icon),
    ),
    // A tag name longer than any other is cut, rather than run off the card.
    clamped(1, { maxWidth: 400, minWidth: 0, flexShrink: 1, overflow: "hidden", whiteSpace: "nowrap" }, `#${tagName(tag)}`),
  )
}

// A date or a reading time, after its icon.
const fact = (icon: string, text: string) =>
  box({ alignItems: "center", gap: 10 }, image(iconSvg(icon, color("darkgray"))!, 30), text)

// Text cut to a number of lines, ending in an ellipsis when it is cut.
const clamped = (lines: number, style: Record<string, unknown>, text: string): Element => ({
  type: "div",
  props: { style: { display: "block", lineClamp: lines, textOverflow: "ellipsis", ...style }, children: text },
})

// How wide Satori draws an element of the foot: laid out alone, at the foot's height and in its
// text, with no width given, which Satori then takes from what it holds. Each is measured once.
const widths = new Map<string, Promise<number>>()
function widthOf(element: Element): Promise<number> {
  const key = JSON.stringify(element)
  let width = widths.get(key)
  if (!width) {
    const alone = box({ fontFamily: "Inter", fontSize: FOOT_FONT_SIZE }, element)
    width = satori(alone as never, { height: TAG_HEIGHT, fonts: FONTS } as never).then((svg) =>
      Number(/^<svg width="([\d.]+)"/.exec(svg)![1]),
    )
    widths.set(key, width)
  }
  return width
}

// The foot's tags: as many whole ones as fit in `room`, in the order written, then how many more
// there are. At least one is drawn, cut to fit if it must be.
async function footTags(tags: string[], room: number): Promise<Element[]> {
  const more = (count: number) => box({ flexShrink: 0, color: color("gray") }, `+${count}`)
  const badges = tags.map(tagBadge)
  let shown = badges.length
  for (; shown > 1; shown--) {
    const parts = [...badges.slice(0, shown), ...(shown < badges.length ? [more(badges.length - shown)] : [])]
    const width = (await Promise.all(parts.map(widthOf))).reduce((sum, each) => sum + each, 0)
    if (width + TAG_GAP * (parts.length - 1) <= room) break
  }
  return [...badges.slice(0, shown), ...(shown < badges.length ? [more(badges.length - shown)] : [])]
}

// The card: the site at the top, the page's title and description, and its date, reading time and
// tags along the foot. The title and description take what room the foot leaves, and are cut to
// it, so a long title never moves the foot.
async function layout(card: ShareCard, site: URL): Promise<Element> {
  const facts = box(
    { alignItems: "center", gap: 36, flexShrink: 0, marginRight: 36 },
    card.date !== undefined && fact("mdi:calendar-blank-outline", card.date),
    card.readingTime !== undefined && fact("mdi:clock-outline", card.readingTime),
  )
  const room = SHARE_CARD_SIZE.width - 2 * PADDING - (await widthOf(facts))
  return box(
    {
      flexDirection: "column",
      width: "100%",
      height: "100%",
      padding: PADDING,
      backgroundColor: color("light"),
      color: color("darkgray"),
      fontFamily: "Inter",
    },
    box(
      { alignItems: "center", flexShrink: 0, gap: 20, fontSize: 30, color: color("gray") },
      image(siteIcon, 64, { borderRadius: 32 }),
      site.host,
    ),
    box(
      { flexDirection: "column", flexGrow: 1, flexShrink: 1, overflow: "hidden", margin: "40px 0 24px", gap: 20 },
      clamped(2, { fontSize: 64, fontWeight: 700, lineHeight: 1.2, color: color("dark") }, card.title),
      card.description !== undefined && clamped(2, { fontSize: 32, lineHeight: 1.4 }, card.description),
    ),
    box(
      {
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        height: 92,
        paddingTop: 24,
        borderTop: `2px solid ${color("lightgray")}`,
        fontSize: FOOT_FONT_SIZE,
      },
      facts,
      box(
        { alignItems: "center", justifyContent: "flex-end", gap: TAG_GAP, flexShrink: 1, minWidth: 0, height: TAG_HEIGHT },
        ...(await footTags(card.tags, room)),
      ),
    ),
  )
}

/** A card drawn: a PNG of `SHARE_CARD_SIZE`, which shows `site` by its host. */
export async function drawShareCard(card: ShareCard, site: URL): Promise<Buffer> {
  return draw(await layout(card, site))
}

// A card is a few flat colours and the edges between them, which 256 colours draw as well as any
// number, in half the bytes.
const PNG: PngOptions = { palette: true }

async function draw(element: Element): Promise<Buffer> {
  const svg = await satori(element as never, { ...SHARE_CARD_SIZE, fonts: FONTS })
  return sharp(Buffer.from(svg)).png(PNG).toBuffer()
}

// What every card is drawn with besides its layout: Satori, which lays it out, the fonts, and sharp
// with the libraries it draws the SVG and writes the PNG with, and how it writes it.
const DRAWN_WITH = createHash("sha256")
  .update(`satori ${(require("satori/package.json") as { version: string }).version}`)
  .update(Buffer.concat(FONTS.map((font) => Buffer.from(font.data as Buffer))))
  .update(JSON.stringify(sharp.versions))
  .update(JSON.stringify(PNG))
  .digest("hex")

/** Draws cards through a cache, and counts the cards it drew. */
export interface ShareCardDrawer {
  /** A card, as `drawShareCard` draws it, from the cache when it holds the same drawing. */
  draw(card: ShareCard, site: URL): Promise<Buffer>
  /** How many cards it has drawn, rather than found in the cache. */
  readonly drawn: number
}

/**
 * A drawer whose cards are kept in `dir`, where the next build finds them. A card is kept under
 * the hash of all it is drawn from: its layout, with every word, colour and icon on it, and what
 * draws it. A page that has not changed has the same card, which is not drawn again; one whose
 * card would show anything else has a new one. Nothing is ever taken out, and deleting the
 * directory only means every card is drawn again.
 */
export function shareCardDrawer(dir: string): ShareCardDrawer {
  let drawn = 0
  return {
    get drawn() {
      return drawn
    },
    async draw(card, site) {
      const element = await layout(card, site)
      const key = createHash("sha256").update(DRAWN_WITH).update(JSON.stringify(element)).digest("hex")
      const file = path.join(dir, `${key}.png`)
      try {
        return await fs.promises.readFile(file)
      } catch {
        const png = await draw(element)
        drawn++
        await fs.promises.mkdir(dir, { recursive: true })
        // Written under another name and then renamed, so a build that stops half-way never
        // leaves half a card for the next to read.
        const partial = `${file}.${randomUUID()}.partial`
        await fs.promises.writeFile(partial, png)
        await fs.promises.rename(partial, file)
        return png
      }
    },
  }
}
