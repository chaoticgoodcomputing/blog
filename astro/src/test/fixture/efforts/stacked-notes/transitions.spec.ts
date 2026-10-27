// Ephemeral (docs/adr/0006): the note's fold between pages, pinned while the stacked-notes effort
// (.scratch/stacked-notes) works on it.
import type { Page } from "@playwright/test"
import { expect, expectAt, test } from "../../../site.ts"

const start = "/client-side-navigation/start"
const destination = "/client-side-navigation/destination"

/** Clicks `link`, and gives back the animations the note's view transition plays: old's, then new's. */
async function foldOf(page: Page, click: () => Promise<void>) {
  const seen = page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const look = () => {
          const note = document.getAnimations().filter((animation) => /\((note)\)/.test((animation.effect as KeyframeEffect)?.pseudoElement ?? ""))
          const named = (part: string) =>
            note.find((animation) => (animation.effect as KeyframeEffect).pseudoElement === `::view-transition-${part}(note)`) as CSSAnimation | undefined
          if (named("old") && named("new")) resolve([named("old")!.animationName, named("new")!.animationName])
          else requestAnimationFrame(look)
        }
        look()
      }),
  )
  await click()
  return seen
}

test("following a link folds the note away to the left, and the next slides in", async ({ page }) => {
  await page.goto(start)
  const fold = await foldOf(page, () => page.getByRole("link", { name: "To the destination" }).click())
  expect(fold).toEqual(["note-fold-away", "note-slide-in"])
  await expectAt(page, destination)
})

test("going back along the trail, by a spine or a link to a note on it, unfolds the note it goes back to", async ({ page }) => {
  await page.goto(`${destination}?trail=${start}`)
  const bySpine = await foldOf(page, () => page.getByRole("navigation", { name: "Trail" }).getByRole("link").first().click())
  expect(bySpine).toEqual(["note-slide-away", "note-unfold"])
  await expectAt(page, start)

  await page.goto(`${destination}?trail=${start}`)
  const byLink = await foldOf(page, () => page.locator(".prose").getByRole("link", { name: "where navigation starts" }).click())
  expect(byLink).toEqual(["note-slide-away", "note-unfold"])
})

/** Whether the view transition of the navigation `click` starts plays: its animations are ready, or, skipped, never are. */
async function playedOn(page: Page, click: () => Promise<void>) {
  const played = page.evaluate(
    () =>
      new Promise<boolean>((resolve) =>
        document.addEventListener(
          "astro:before-swap",
          (event) => (event as unknown as { viewTransition: ViewTransition }).viewTransition.ready.then(() => resolve(true), () => resolve(false)),
          { once: true },
        ),
      ),
  )
  await click()
  return played
}

test("going to the note already shown, as the site's title does on the home page, has no fold", async ({ page }) => {
  await page.goto("/")
  expect(await playedOn(page, () => page.locator(".graph-column .site-title").click())).toBe(false)
  await expectAt(page, "/")
})

test("going to another note still folds", async ({ page }) => {
  await page.goto(start)
  expect(await playedOn(page, () => page.getByRole("link", { name: "To the destination" }).click())).toBe(true)
})
