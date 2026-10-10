import { expect, test } from "vitest"
import { sourcePath } from "../src/lib/source-link.ts"

test("a note's text is at its path in the vault, under the vault's folder in the repository", () => {
  expect(sourcePath({ path: "notes/a note.md" }, "content/public")).toBe("content/public/notes/a note.md")
})
