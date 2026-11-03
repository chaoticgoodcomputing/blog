import { expect, test } from "vitest"
import { tagNameAddresses, tagNameClashes } from "../src/lib/tag-names.ts"

test("a name two tags have is a clash, whatever the case", () => {
  const clashes = tagNameClashes(["engineering", "engineering/ai", "writing", "writing/AI", "garden/seasons"])
  expect([...clashes]).toEqual([["ai", ["engineering/ai", "writing/AI"]]])
})

test("a top-level tag and a nested one of the same name clash", () => {
  expect([...tagNameClashes(["essays", "writing/essays"]).keys()]).toEqual(["essays"])
})

test("each nested tag's name is an address of its page; a top-level tag's page is already there", () => {
  const addresses = tagNameAddresses(["engineering", "engineering/ai", "garden", "garden/seasons/spring"])
  expect([...addresses]).toEqual([
    ["/tags/ai", "/tags/engineering/ai"],
    ["/tags/spring", "/tags/garden/seasons/spring"],
  ])
})

test("a name more than one tag has is the address of none", () => {
  expect([...tagNameAddresses(["a/ai", "b/ai", "c/data"])]).toEqual([["/tags/data", "/tags/c/data"]])
})
