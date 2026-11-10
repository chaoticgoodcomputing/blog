import { expect, test } from "vitest"
import { clampZoom, fit, steppedZoom, toPx } from "../src/lib/annotation-layout.ts"

// A card 20rem wide, at 16px to the rem.
const measures = (available: number) => ({ available, card: 320 })

test("the document takes the viewer's width, on a desktop as on a phone", () => {
  // The site shell's content column on a desktop, 1440px wide.
  expect(fit(measures(1072), 1)).toEqual({ documentWidth: 1072, mobile: false })
  // A tablet's column: the drawer is a card's width, and covers less than half of it.
  expect(fit(measures(700), 1)).toEqual({ documentWidth: 700, mobile: false })
  // A phone's: a card's width would cover more than half the screen, so the drawer is a phone's.
  expect(fit(measures(358), 1)).toEqual({ documentWidth: 358, mobile: true })
})

test("zoomed, the document is that many times as wide", () => {
  expect(fit(measures(1072), 0.5).documentWidth).toBe(536)
  expect(fit(measures(1072), 2).documentWidth).toBe(2144)
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
