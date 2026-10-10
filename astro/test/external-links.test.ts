import { defineHastPlugin, markdownToHtml } from "satteri"
import { expect, test } from "vitest"
import { externalLinks } from "../src/lib/external-links.ts"

/** A note rendered with the external links plugin alone, for a site at blog.example.com. */
function render(source: string): string {
  const { html } = markdownToHtml(source, { hastPlugins: [externalLinks("https://blog.example.com")] })
  return html.trim()
}

test("a link to another site opens in a new tab, which it tells a screen reader and shows with an icon", () => {
  expect(render("[Astro](https://astro.build/docs)")).toMatch(
    /^<p><a href="https:\/\/astro.build\/docs" target="_blank" rel="noopener">Astro<span class="new-tab" role="img" aria-label="\(opens in a new tab\)"><svg viewBox="0 0 24 24" width="1em" height="1em"><path fill="currentColor" d="M14 3v2h3.59l-9.83 9.83[^"]*"><\/path><\/svg><\/span><\/a><\/p>$/,
  )
})

test("a bare address to another site opens in a new tab", () => {
  expect(render("See <http://example.org>.")).toContain('<a href="http://example.org" target="_blank" rel="noopener">')
})

test("a link to a page of the site, an attachment or a place on the page stays in the tab", () => {
  const html = render(
    "[home](/content/notes/a) [file](/assets/report.pdf) [section](#notes) [whole](https://blog.example.com/about)",
  )
  expect(html).toBe(
    '<p><a href="/content/notes/a">home</a> <a href="/assets/report.pdf">file</a> <a href="#notes">section</a> <a href="https://blog.example.com/about">whole</a></p>',
  )
})

test("a link that opens an application, mail or a phone, stays in the tab", () => {
  expect(render("[mail](mailto:me@example.org) [call](tel:+15550100)")).toBe(
    '<p><a href="mailto:me@example.org">mail</a> <a href="tel:+15550100">call</a></p>',
  )
})

test("a link to the site's own host by http stays in the tab", () => {
  expect(render("[about](http://blog.example.com/about)")).toBe('<p><a href="http://blog.example.com/about">about</a></p>')
})

test("a link given a target by a plugin before this one keeps it", () => {
  const framed = defineHastPlugin({
    name: "framed",
    element: { filter: ["a"], visit: (node, ctx) => ctx.setProperty(node, "target", "frame") },
  })
  const { html } = markdownToHtml("[framed](https://example.org)", {
    hastPlugins: [framed, externalLinks("https://blog.example.com")],
  })
  expect(html.trim()).toBe('<p><a href="https://example.org" target="frame">framed</a></p>')
})

test("a link written as HTML in a note is left as written", () => {
  expect(render('<a href="https://example.org">written</a>')).toBe('<p><a href="https://example.org">written</a></p>')
})
