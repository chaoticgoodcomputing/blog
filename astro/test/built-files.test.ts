import { expect, test } from "vitest"
import { builtFileOf } from "../src/lib/built-files.ts"

test("a page's built file is its address with .html after it, and the home page's is index.html", () => {
  expect(builtFileOf("/")).toBe("index.html")
  expect(builtFileOf("/content/notes/alpha")).toBe("content/notes/alpha.html")
  expect(builtFileOf("/tags")).toBe("tags.html")
})

test("an address percent-encoded or not names the same file, its name as the vault has it", () => {
  expect(builtFileOf("/content/Caf%C3%A9%20Notes")).toBe("content/Café Notes.html")
  expect(builtFileOf("/content/Café Notes")).toBe("content/Café Notes.html")
})
