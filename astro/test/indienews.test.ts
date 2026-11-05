import { markdownToHtml } from "satteri"
import { expect, test } from "vitest"
import { indieNews, isIndieNews } from "../src/lib/indienews.ts"

/** A note rendered with the IndieNews plugin alone. */
function render(source: string): string {
  return markdownToHtml(source, { hastPlugins: [indieNews()] }).html.trim()
}

test("a link to an IndieNews language page is the note's copy there", () => {
  expect(render("[IndieWeb itself](https://news.indieweb.org/en)")).toBe(
    '<p><a href="https://news.indieweb.org/en" class="u-syndication">IndieWeb itself</a></p>',
  )
})

test("only a language page submits: not IndieNews's home page, nor a story on it", () => {
  expect(isIndieNews("https://news.indieweb.org/sv/")).toBe(true)
  expect(isIndieNews("https://news.indieweb.org/pt-br")).toBe(true)
  expect(isIndieNews("https://news.indieweb.org/")).toBe(false)
  expect(isIndieNews("https://news.indieweb.org/en/2026/11/some-story")).toBe(false)
  expect(isIndieNews("https://indieweb.org/en")).toBe(false)
  expect(render("[news](https://news.indieweb.org/)")).toBe('<p><a href="https://news.indieweb.org/">news</a></p>')
})
