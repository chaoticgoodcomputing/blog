import { expect, test } from "vitest"
import { clampZoom, fit, stack, steppedZoom, toPx } from "../src/lib/annotation-layout.ts"

// A card 20rem wide, a document no narrower than 36rem beside it, at 16px to the rem: the margin
// needs 320 + 576 + the 3rem gap between them, 944px.
const measures = (available: number) => ({ available, margin: 320, minDocument: 576, rem: 16 })

test("where the document fits beside a column of cards, they are its margin, and the document takes the rest", () => {
  // The site shell's content column on a desktop, 1440px wide.
  expect(fit(measures(1072), 1, false)).toEqual({ layout: "margin", documentWidth: 1072 - 320 - 48, mobile: false })
  expect(fit(measures(944), 1, false)).toEqual({ layout: "margin", documentWidth: 576, mobile: false })
})

test("the document beside the margin is never wider than 60rem", () => {
  expect(fit(measures(2000), 1, false).documentWidth).toBe(960)
})

test("where it doesn't, the cards are a drawer, and the document takes the column", () => {
  // A tablet's column: the drawer is a card's width, and covers less than half of it.
  expect(fit(measures(700), 1, false)).toEqual({ layout: "drawer", documentWidth: 700, mobile: false })
  // A phone's: a card's width would cover more than half the screen, so the drawer is a phone's.
  expect(fit(measures(358), 1, false)).toEqual({ layout: "drawer", documentWidth: 358, mobile: true })
})

test("zoomed, the document is that many times as wide, and zoomed past the margin it turns into the drawer", () => {
  expect(fit(measures(1072), 0.5, false)).toEqual({ layout: "margin", documentWidth: 352, mobile: false })
  // 704 × 1.25 = 880, and 880 + 320 + 48 is wider than the column.
  expect(fit(measures(1072), 1.25, false)).toEqual({ layout: "drawer", documentWidth: 1072, mobile: false })
  expect(fit(measures(1072), 2, false)).toEqual({ layout: "drawer", documentWidth: 1408, mobile: false })
  expect(fit(measures(700), 2, false).documentWidth).toBe(1400)
})

test("with the margin hidden, the document takes the column, and the cards stay out of the drawer", () => {
  expect(fit(measures(1072), 1, true)).toEqual({ layout: "margin", documentWidth: 1072, mobile: false })
  expect(fit(measures(700), 1, true)).toEqual({ layout: "drawer", documentWidth: 700, mobile: false })
})

test("each card is level with its passage, or just below the card above it", () => {
  // Three cards 100px tall, 12px apart: the second's passage is too near the first's.
  expect(stack([50, 100, 400], [100, 100, 100], -1, 12)).toEqual([50, 162, 400])
  // One whose passage is above the margin's top starts at it.
  expect(stack([-20, 300], [100, 100], -1, 12)).toEqual([0, 300])
})

test("the selected card is level with its passage, and those above it move up to make room", () => {
  expect(stack([200, 210, 400], [100, 100, 100], 1, 12)).toEqual([98, 210, 400])
  // Pushed above the top, they stack from the top down again.
  expect(stack([50, 100, 400], [100, 100, 100], 1, 12)).toEqual([50, 162, 400])
})

test("a length is read in pixels from px or rem", () => {
  expect(toPx("20rem", 16)).toBe(320)
  expect(toPx("300px", 16)).toBe(300)
})

test("the zoom steps from one of the bar's steps to the next, and is held between 50% and 300%", () => {
  expect(steppedZoom(1, 1)).toBe(1.1)
  expect(steppedZoom(1, -1)).toBe(0.9)
  // From between two steps, to the nearer one that way.
  expect(steppedZoom(1.3, 1)).toBe(1.5)
  expect(steppedZoom(1.3, -1)).toBe(1.25)
  expect(steppedZoom(3, 1)).toBe(3)
  expect(steppedZoom(0.5, -1)).toBe(0.5)
  expect(clampZoom(5)).toBe(3)
  expect(clampZoom(0.1)).toBe(0.5)
  expect(clampZoom(Number.NaN)).toBe(1)
})
