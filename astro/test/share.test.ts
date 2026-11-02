import { expect, test } from "vitest"
import { hasIcon } from "../src/lib/icons.ts"
import { shareMethods } from "../src/lib/share.ts"

const page = { title: "Pruning roses & more", address: "https://blog.chaoticgood.computer/garden/pruning-roses" }
const methods = shareMethods(page)
const intent = (name: string) => new URL(methods.find((method) => method.name === name)!.href!)

test("a page is shared by copying its address, its QR code, Bluesky, LinkedIn and X, in that order", () => {
  expect(methods.map((method) => method.name)).toEqual(["Copy link", "QR code", "Bluesky", "LinkedIn", "X"])
})

test("every way to share is drawn with an icon some collection has", () => {
  for (const method of methods) expect(hasIcon(method.icon), method.icon).toBe(true)
})

test("each way is the page's own action or a service's intent, never both", () => {
  for (const method of methods) expect(method.action === undefined).toBe(method.href !== undefined)
})

test("Bluesky's composer opens with the title and the address as the post's text", () => {
  const url = intent("Bluesky")
  expect(url.origin + url.pathname).toBe("https://bsky.app/intent/compose")
  expect(url.searchParams.get("text")).toBe(`${page.title}\n\n${page.address}`)
})

test("LinkedIn is given the address alone", () => {
  const url = intent("LinkedIn")
  expect(url.origin + url.pathname).toBe("https://www.linkedin.com/sharing/share-offsite/")
  expect([...url.searchParams]).toEqual([["url", page.address]])
})

test("X's composer is given the title and the address apart", () => {
  const url = intent("X")
  expect(url.origin + url.pathname).toBe("https://x.com/intent/post")
  expect(url.searchParams.get("text")).toBe(page.title)
  expect(url.searchParams.get("url")).toBe(page.address)
})
