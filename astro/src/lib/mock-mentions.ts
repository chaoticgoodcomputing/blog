// Made-up webmentions for the dev server, as webmention.io's API would give them
// (scripts/mock-mentions.ts writes them; ./mentions.ts reads them). They are aimed at notes the
// vault has now, so a renamed note never leaves them pointing nowhere, and come from `.example`
// sites, so none looks like anyone's. Between them they show each thing the Mentions section does:
// a title or the site in its place, only the paragraph that links to the note, a reply with text
// alone, a long text cut short, an author with no name, a like left out, and a note found by an
// alias.

import type { Jf2Entry } from "./mentions.ts"

const DAY = 24 * 60 * 60 * 1000

export interface MockTargets {
  /** The site's address. */
  site: string
  /** The addresses of up to three notes to mention, from the site's root, the first the most. */
  notes: string[]
  /** An alias's address, from the site's root, that redirects to a note, if the site has one. */
  alias?: string | undefined
}

/** The made-up webmentions, as `now` would have them. */
export function mockMentions({ site, notes, alias }: MockTargets, now: Date = new Date()): Jf2Entry[] {
  const at = (path: string) => new URL(path, site).href
  const daysAgo = (days: number) => new Date(now.getTime() - days * DAY).toISOString()
  const entries: Omit<Jf2Entry, "wm-id">[] = []
  const [first, second, third] = notes

  if (first) {
    const target = at(first)
    entries.push(
      {
        "wm-property": "mention-of",
        "wm-target": target,
        url: "https://ada.example/2026/boundary-objects",
        name: "The Boundary Object Is Not the Reader",
        author: { name: "Ada Example", url: "https://ada.example/" },
        published: daysAgo(2),
        content: {
          html: `<p>This paragraph doesn't link anywhere, so the excerpt leaves it out.</p>
            <p>As <a href="${target}">this note</a> puts it, a shared model is only shared while both sides keep reading it.</p>
            <p>Nor is this one in it.</p>`,
          text: "This paragraph doesn't link anywhere…",
        },
      },
      {
        "wm-property": "in-reply-to",
        "wm-target": target,
        url: "https://bo.example/notes/42",
        author: { name: "Bo", url: "https://bo.example/" },
        published: daysAgo(9),
        content: { text: "A reply with no HTML and no title: its site stands in for one." },
      },
      {
        "wm-property": "like-of",
        "wm-target": target,
        url: "https://liker.example/likes/1",
        author: { name: "Someone who only liked it" },
        published: daysAgo(1),
      },
    )
  }

  if (second) {
    entries.push(
      {
        "wm-property": "mention-of",
        "wm-target": at(second),
        url: "https://cy.example/long-post",
        name: "A long one",
        author: { name: "Cy" },
        published: daysAgo(20),
        content: {
          text: `${"This post goes on, and on, with nothing to link to the note in HTML, so its text is cut short. ".repeat(8)}The end.`,
        },
      },
      {
        "wm-property": "mention-of",
        "wm-target": `${at(second)}/`,
        url: "https://www.anonymous.example/post",
        name: "No author's name, and a trailing slash on the target",
        published: daysAgo(40),
        content: { text: "Its site is shown without its `www.`." },
      },
    )
  }

  const byAlias = alias ?? third
  if (byAlias) {
    entries.push({
      "wm-property": "mention-of",
      "wm-target": at(byAlias),
      url: "https://dee.example/old-links",
      name: alias ? "Linked by an old address" : "Linked once",
      author: { name: "Dee", url: "https://dee.example/" },
      published: daysAgo(60),
      content: { text: alias ? `This links to ${byAlias}, an alias the note is found by.` : "A third note's mention." },
    })
  }

  return entries.map((entry, index) => ({ "wm-id": index + 1, ...entry }))
}
