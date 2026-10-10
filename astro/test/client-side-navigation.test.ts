import { markdownToHtml } from "satteri"
import { expect, test } from "vitest"
import { attachmentLinks } from "../src/lib/attachment-links.ts"

// The attachments a site publishes, by address, as `publishedAttachments()` gives them.
const published = new Map([
  ["/assets/Thesis Draft.pdf", {}],
  ["/assets/structure.pdb", {}],
])

function render(source: string) {
  const { html } = markdownToHtml(source, { hastPlugins: [attachmentLinks(() => published)] })
  return html.trim()
}

test("a link to a published attachment is left to the browser, and never fetched ahead", () => {
  expect(render("[the thesis](/assets/Thesis%20Draft.pdf)")).toBe(
    '<p><a href="/assets/Thesis%20Draft.pdf" data-astro-reload="" data-astro-prefetch="false">the thesis</a></p>',
  )
})

test("a link to a place in a published attachment is left to the browser too", () => {
  expect(render("[page 3](/assets/Thesis%20Draft.pdf#page=3)")).toBe(
    '<p><a href="/assets/Thesis%20Draft.pdf#page=3" data-astro-reload="" data-astro-prefetch="false">page 3</a></p>',
  )
})

test("a link to a page, to another site, or to a file that is not published is left as it is", () => {
  expect(render("[a note](/content/notes/alpha)")).toBe('<p><a href="/content/notes/alpha">a note</a></p>')
  expect(render("[elsewhere](https://example.com/assets/structure.pdb)")).toBe(
    '<p><a href="https://example.com/assets/structure.pdb">elsewhere</a></p>',
  )
  expect(render("[gone](/assets/missing.pdf)")).toBe('<p><a href="/assets/missing.pdf">gone</a></p>')
})
