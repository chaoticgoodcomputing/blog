import type { Page } from "@playwright/test"
import { SITE } from "../feed-and-sitemap.ts"
import { expect, test } from "../site.ts"
import { readStructuredData, structuredDataErrors } from "../structured-data.ts"

const SITE_DESCRIPTION =
  "Articles for the data and engineering consulting practice Chaotic Good Computing, as well as personal notes by Spencer Elkington."

// The content of the one element in the head that `selector` names.
async function head(page: Page, selector: string, attribute = "content"): Promise<string | null> {
  const element = page.locator(`head ${selector}`)
  await expect(element).toHaveCount(1)
  return element.getAttribute(attribute)
}

test("every page has a title with the site's suffix, a description, a canonical address, and Open Graph and Twitter tags", async ({
  page,
}) => {
  const pages = [
    { address: "/", title: "Fixture Home", description: SITE_DESCRIPTION, type: "website" },
    {
      address: "/content/seo/small-models",
      title: "Small Models",
      description: "A note on small language models.",
      type: "article",
    },
    { address: "/content/seo/undescribed", title: "Undescribed", description: SITE_DESCRIPTION, type: "article" },
    { address: "/seo/colophon", title: "Colophon", description: "How the site is made.", type: "website" },
    { address: "/404", title: "Not Found", description: SITE_DESCRIPTION, type: "website" },
  ]
  for (const { address, title, description, type } of pages) {
    await page.goto(address)
    await expect(page, address).toHaveTitle(`${title} | Spencer Elkington`)
    expect(await head(page, 'meta[name="description"]'), address).toBe(description)
    expect(await head(page, 'link[rel="canonical"]', "href"), address).toBe(`${SITE}${address}`)
    expect(await head(page, 'meta[property="og:title"]'), address).toBe(title)
    expect(await head(page, 'meta[property="og:description"]'), address).toBe(description)
    expect(await head(page, 'meta[property="og:url"]'), address).toBe(`${SITE}${address}`)
    expect(await head(page, 'meta[property="og:type"]'), address).toBe(type)
    expect(await head(page, 'meta[property="og:site_name"]'), address).toBe("Chaotic Good Computing")
    expect(await head(page, 'meta[property="og:locale"]'), address).toBe("en_US")
    // A page with a share card is a large image to Twitter, and the 404 page, with none, a summary.
    expect(await head(page, 'meta[name="twitter:card"]'), address).toBe(
      address === "/404" ? "summary" : "summary_large_image",
    )
  }
})

test("an article's head says when it was published, who wrote it, its section and its tags", async ({ page }) => {
  await page.goto("/content/seo/planting-tomatoes")
  expect(await head(page, 'meta[property="article:published_time"]')).toBe("2026-03-04T10:00:00.000Z")
  expect(await head(page, 'meta[property="article:modified_time"]')).toMatch(/^\d{4}-\d\d-\d\dT/)
  expect(await head(page, 'meta[property="article:author"]')).toBe(`${SITE}/about`)
  expect(await head(page, 'meta[property="article:section"]')).toBe("Tutorials")
  const tags = await page
    .locator('head meta[property="article:tag"]')
    .evaluateAll((metas) => metas.map((meta) => meta.getAttribute("content")))
  expect(tags).toEqual(["horticulture", "writing/tutorials"])
})

test("a private page asks not to be indexed, and a public page does not", async ({ page }) => {
  await page.goto("/content/seo/diary")
  expect(await head(page, 'meta[name="robots"]')).toBe("noindex")
  await page.goto("/404")
  expect(await head(page, 'meta[name="robots"]')).toBe("noindex")
  for (const address of ["/", "/content/seo/small-models", "/seo/colophon"]) {
    await page.goto(address)
    await expect(page.locator('head meta[name="robots"]'), address).toHaveCount(0)
  }
})

test("an article's JSON-LD type and section are its first matching rule's, with the site's author and publisher", async ({
  page,
}) => {
  await page.goto("/content/seo/small-models")
  const [models] = await readStructuredData(page)
  expect(models).toMatchObject({
    "@type": "TechArticle",
    articleSection: "Engineering",
    headline: "Small Models",
    author: { "@type": "Person", name: "Spencer Elkington", url: `${SITE}/about` },
    publisher: { "@type": "Organization", name: "Chaotic Good Computing", url: `${SITE}/about` },
  })
  // The publisher's logo is the site's icon, served by the site.
  const logo = (models!.publisher as { logo: { url: string } }).logo.url
  expect(logo.startsWith(`${SITE}/`)).toBe(true)
  expect((await page.request.get(new URL(logo).pathname)).headers()["content-type"]).toBe("image/png")

  await page.goto("/content/seo/planting-tomatoes")
  expect(await readStructuredData(page)).toMatchObject([{ "@type": "HowTo", headline: "Planting Tomatoes" }])
  await page.goto("/content/seo/undescribed")
  const [undescribed] = await readStructuredData(page)
  expect(undescribed).toMatchObject({ "@type": "Article", description: SITE_DESCRIPTION })
  expect(undescribed).not.toHaveProperty("articleSection")
})

test("the home page's JSON-LD is the website's, and a page that is no article has none", async ({ page }) => {
  await page.goto("/")
  expect(await readStructuredData(page)).toMatchObject([
    { "@type": "WebSite", name: "Chaotic Good Computing", url: `${SITE}/` },
  ])
  await page.goto("/seo/colophon")
  expect(await readStructuredData(page)).toEqual([])
})

test("the structured-data check refuses what schema.org does not allow", () => {
  const article = { "@context": "https://schema.org", "@type": "Article", headline: "A" }
  expect(structuredDataErrors(article)).toEqual([])
  // A HowTo is no Article, so it has no section.
  expect(structuredDataErrors({ ...article, "@type": "HowTo", articleSection: "Tutorials" })).toEqual([
    "$.articleSection: not a property of a HowTo, but of Article",
  ])
  expect(structuredDataErrors({ ...article, "@type": "Blogpost" })).toEqual([
    "$: Blogpost is not a type of schema.org's",
  ])
  expect(structuredDataErrors({ ...article, datePublished: "March 4" })).toEqual([
    '$.datePublished: "March 4", where datePublished takes Date, DateTime',
  ])
  expect(
    structuredDataErrors({ ...article, author: { "@type": "ImageObject", url: "https://example.com/a.png" } }),
  ).toEqual(["$.author: a ImageObject, where author takes Organization, Person"])
  expect(structuredDataErrors({ ...article, image: { "@type": "ImageObject", width: 184 } })).toEqual([
    "$.image.width: 184, where width takes Distance, QuantitativeValue",
  ])
  expect(structuredDataErrors({ ...article, "@context": "https://example.com" })).toEqual([
    "$: @context is not schema.org",
  ])
})
