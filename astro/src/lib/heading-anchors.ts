// Each heading in a note ends with a link to itself, for a reader to copy the address of a section
// (docs/adr/3402).
//
// The link holds Material Design Icons' `link-variant`, from the set astro-icon draws the site's
// other icons from (docs/adr/1101), and is shown while the pointer is on its heading
// (src/styles/prose/heading-anchors.css). It is for the pointer alone: a screen reader skips it and
// the keyboard never stops on it, since the table of contents already links every heading and the
// heading's own text says all there is.
//
// A heading's id is Astro's, given by its heading-ids plugin, and Astro runs that after the site's
// own plugins. So Astro's plugin is run first here, and gives each heading the id Astro would; when
// Astro's runs again it keeps an id a heading has. A heading of an embedded note already has the
// id the resolver gave it, apart from the page's own, and keeps that too. The anchor holds no text,
// so a heading's slug and the text Astro lists it by are its own.

import { satteriHeadingIdsPlugin } from "@astrojs/markdown-satteri"
import { defineHastPlugin } from "satteri"
import { noteIcon } from "./icons.ts"

export function headingAnchors() {
  return [
    satteriHeadingIdsPlugin(),
    defineHastPlugin({
      name: "heading-anchors",
      element: {
        filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
        visit(node, ctx) {
          const id = node.properties?.id
          if (typeof id !== "string") return
          ctx.appendChild(node, {
            type: "element",
            tagName: "a",
            properties: { className: ["heading-anchor"], href: `#${id}`, ariaHidden: "true", tabIndex: -1 },
            // Read from the set itself, as an element (src/lib/icons.ts).
            children: [noteIcon("link-variant")],
          })
        },
      },
    }),
  ]
}
