import { builtPages } from "../build.ts"
import { expect, test } from "../site.ts"
import { structuredDataErrors } from "../structured-data.ts"

test("every page the vault builds has its head, and JSON-LD that a structured-data validator passes", () => {
  const pages = builtPages("vault")
  expect(pages.length).toBeGreaterThan(0)
  const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0
  let items = 0
  for (const { file, html } of pages) {
    expect(html, file).toMatch(/<title>[^<]+ \| Spencer Elkington<\/title>/)
    expect(count(html, /<title>/g), file).toBe(1)
    expect(count(html, /<meta name="description" content="[^"]+">/g), file).toBe(1)
    expect(count(html, /<link rel="canonical" href="https:\/\/blog\.chaoticgood\.computer\/[^"]*">/g), file).toBe(1)
    for (const property of ["og:type", "og:title", "og:description", "og:url", "og:site_name"]) {
      const tag = new RegExp(`<meta property="${property}" content="[^"]+">`, "g")
      expect(count(html, tag), `${file} ${property}`).toBe(1)
    }
    expect(count(html, /<meta name="twitter:card" content="[^"]+">/g), file).toBe(1)
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) {
      expect(structuredDataErrors(JSON.parse(json!)), file).toEqual([])
      items++
    }
  }
  // Every article and the home page have JSON-LD.
  expect(items).toBeGreaterThan(0)
})
