// The rest of the right sidebar, for the specs that prove a card's failure stays in its card:
// whichever components the fixture places beside the cards, each shows or hides as it does when
// nothing fails.
import { expect } from "../../../tests/harness/test.mjs"

// The sidebar's other components, each as a reader sees it: shown or hidden.
const restOfSidebar = (page) =>
  page
    .locator(".right.sidebar > :not(.cgc-social, :has(.cgc-social))")
    .evaluateAll((components) =>
      components.map((el) => `${el.className}: ${el.checkVisibility() ? "shown" : "hidden"}`),
    )

/** The rest of `page`'s right sidebar is as the same page shows it when nothing fails, and holds something shown. */
export async function expectRestOfSidebarUnaffected(page) {
  // A second page in the same context: the stand-ins answer it, the failing page's own routes don't.
  const clean = await page.context().newPage()
  await clean.goto(page.url())
  const expected = await restOfSidebar(clean)
  await clean.close()
  expect(expected).toContainEqual(expect.stringMatching(/: shown$/))
  expect(await restOfSidebar(page)).toEqual(expected)
}
