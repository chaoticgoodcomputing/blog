// A web page's note's annotations as cards, as the editor shows them in its region
// (src/editor/annotator.ts) and reading view in each block's place (src/reading-view.ts): the
// passage as a quote callout (`[!QUOTE]`) that opens it in the page, in the browser, the comment as
// Obsidian renders Markdown, and the tags.

import { type Annotation, type Block, parseNote } from "@chaoticgoodcomputing/annotator-format"
import { type App, type Component, MarkdownRenderer } from "obsidian"
import { webPageOf } from "./editor/region.ts"
import { type Passage, passageAddress } from "./passage.ts"

/** What a card shows of an annotation, and the address of its passage in the page. */
export type Card = Pick<Annotation, "id" | "text" | "tags"> & { exact?: string; address?: string }

export function cardOf(annotation: Annotation, page: string | undefined): Card {
  const quote = annotation.target?.[0]?.selector?.find((selector) => selector.type === "TextQuoteSelector") as Passage | undefined
  const exact = quote?.exact?.trim()
  return { id: annotation.id, text: annotation.text, tags: annotation.tags, exact, address: page && exact ? passageAddress(page, quote!) : undefined }
}

/** The cards of a note's blocks that read, among `blocks` (all of its blocks, by default). */
export function cardsOf(text: string, blocks: Block[] = parseNote(text).blocks): Card[] {
  const page = webPageOf(text)?.url
  return blocks.flatMap((block) => (block.annotation ? [cardOf(block.annotation, page)] : []))
}

/** What a card renders its Markdown with: the app, what owns what it renders, and its note's path. */
export interface CardContext {
  app: App
  component: Component
  sourcePath: string
}

/** A card, in `parent`: its article, and the slot its comment is in, which its editor takes. */
export function renderCard(parent: HTMLElement, card: Card, { app, component, sourcePath }: CardContext): { article: HTMLElement; slot: HTMLElement } {
  const article = parent.createEl("article", { cls: "annotator-web-card", attr: { "data-annotation": card.id } })
  if (card.exact) {
    const quote = article.createDiv({ cls: "annotator-web-quote", attr: card.address ? { "aria-label": "Read it in context", "data-passage": card.address } : {} })
    const lines = card.exact.split(/\r?\n/).map((line) => `> ${line}`)
    void MarkdownRenderer.render(app, ["> [!quote]", ...lines].join("\n"), quote, sourcePath, component)
  }
  // The comment, and where its editor goes while it is edited; an empty one asks for one.
  const slot = article.createDiv({ cls: "annotator-web-comment-slot" })
  const comment = slot.createDiv({ cls: "annotator-web-comment" })
  if (card.text?.trim()) void MarkdownRenderer.render(app, card.text, comment, sourcePath, component)
  else comment.createDiv({ cls: "annotator-web-comment-empty", text: "Add a comment…" })
  if (card.tags?.length) {
    const tags = article.createDiv({ cls: "annotator-web-tags" })
    for (const tag of card.tags) tags.createSpan({ cls: "annotator-web-tag", text: `#${tag}` })
  }
  return { article, slot }
}

/** Opens a passage's box's address in the browser, on a click on the box but not on a link in it. */
export function openPassages(element: HTMLElement) {
  element.addEventListener("click", (event) => {
    const clicked = event.target as HTMLElement
    const passage = clicked.closest<HTMLElement>("[data-passage]")
    if (!passage || clicked.closest("a")) return
    event.preventDefault()
    event.stopPropagation()
    window.open(passage.dataset.passage)
  })
}
