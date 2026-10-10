import { expect, test } from "vitest"
import { bubbleParts, TAG_BUBBLE } from "../src/lib/tag-bubble.ts"

test("a tag bubble in a badge is a 32px circle with a 2.5px rim around an 18px icon", () => {
  expect(TAG_BUBBLE.diameter).toBe(32)
  expect(bubbleParts(32)).toEqual({ rim: 2.5, icon: 18 })
})

test("a tag bubble of any other size keeps the badge's proportions", () => {
  // The share card's 44px bubble: 2.5 and 18 parts in 32 of 44.
  expect(bubbleParts(44)).toEqual({ rim: 3.4375, icon: 24.75 })
  // The tag explorer's, at 1.5rem.
  expect(bubbleParts(24)).toEqual({ rim: 1.875, icon: 13.5 })
})
