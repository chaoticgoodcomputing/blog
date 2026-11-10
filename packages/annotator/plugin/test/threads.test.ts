// Deleting an annotation in the sidebar: a thread is one thing to the reader, so its root goes with
// its replies, and their replies.

import assert from "node:assert/strict"
import { test } from "node:test"
import { readNote } from "@chaoticgoodcomputing/web-annotations"
import { removeThread } from "../src/threads.ts"
import { annotate, reply } from "./notes.ts"

const PDF = "https://example.org/a.pdf"
const PREFACE = `---\nannotation-target: ${PDF}\n---\n\nThe preface.\n`

function note() {
  let text = annotate(PREFACE, "root", PDF, "first passage", "A root.")
  text = annotate(text, "other", PDF, "second passage", "Another root.")
  text = reply(text, "r1", "root", "A reply.")
  text = reply(text, "r2", "r1", "A reply to the reply.")
  text = reply(text, "r3", "other", "A reply to the other.")
  return `${text}\nThe epilogue.\n`
}

const ids = (text: string) => readNote(text).annotations.map((annotation) => annotation.blockId)

test("removing a thread's root removes its replies, and theirs", () => {
  const after = removeThread(note(), "root")
  assert.deepEqual(ids(after), ["other", "r3"])
  assert.ok(after.includes("The preface.") && after.endsWith("The epilogue.\n"))
  assert.deepEqual(readNote(after).errors, [])
})

test("removing a reply removes it and the replies to it, and leaves its parent", () => {
  assert.deepEqual(ids(removeThread(note(), "r1")), ["root", "other", "r3"])
  assert.deepEqual(ids(removeThread(note(), "r3")), ["root", "r1", "r2", "other"])
})

test("removing every annotation leaves the preface and the epilogue", () => {
  let text = note()
  for (const id of ["root", "other"]) text = removeThread(text, id)
  assert.deepEqual(ids(text), [])
  assert.ok(text.startsWith(PREFACE) && text.endsWith("The epilogue.\n"))
})
