// A note's link to IndieNews (https://news.indieweb.org), the IndieWeb's news aggregator, submits
// the note there. IndieNews lists a post when the post sends a webmention to one of its language
// pages, `https://news.indieweb.org/en` and so on, and links there as the post's copy, with the class
// `u-syndication` (https://news.indieweb.org/how-to-submit-a-post). The class is IndieNews's rule
// alone, so the note doesn't write it: a link written in Markdown to a language page is given it
// here, and the deploy's webmention, from the note's mention excerpt for IndieNews, which keeps the
// class, submits it (src/lib/mention-excerpts.ts). A link to IndieNews's home page, or to a story
// on it, submits nothing, and is left as it is.

import { defineHastPlugin } from "satteri"

/** IndieNews's language pages: its address, and a language, as `en` or `pt-br`. */
const LANGUAGE_PAGE = /^https?:\/\/news\.indieweb\.org\/[a-z]{2,3}(?:-[a-z]+)?\/?$/i

/** Whether `href` is a page of IndieNews that a post's webmention submits it to. */
export const isIndieNews = (href: string): boolean => LANGUAGE_PAGE.test(href)

/** Marks a note's link to an IndieNews language page as the note's copy there (`u-syndication`). */
export function indieNews() {
  return defineHastPlugin({
    name: "indienews",
    element: {
      filter: ["a"],
      visit(node, ctx) {
        const href = node.properties?.href
        if (typeof href !== "string" || !isIndieNews(href)) return
        const classes = node.properties?.className
        const own = Array.isArray(classes) ? classes.map(String) : []
        if (!own.includes("u-syndication")) ctx.setProperty(node, "className", [...own, "u-syndication"])
      },
    },
  })
}
