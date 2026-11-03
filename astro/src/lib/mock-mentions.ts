// Made-up discussion for the dev server, one for each source of it (src/lib/discussion.ts), as each
// source's API would give it (scripts/mock-mentions.ts writes them; each source's loader reads its
// own): webmentions as webmention.io's, among them a Bluesky reply as Bridgy sends one; the site's
// Bluesky posts as the account's author feed; and a Hacker News thread, as Algolia's search and the
// official API give one. They are aimed at notes the vault has now, so a renamed note never leaves
// them pointing nowhere, and come from `.example` sites and accounts, so none looks like anyone's.
//
// Between them the webmentions show each thing the Mentions section does: a title or the site in
// its place, only the paragraph that links to the note, a reply with text alone, a long text cut
// short, an author with no name, a like left out, a note found by an alias, and a reply from
// Bluesky. The first note has a Bluesky post and a Hacker News thread, with a deleted comment
// passed over; the others link to the account, and to no thread.

import type { AuthorFeedItem } from "./bluesky-posts.ts"
import type { Item, SearchHit } from "./hacker-news.ts"
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
        // A reply to the site's Bluesky post of the note, as Bridgy sends it.
        "wm-property": "in-reply-to",
        "wm-target": target,
        "wm-source": "https://brid.gy/comment/bluesky/chaoticgood.computer/mock/reply",
        url: "https://bsky.app/profile/eve.example/post/3mockreply",
        author: { name: "Eve", url: "https://bsky.app/profile/eve.example" },
        published: daysAgo(4),
        content: { text: "A reply on Bluesky, which Bridgy sent back as a webmention." },
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

/** The site's Bluesky account's posts, as its author feed: one, of the first note. */
export function mockBlueskyFeed({ site, notes }: MockTargets, now: Date = new Date()): { feed: AuthorFeedItem[] } {
  const [first] = notes
  if (!first) return { feed: [] }
  const createdAt = new Date(now.getTime() - 3 * DAY).toISOString()
  const external = { uri: new URL(first, site).href }
  return {
    feed: [
      {
        post: {
          uri: "at://did:plc:mock/app.bsky.feed.post/3mockpost",
          record: { createdAt, embed: { $type: "app.bsky.embed.external", external } },
        },
      },
    ],
  }
}

/**
 * A Hacker News thread of the first note, as Algolia's search and the official API give it: three
 * comments, one of them deleted, so two are shown.
 */
export function mockHackerNews(
  { site, notes }: MockTargets,
  now: Date = new Date(),
): { hits: SearchHit[]; items: Record<string, Item> } {
  const [first] = notes
  if (!first) return { hits: [], items: {} }
  const secondsAgo = (days: number) => Math.round((now.getTime() - days * DAY) / 1000)
  const story = 1000001
  const items: Item[] = [
    { id: story, type: "story", by: "submitter", time: secondsAgo(5), kids: [1000002, 1000003, 1000004] },
    {
      id: 1000002,
      type: "comment",
      by: "fran_example",
      time: secondsAgo(5),
      text: "A top comment, its first paragraph.<p>And its second, with <i>markup</i> read as text &amp; an entity.",
    },
    { id: 1000003, type: "comment", deleted: true },
    { id: 1000004, type: "comment", by: "gus_example", time: secondsAgo(4), text: "A shorter one." },
  ]
  return {
    hits: [
      {
        objectID: String(story),
        url: new URL(first, site).href,
        points: 64,
        num_comments: 12,
        created_at: new Date(secondsAgo(5) * 1000).toISOString(),
      },
    ],
    items: Object.fromEntries(items.map((item) => [item.id, item])),
  }
}
