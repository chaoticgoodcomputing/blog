import { obsidianFeatures, obsidianSyntax } from "@chaoticgoodcomputing/obsidian-markdown"
import { markdownToHtml } from "satteri"
import { expect, test } from "vitest"
import { imageCarousels } from "../src/lib/image-carousels.ts"

/** A note rendered with Obsidian's syntax and the image carousels. */
async function render(source: string): Promise<string> {
  const { html } = await markdownToHtml(source, {
    features: obsidianFeatures,
    mdastPlugins: obsidianSyntax({ tags: false }),
    hastPlugins: [imageCarousels()],
  })
  return html.trim()
}

/** The images of each carousel in `html`, by their `alt`. */
function carousels(html: string): string[][] {
  return [...html.matchAll(/<content-carousel class="image-carousel"[^>]*>(.*?)<\/content-carousel>/gs)].map((match) =>
    [...match[1]!.matchAll(/<img [^>]*alt="([^"]*)"/g)].map((image) => image[1]!),
  )
}

test("images on adjacent lines are one carousel, a slide each, in the order written", async () => {
  const html = await render("![a](a.png)\n![b](b.png)\n![c](c.png)")
  expect(carousels(html)).toEqual([["a", "b", "c"]])
  expect(html).not.toContain("<p>")
  expect(html.match(/<div class="slide"/g)).toHaveLength(3)
})

test("two images are enough for a carousel", async () => {
  expect(carousels(await render("![a](a.png)\n![b](b.png)"))).toEqual([["a", "b"]])
})

test("one image on its own is left as it is", async () => {
  expect(await render("![a](a.png)")).toBe('<p><img src="a.png" alt="a"></p>')
})

test("images with a blank line between them stay stacked", async () => {
  expect(await render("![a](a.png)\n\n![b](b.png)")).toBe('<p><img src="a.png" alt="a"></p>\n<p><img src="b.png" alt="b"></p>')
})

test("images on one line stay side by side", async () => {
  expect(await render("![a](a.png) ![b](b.png)")).toBe('<p><img src="a.png" alt="a"> <img src="b.png" alt="b"></p>')
})

test("text in the paragraph before or after the images stays a paragraph, either side of the carousel", async () => {
  const html = await render("Taken from a talk:\n![a](a.png)\n![b](b.png)\nThe end.")
  expect(carousels(html)).toEqual([["a", "b"]])
  expect(html).toMatch(/^<p>Taken from a talk:<\/p><content-carousel .*<\/content-carousel><p>The end\.<\/p>$/s)
})

test("a lone image beside text is left in its paragraph", async () => {
  expect(await render("Look:\n![a](a.png)")).toBe('<p>Look:\n<img src="a.png" alt="a"></p>')
})

test("a paragraph's block id stays on its first part, so a link to the block still finds it", async () => {
  const html = await render("Taken from a talk:\n![a](a.png)\n![b](b.png) ^77ff26")
  expect(html).toMatch(/^<p id="\^77ff26">Taken from a talk:<\/p><content-carousel /)

  const alone = await render("![a](a.png)\n![b](b.png) ^77ff26")
  expect(alone).toMatch(/^<content-carousel id="\^77ff26" class="image-carousel"/)
})

test("the carousel names itself and each slide for a screen reader, and has a button for each image", async () => {
  const html = await render("![a](a.png)\n![b](b.png)")
  expect(html).toContain('role="region" aria-roledescription="carousel" aria-label="Images"')
  expect(html).toContain('<div class="slide" role="group" aria-roledescription="slide" aria-label="2 of 2">')
  expect(html).toContain('aria-label="Previous image"')
  expect(html).toContain('aria-label="Next image"')
  expect(html.match(/<button type="button" class="dot"/g)).toHaveLength(2)
  expect(html).toContain('class="dot" data-index="1" aria-label="Image 2 of 2"')
})

test("a run inside a quote or a list item is a carousel too", async () => {
  expect(carousels(await render("> ![a](a.png)\n> ![b](b.png)"))).toEqual([["a", "b"]])
  expect(carousels(await render("- item\n\n  ![a](a.png)\n  ![b](b.png)"))).toEqual([["a", "b"]])
})
