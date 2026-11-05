// A page's share card: the image its `og:image` names, drawn when the site builds. It shows the
// site's title and address, and the page as a post listing shows it: its title, date, description
// and tags, in the site's dark palette (docs/adr/1701).

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
import { site as siteConfig } from "../site.config.ts"
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
  return {
    title: note.title,
    ...(note.summary !== undefined && { description: note.summary }),
    ...(note.date && { date: formatDate(note.date, siteConfig.locale) }),
    tags: note.tags,
  }
}

// The drawing. Satori lays the card out as a browser would a page of flex boxes, into an SVG, and
// sharp turns that into a PNG.

/** A card's size: what Open Graph and Twitter show a large image at. */
export const SHARE_CARD_SIZE = { width: 1200, height: 630 }

// The room around the card's content.
const PADDING = 64
// A tag bubble's size, the room around it on its badge, and so a tag badge's height on the card;
// the size of a tag's name; and the space between two badges. A post listing's, scaled up
// (src/components/PostList.astro).
const TAG_BUBBLE = 44
const TAG_PADDING = 6
const TAG_HEIGHT = TAG_BUBBLE + 2 * TAG_PADDING
const TAG_FONT_SIZE = 24
const TAG_GAP = 12
// How wide the row of tags is: the card's, inside its padding.
const TAG_ROOM = SHARE_CARD_SIZE.width - 2 * PADDING

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

// The site's fonts (astro.config.ts): Fraunces for text and headings, in the text's light 300, the
// headings' 600 and the site title's 700, and Hack for tags. Satori reads neither WOFF2 nor a
// variable font, which is what the Fonts API serves the site, so Fraunces is set from Fontsource's
// static WOFF files of it (docs/adr/1702), Latin Extended there for what Latin lacks, and Hack from
// the WOFF files of the `hack-font` package the site serves its WOFF2 files from.
const require = createRequire(import.meta.url)
const FONT = "Fraunces"
const TAG_FONT = "Hack"
const FONTS: SatoriOptions["fonts"] = [
  ...(["latin", "latin-ext"] as const).flatMap((subset) =>
    ([300, 600, 700] as const).map((weight) => ({
      name: FONT,
      weight,
      style: "normal" as const,
      data: fs.readFileSync(require.resolve(`@fontsource/fraunces/files/fraunces-${subset}-${weight}-normal.woff`)),
    })),
  ),
  {
    name: TAG_FONT,
    weight: 400,
    style: "normal",
    data: fs.readFileSync(require.resolve("hack-font/build/web/fonts/hack-regular.woff")),
  },
]

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

// A tag badge as the site draws one open (src/components/TagBadge.astro): its tag bubble
// (src/lib/tag-bubble.ts) on a pill of `--lightgray`, then `#` and its tag name in the code font. A
// tag too long for the row even alone has its name cut, with an ellipsis.
function tagBadge(tag: string): Element {
  const bubble = bubbleParts(TAG_BUBBLE)
  const icon = tagIcon(tag)
  const src = icon === undefined ? undefined : iconSvg(icon, color("dark"))
  return box(
    {
      alignItems: "center",
      flexShrink: 0,
      maxWidth: TAG_ROOM,
      height: TAG_HEIGHT,
      padding: TAG_PADDING,
      // The open badge's corners: round before the bubble, nearly square after the name.
      borderRadius: `${TAG_HEIGHT / 2}px ${TAG_HEIGHT / 5}px ${TAG_HEIGHT / 5}px ${TAG_HEIGHT / 2}px`,
      backgroundColor: color("lightgray"),
      fontFamily: TAG_FONT,
      fontSize: TAG_FONT_SIZE,
      color: color("darkgray"),
    },
    box(
      {
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: TAG_BUBBLE,
        height: TAG_BUBBLE,
        borderRadius: TAG_BUBBLE / 2,
        border: `${bubble.rim}px solid ${inDark(tagColor(tag) ?? "var(--gray)")}`,
        backgroundColor: color("light"),
      },
      src && image(src, bubble.icon),
    ),
    clamped(1, { minWidth: 0, flexShrink: 1, overflow: "hidden", whiteSpace: "nowrap", padding: "0 6px 0 12px" }, `#${tagName(tag)}`),
  )
}

// How wide Satori draws a tag badge: laid out alone, with no width given, which Satori then takes
// from what it holds. Each tag's is measured once.
const widths = new Map<string, Promise<number>>()
function widthOf(tag: string): Promise<number> {
  let width = widths.get(tag)
  if (!width) {
    width = satori(tagBadge(tag) as never, { height: TAG_HEIGHT, fonts: FONTS } as never).then((svg) =>
      Math.min(TAG_ROOM, Number(/^<svg width="([\d.]+)"/.exec(svg)![1])),
    )
    widths.set(tag, width)
  }
  return width
}

// The tags' badges: the first tags, in the order written, as many as the row holds whole. The first
// is drawn whatever its width, cut to the row if it must be.
async function tagRow(tags: string[]): Promise<Element[]> {
  const sizes = await Promise.all(tags.map(widthOf))
  let used = 0
  let shown = 0
  for (const size of sizes) {
    used += size + (shown > 0 ? TAG_GAP : 0)
    if (shown > 0 && used > TAG_ROOM) break
    shown++
  }
  return tags.slice(0, shown).map(tagBadge)
}

// Text cut to a number of lines, ending in an ellipsis when it is cut.
const clamped = (lines: number, style: Record<string, unknown>, text: string): Element => ({
  type: "div",
  props: { style: { display: "block", lineClamp: lines, textOverflow: "ellipsis", ...style }, children: text },
})

// The card: the site's title at the top, as the sidebar has it, and under it the page as a post
// listing shows it, centred in the room left: its title, centred; its date, a dash and its
// description; and as many of its tags' badges as fit on a row, centred. The title and the line
// under it are cut to fit, so the tags are always drawn.
async function layout(card: ShareCard, site: URL): Promise<Element> {
  // "Mar 14, 2026 — What it is about", as PostList.astro writes it.
  const meta = [card.date, card.description].filter((part) => part !== undefined).join(" — ")
  return box(
    {
      flexDirection: "column",
      width: "100%",
      height: "100%",
      padding: PADDING,
      backgroundColor: color("light"),
      color: color("darkgray"),
      fontFamily: FONT,
      fontWeight: 300,
    },
    // The site's title as the sidebar draws it (SiteTitle.astro), and its address across from it.
    box(
      { alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 24 },
      box(
        { alignItems: "center", gap: 18, color: color("dark") },
        image(siteIcon, 72, { borderRadius: 5 }),
        box(
          { flexDirection: "column", gap: 2 },
          box({ fontSize: 36, fontWeight: 700, lineHeight: 1.2 }, siteConfig.title),
          box({ fontSize: 20, opacity: 0.7 }, `by ${siteConfig.author.name}`),
        ),
      ),
      box({ fontSize: 24, color: color("gray") }, site.host),
    ),
    box(
      { flexDirection: "column", justifyContent: "center", flexGrow: 1, minHeight: 0, gap: 20, paddingTop: 24 },
      // The listing's title is a link, and drawn as one. Satori centres a clamped text's lines only
      // when it wraps, so a title of one line is centred by the row it is in.
      box(
        { justifyContent: "center", flexShrink: 0 },
        clamped(2, { fontSize: 56, fontWeight: 600, lineHeight: 1.25, textAlign: "center", color: color("secondary") }, card.title),
      ),
      meta !== "" && clamped(3, { fontSize: 30, lineHeight: 1.45, flexShrink: 0 }, meta),
      card.tags.length > 0 &&
        box({ justifyContent: "center", gap: TAG_GAP, flexShrink: 0, marginTop: 4 }, ...(await tagRow(card.tags))),
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
