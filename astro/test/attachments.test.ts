import { execFileSync } from "node:child_process"
import fs from "node:fs"
import http from "node:http"
import type { AddressInfo } from "node:net"
import os from "node:os"
import path from "node:path"
import type { Vault, VaultFile } from "@chaoticgoodcomputing/obsidian-markdown"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { assembleVault } from "../src/lib/assembly.ts"
import { attachmentAddresses, attachmentAddressOf, serveAttachments } from "../src/lib/attachments.ts"
import { openVault } from "../src/lib/vault.ts"

// A vault of this file's own, in a repository of its own, so that git ignores some of it.
const FILES: Record<string, string> = {
  "notes/paper.md": "See [[Thesis Draft.pdf]], [the photo](../assets/linked.png), and ![[embedded.png]].\n",
  "notes/data.json": "{}",
  "assets/Thesis Draft.pdf": "%PDF",
  "assets/structure.pdb": "ATOM",
  "assets/README": "no extension",
  "assets/linked.png": "png",
  "assets/embedded.png": "png",
  "assets/.hidden.txt": "a dotfile",
  ".obsidian/app.json": "{}",
  "assets/.gitignore": "mirrors/*\n!.gitkeep\nscratch.txt\n",
  "assets/mirrors/.gitkeep": "",
  "assets/mirrors/paper.pdf": "%PDF",
  "assets/scratch.txt": "ignored",
}

let repo: string
let vault: Vault

beforeAll(async () => {
  repo = fs.mkdtempSync(path.join(os.tmpdir(), "astro-attachments-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(repo, "vault", file)), { recursive: true })
    fs.writeFileSync(path.join(repo, "vault", file), contents)
  }
  execFileSync("git", ["init", "--quiet"], { cwd: repo, stdio: "pipe" })
  // Read as the site reads its own: assembled first, which is where what git ignores is left out.
  assembleVault([path.join(repo, "vault")], path.join(repo, "site"))
  vault = await openVault(path.join(repo, "site"))
})

afterAll(() => fs.rmSync(repo, { recursive: true, force: true }))

test("every attachment that is no image is published at its path in the vault, and no note is", () => {
  const addresses = attachmentAddresses(vault)
  expect(addresses.get("/assets/Thesis Draft.pdf")?.path).toBe("assets/Thesis Draft.pdf")
  expect(addresses.get("/assets/structure.pdb")?.path).toBe("assets/structure.pdb")
  expect(addresses.get("/assets/README")?.path).toBe("assets/README")
  expect(addresses.get("/notes/data.json")?.path).toBe("notes/data.json")
  expect(addresses.has("/notes/paper.md")).toBe(false)
})

test("an image is published at its path only when a note links to it rather than embeds it", () => {
  const addresses = attachmentAddresses(vault)
  expect(addresses.get("/assets/linked.png")?.path).toBe("assets/linked.png")
  expect(addresses.has("/assets/embedded.png")).toBe(false)
})

test("a dotfile, a file in a dot-folder, and a file git ignores are not published", () => {
  const published = [...attachmentAddresses(vault).keys()]
  expect(published).not.toContain("/assets/.hidden.txt")
  expect(published).not.toContain("/.obsidian/app.json")
  expect(published).not.toContain("/assets/.gitignore")
  expect(published).not.toContain("/assets/mirrors/paper.pdf")
  expect(published).not.toContain("/assets/scratch.txt")
  expect(vault.getFileByPath("assets/scratch.txt")).toBeNull()
})

test("an address on the site names an attachment by its path, not percent-encoded, with no query or fragment", () => {
  expect(attachmentAddressOf("/assets/Thesis%20Draft.pdf")).toBe("/assets/Thesis Draft.pdf")
  expect(attachmentAddressOf("/assets/Thesis%20Draft.pdf?download=1#page=2")).toBe("/assets/Thesis Draft.pdf")
  expect(attachmentAddressOf("/assets/caf%C3%A9.pdf")).toBe("/assets/café.pdf")
})

test("an address that is not from the site's root, or that can't be decoded, names no attachment", () => {
  expect(attachmentAddressOf("assets/Thesis Draft.pdf")).toBeUndefined()
  expect(attachmentAddressOf("//cdn.example.com/assets/paper.pdf")).toBeUndefined()
  expect(attachmentAddressOf("https://example.com/assets/paper.pdf")).toBeUndefined()
  expect(attachmentAddressOf("/assets/50%.pdf")).toBeUndefined()
})

// The dev server's middleware, in a server of this file's own: what it does not serve is the
// server's 404, as it would be Vite's or Astro's to answer.
describe("on the dev server", () => {
  let server: http.Server
  let base: string
  let published: Map<string, VaultFile>

  beforeAll(async () => {
    published = attachmentAddresses(vault)
    const middleware = serveAttachments(vault.root, () => published)
    server = http.createServer((request, response) =>
      middleware(request, response, () => {
        response.statusCode = 404
        response.end("passed on")
      }),
    )
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))

  const get = async (address: string, method = "GET") => {
    const response = await fetch(`${base}${address}`, { method })
    return { status: response.status, body: await response.text() }
  }

  test("an attachment is served at its address, from its file in the vault", async () => {
    expect(await get("/assets/structure.pdb")).toEqual({ status: 200, body: "ATOM" })
    expect(await get("/assets/Thesis%20Draft.pdf")).toEqual({ status: 200, body: "%PDF" })
    expect(await get("/assets/linked.png")).toEqual({ status: 200, body: "png" })
  })

  test("a note, an embedded image, a dotfile and a file git ignores are passed on", async () => {
    for (const address of [
      "/notes/paper.md",
      "/assets/embedded.png",
      "/assets/.hidden.txt",
      "/assets/scratch.txt",
      "/nowhere.pdf",
    ]) {
      expect(await get(address), address).toEqual({ status: 404, body: "passed on" })
    }
  })

  test("only a request to read is served", async () => {
    expect((await get("/assets/structure.pdb", "POST")).status).toBe(404)
    expect((await get("/assets/structure.pdb", "HEAD")).status).toBe(200)
  })

  test("a file added to the vault after the server started is served once the vault has it", async () => {
    fs.writeFileSync(path.join(repo, "vault/assets/added.pdb"), "ADDED")
    assembleVault([path.join(repo, "vault")], vault.root)
    expect((await get("/assets/added.pdb")).status).toBe(404)
    published = attachmentAddresses(await openVault(vault.root))
    expect(await get("/assets/added.pdb")).toEqual({ status: 200, body: "ADDED" })
  })
})
