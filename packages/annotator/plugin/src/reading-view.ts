// A web page's note in reading view: each of its blocks as its card (src/web-cards.ts), as the
// editor shows them, in place of the blockquote Obsidian would draw of the block, whose hidden
// lines (its record, `%%COMMENT%%` and the like) leave line breaks and paragraphs where they were.
// Read, not edited: the editor edits a card's comment.

import { type App, MarkdownRenderChild, type MarkdownPostProcessor } from "obsidian"
import { blockAtLine, isWebNoteText } from "./editor/region.ts"
import { cardsOf, openPassages, renderCard } from "./web-cards.ts"

/** Reading view's sections of a web page's note's blocks, as cards. */
export function webCardsInReadingView(app: App): MarkdownPostProcessor {
  return (element, context) => {
    const section = context.getSectionInfo(element)
    if (!section || !isWebNoteText(section.text)) return
    const found = blockAtLine(section.text, section.lineStart)
    if (!found) return
    element.empty()
    // A block's other sections, its `^id` line among them, are part of its card.
    if (section.lineStart !== found.firstLine) {
      element.addClass("annotator-web-hidden")
      return
    }
    const card = cardsOf(section.text, [found.block])[0]
    if (!card) return
    const child = new MarkdownRenderChild(element)
    context.addChild(child)
    const cards = element.createDiv({ cls: "annotator-web-cards" })
    renderCard(cards, card, { app, component: child, sourcePath: context.sourcePath })
    openPassages(cards)
  }
}
