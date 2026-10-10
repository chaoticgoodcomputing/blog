// A link in a note to another site opens in a new tab (docs/adr/3401).
//
// The reader stays on the note they were reading, as on the Quartz site. A link to another site is
// one whose address is whole, on the web, and not on this site's host, by `https:` or `http:`: a
// link to a page of the site, an attachment or a place on the page stays in the tab, and so does
// one that opens an application, `mailto:` or `tel:`, where a new tab would be left empty. A link
// that already has a `target` keeps it. The tab is opened with `noopener`, so the page there can't
// reach back into this one, and a screen reader is told that the link opens one: the link's name
// ends with "(opens in a new tab)", from an element that holds no text, so a heading's slug, a link's
// text and the search index are the note's own. What the element draws is the same news for the eye:
// Material Design Icons' `open-in-new`, as the Quartz site drew an icon after such a link.
//
// Only a link written in Markdown is seen here: Sätteri passes HTML written in a note through as
// it is written, and an MDX note's JSX is the writer's too.

import { defineHastPlugin } from "satteri"
import { noteIcon } from "./icons.ts"

/** `site` is the site's address, `site` in astro.config.ts: a link to its host is no other site's. */
export function externalLinks(site: string) {
  const own = new URL(site).host
  return defineHastPlugin({
    name: "external-links",
    element: {
      filter: ["a"],
      visit(node, ctx) {
        const href = node.properties?.href
        if (typeof href !== "string" || node.properties?.target !== undefined) return
        if (!URL.canParse(href)) return
        const url = new URL(href)
        if ((url.protocol !== "https:" && url.protocol !== "http:") || url.host === own) return
        ctx.setProperty(node, "target", "_blank")
        ctx.setProperty(node, "rel", "noopener")
        ctx.appendChild(node, {
          type: "element",
          tagName: "span",
          properties: { className: ["new-tab"], role: "img", ariaLabel: "(opens in a new tab)" },
          children: [noteIcon("open-in-new")],
        })
      },
    },
  })
}
