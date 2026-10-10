import { expect, test } from "vitest"
import { getNote } from "../src/lib/notes.ts"
import { articleTypeOf, headOf } from "../src/lib/seo.ts"
import { seo } from "../src/site.config.ts"
import type { SeoConfig } from "../src/site.config.types.ts"

const CONTEXT = { site: new URL("https://example.com"), logo: "https://example.com/_astro/icon.png" }
const note = (id: string) => getNote(id)!

test("a page's title is followed by the site's suffix", () => {
  expect(headOf({ kind: "note", title: "Small Models", url: "/content/seo/small-models" }, CONTEXT).title).toBe(
    "Small Models | Spencer Elkington",
  )
  expect(headOf({ kind: "404", title: "Not Found", url: "/404" }, CONTEXT).title).toBe("Not Found | Spencer Elkington")
})

test("a page's description is its own, else what the site is", () => {
  const own = {
    kind: "note",
    title: "Small Models",
    description: "A note on small language models.",
    url: "/x",
  } as const
  expect(headOf(own, CONTEXT).description).toBe("A note on small language models.")
  expect(headOf({ kind: "404", title: "Not Found", url: "/404" }, CONTEXT).description).toBe(
    "Articles for the data and engineering consulting practice Chaotic Good Computing, as well as personal notes by Spencer Elkington.",
  )
})

test("a page's canonical address is its own, whole, on the site", () => {
  expect(headOf({ kind: "home", title: "Home", url: "/" }, CONTEXT).canonical).toBe("https://example.com/")
  expect(headOf({ kind: "note", title: "W06", url: "/content/feed/Weekly-W06" }, CONTEXT).canonical).toBe(
    "https://example.com/content/feed/Weekly-W06",
  )
  expect(headOf({ kind: "tag", title: "#engineering/ai", url: "/tags/engineering/ai" }, CONTEXT).canonical).toBe(
    "https://example.com/tags/engineering/ai",
  )
})

test("a private page, a private tag page and the 404 page ask not to be indexed", () => {
  const page = (id: string) => ({ kind: "note", title: note(id).title, url: note(id).url, note: note(id) }) as const
  expect(headOf(page("content/seo/small-models"), CONTEXT).indexable).toBe(true)
  expect(headOf(page("content/seo/diary"), CONTEXT).indexable).toBe(false)
  expect(
    headOf({ kind: "tag", title: "#private/work", url: "/tags/private/work", tag: "private/work" }, CONTEXT).indexable,
  ).toBe(false)
  expect(headOf({ kind: "404", title: "Not Found", url: "/404" }, CONTEXT).indexable).toBe(false)
})

test("a page is a website to Open Graph, with its title, description and address, in the site's name and language", () => {
  expect(headOf({ kind: "tag", title: "#garden", url: "/tags/garden", tag: "garden" }, CONTEXT).openGraph).toEqual({
    type: "website",
    siteName: "Chaotic Good Computing",
    locale: "en_US",
    title: "#garden",
    description:
      "Articles for the data and engineering consulting practice Chaotic Good Computing, as well as personal notes by Spencer Elkington.",
    url: "https://example.com/tags/garden",
  })
  const colophon = note("seo/colophon")
  const head = headOf({ kind: "note", title: colophon.title, url: colophon.url, note: colophon }, CONTEXT)
  expect(head.openGraph.type).toBe("website")
  expect(head.article).toBeUndefined()
})

test("an article is an article to Open Graph: its dates, its author, its section and its tags", () => {
  const tomatoes = note("content/seo/planting-tomatoes")
  const head = headOf(
    { kind: "note", title: tomatoes.title, description: tomatoes.description, url: tomatoes.url, note: tomatoes },
    CONTEXT,
  )
  expect(head.openGraph.type).toBe("article")
  expect(head.article).toMatchObject({
    publishedTime: "2026-03-04T10:00:00.000Z",
    author: "https://example.com/about",
    section: "Tutorials",
    tags: ["horticulture", "writing/tutorials"],
  })
  expect(head.article!.modifiedTime).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
  const undescribed = note("content/seo/undescribed")
  expect(
    headOf({ kind: "note", title: "Undescribed", url: undescribed.url, note: undescribed }, CONTEXT).article,
  ).toMatchObject({
    publishedTime: "2026-03-06T00:00:00.000Z",
    section: undefined,
    tags: ["garden"],
  })
})

const PUBLISHER = {
  "@type": "Organization",
  name: "Chaotic Good Computing",
  url: "https://example.com/about",
  logo: { "@type": "ImageObject", url: "https://example.com/_astro/icon.png" },
}

test("an article's JSON-LD is its type and section, its headline, dates, tags and share card, and the site's author and publisher", () => {
  const models = note("content/seo/small-models")
  const { structuredData } = headOf(
    { kind: "note", title: models.title, description: models.description, url: models.url, note: models },
    CONTEXT,
  )
  expect(structuredData).toEqual({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Small Models",
    url: "https://example.com/content/seo/small-models",
    mainEntityOfPage: "https://example.com/content/seo/small-models",
    description: "A note on small language models.",
    inLanguage: "en-US",
    datePublished: "2026-03-05T00:00:00.000Z",
    dateModified: expect.stringMatching(/^2026-|^20[3-9]\d-/),
    author: { "@type": "Person", name: "Spencer Elkington", url: "https://example.com/about" },
    publisher: PUBLISHER,
    articleSection: "Engineering",
    keywords: ["engineering/ai", "garden"],
    image: "https://example.com/share-cards/content/seo/small-models.png",
  })
})

test("a type that is no Article in schema.org has no section in its JSON-LD", () => {
  const tomatoes = note("content/seo/planting-tomatoes")
  const { structuredData } = headOf({ kind: "note", title: tomatoes.title, url: tomatoes.url, note: tomatoes }, CONTEXT)
  expect(structuredData).toMatchObject({ "@type": "HowTo", headline: "Planting Tomatoes" })
  expect(structuredData).not.toHaveProperty("articleSection")
})

test("the home page's JSON-LD is the website, and a page that is no article's has none", () => {
  expect(
    headOf({ kind: "home", title: "Fixture Home", url: "/", note: note("index") }, CONTEXT).structuredData,
  ).toEqual({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Chaotic Good Computing",
    url: "https://example.com/",
    description:
      "Articles for the data and engineering consulting practice Chaotic Good Computing, as well as personal notes by Spencer Elkington.",
    inLanguage: "en-US",
    publisher: PUBLISHER,
  })
  const colophon = note("seo/colophon")
  expect(
    headOf({ kind: "note", title: "Colophon", url: colophon.url, note: colophon }, CONTEXT).structuredData,
  ).toBeUndefined()
  expect(
    headOf({ kind: "tag", title: "#garden", url: "/tags/garden", tag: "garden" }, CONTEXT).structuredData,
  ).toBeUndefined()
})

// The site's rules, as the old site configured them (quartz-seo's `articleTypes`): first match wins.
test("a note's article type and section are the first rule's whose tag it is under", () => {
  expect(articleTypeOf(["writing/annotations"])).toEqual({ type: "ScholarlyArticle", section: "Annotations" })
  expect(articleTypeOf(["writing/tutorials"])).toEqual({ type: "HowTo", section: "Tutorials" })
  expect(articleTypeOf(["writing/articles"])).toEqual({ type: "Article", section: "Articles" })
  expect(articleTypeOf(["engineering"])).toEqual({ type: "TechArticle", section: "Engineering" })
  expect(articleTypeOf(["economics"])).toEqual({ type: "Article", section: "Economics" })
  expect(articleTypeOf(["horticulture"])).toEqual({ type: "BlogPosting", section: "Digital Garden" })
  expect(articleTypeOf(["projects"])).toEqual({ type: "Report", section: "Projects" })
})

test("the rules are tried in order, not the note's tags", () => {
  expect(articleTypeOf(["projects", "engineering", "writing/tutorials"])).toEqual({
    type: "HowTo",
    section: "Tutorials",
  })
})

test("a note under a rule's tag matches it, as a tag puts a note under each of its ancestors", () => {
  // The old site matched a tag only as written, so this note, tagged `writing/highlights,
  // engineering/ai, projects/site`, was an Article with no section.
  expect(articleTypeOf(["writing/highlights", "engineering/ai", "projects/site"])).toEqual({
    type: "TechArticle",
    section: "Engineering",
  })
  expect(articleTypeOf(["Engineering/AI"])).toEqual({ type: "TechArticle", section: "Engineering" })
  expect(articleTypeOf(["engineeringish"])).toEqual({ type: "Article" })
})

test("a note no rule matches is the default type, with no section", () => {
  expect(articleTypeOf(["garden"])).toEqual({ type: "Article" })
  expect(articleTypeOf([])).toEqual({ type: "Article" })
})

test("the default type and the rules are configuration's, the first rule that matches winning", () => {
  const config: SeoConfig = {
    ...seo,
    articleTypes: [
      { tag: "garden/herbs", type: "HowTo", section: "Herbs" },
      { tag: "garden", type: "Report", section: "Garden" },
    ],
    defaultArticleType: "BlogPosting",
  }
  expect(articleTypeOf(["kitchen"], config)).toEqual({ type: "BlogPosting" })
  expect(articleTypeOf(["garden/herbs/basil"], config)).toEqual({ type: "HowTo", section: "Herbs" })
  expect(articleTypeOf(["garden/trees"], config)).toEqual({ type: "Report", section: "Garden" })
})
