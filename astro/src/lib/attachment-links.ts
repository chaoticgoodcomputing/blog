// A link to an attachment is followed by the browser, not by the client router (docs/adr/0901).
//
// The router fetches the address a link names, to swap it in for the page, and prefetches it when
// the pointer rests on the link. An attachment is no page: the router would fetch the whole file,
// find it is not HTML, and then have the browser load it again, and a PDF would be downloaded just
// for being pointed at. So each link in a note to a published attachment carries Astro's
// `data-astro-reload`, which leaves its click to the browser, and `data-astro-prefetch="false"`.

import { defineHastPlugin } from "satteri"
import { attachmentAddressOf, publishedAttachments } from "./attachments.ts"

/** `published` is the site's published attachments, asked on every render. */
export function attachmentLinks(published: () => Map<string, unknown> = publishedAttachments) {
  return defineHastPlugin({
    name: "attachment-links",
    element: {
      filter: ["a"],
      visit(node, ctx) {
        const href = node.properties?.href
        const address = typeof href === "string" ? attachmentAddressOf(href) : undefined
        if (address === undefined || !published().has(address)) return
        ctx.setProperty(node, "dataAstroReload", "")
        ctx.setProperty(node, "dataAstroPrefetch", "false")
      },
    },
  })
}
