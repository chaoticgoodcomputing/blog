// node --test .github/workflows/scripts/*.test.mjs
import assert from "node:assert/strict"
import { test } from "node:test"
import { POST_LIMIT, postText } from "./post-to-bluesky.mjs"

const length = (text) => [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text)].length

test("a post is its title, then its description where it all fits", () => {
  assert.equal(postText("Dashes", "On  why I\nkeep them."), 'New blog post: "Dashes"\n\nOn why I keep them.')
})

test("a post with no description is its title alone", () => {
  assert.equal(postText("Dashes", ""), 'New blog post: "Dashes"')
  assert.equal(postText("Dashes"), 'New blog post: "Dashes"')
})

test("a description too long to fit is cut at a word, with an ellipsis, inside the limit", () => {
  const description = "word ".repeat(100).trim()
  const text = postText("A Title", description)
  assert.ok(length(text) <= POST_LIMIT, `${length(text)} graphemes`)
  assert.match(text, /^New blog post: "A Title"\n\n(word )+word…$/)
})

test("graphemes, not code units, are counted", () => {
  const description = "👩‍👩‍👧 ".repeat(200).trim()
  assert.ok(length(postText("Family", description)) <= POST_LIMIT)
})
