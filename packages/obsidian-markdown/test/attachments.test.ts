import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { after, before, test } from "node:test"
import { markdownToHtml } from "satteri"
import { Vault, isAudioFile, isImageFile, isVideoFile, obsidian, obsidianFeatures } from "../src/index.ts"

const FILES: Record<string, string> = {
  "notes/paper.md": "A note with attachments.\n",
  "notes/beside.txt": "beside the note",
  "assets/Thesis Draft.pdf": "not really a pdf",
  "assets/model.pdb": "not really a structure",
  "assets/secret.pdf": "a file the site publishes nowhere",
  "assets/photo.png": "not really a png",
  "assets/clip.mp4": "not really a video",
  "assets/song.mp3": "not really audio",
  "assets/unpublished.mp4": "a video the site publishes nowhere",
}

let root: string
let vault: Vault

before(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-markdown-"))
  for (const [file, contents] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), contents)
  }
  vault = await Vault.open(root)
})

after(() => fs.rmSync(root, { recursive: true, force: true }))

// The note is notes/paper.md, and a file is published at its path in the vault, but for one.
const render = async (source: string) =>
  (
    await markdownToHtml(source, {
      features: obsidianFeatures,
      mdastPlugins: obsidian({
        vault,
        urlFor: (file) => (["secret", "unpublished"].includes(file.basename) ? undefined : `/${encodeURI(file.path)}`),
      }),
      fileURL: pathToFileURL(path.join(vault.root, "notes/paper.md")),
    })
  ).html.trim()

test("a wikilink to an attachment goes to the attachment's address", async () => {
  assert.equal(
    await render("[[Thesis Draft.pdf]]"),
    '<p><a class="internal-link" href="/assets/Thesis%20Draft.pdf" data-href="Thesis Draft.pdf">Thesis Draft.pdf</a></p>',
  )
  assert.equal(
    await render("[[model.pdb|the structure]]"),
    '<p><a class="internal-link" href="/assets/model.pdb" data-href="model.pdb">the structure</a></p>',
  )
})

test("a subpath on a link to an attachment is kept as written: it is the file's own fragment, not a heading", async () => {
  assert.equal(
    await render("[[Thesis Draft.pdf#page=2]]"),
    '<p><a class="internal-link" href="/assets/Thesis%20Draft.pdf#page=2" data-href="Thesis Draft.pdf#page=2">Thesis Draft.pdf &gt; page=2</a></p>',
  )
  assert.equal(
    await render("[page two](../assets/Thesis%20Draft.pdf#page=2)"),
    '<p><a href="/assets/Thesis%20Draft.pdf#page=2" class="internal-link" data-href="../assets/Thesis Draft.pdf#page=2">page two</a></p>',
  )
})

test("an attachment is named with its extension: without it, the link names a note", async () => {
  assert.match(await render("[[model]]"), /<a class="internal-link is-unresolved" href="model"/)
})

test("a Markdown link to an attachment goes to the attachment's address, however the note reaches it", async () => {
  const link = (href: string, written: string, text: string) =>
    `<p><a href="${href}" class="internal-link" data-href="${written}">${text}</a></p>`

  // From the note's own folder, by the shortest path, from the vault's root, and with a space
  // written as Markdown needs it.
  assert.equal(await render("[the pdb](../assets/model.pdb)"), link("/assets/model.pdb", "../assets/model.pdb", "the pdb"))
  assert.equal(await render("[the pdb](model.pdb)"), link("/assets/model.pdb", "model.pdb", "the pdb"))
  assert.equal(await render("[beside](beside.txt)"), link("/notes/beside.txt", "beside.txt", "beside"))
  assert.equal(await render("[the pdb](/assets/model.pdb)"), link("/assets/model.pdb", "/assets/model.pdb", "the pdb"))
  assert.equal(
    await render("[my thesis](../assets/Thesis%20Draft.pdf)"),
    link("/assets/Thesis%20Draft.pdf", "../assets/Thesis Draft.pdf", "my thesis"),
  )
})

test("a Markdown link to an image goes to the image's address", async () => {
  assert.match(await render("[the photo](photo.png)"), /<a href="\/assets\/photo.png" class="internal-link"/)
})

test("a Markdown link to a file the site publishes nowhere is unresolved, and keeps the address it was written with", async () => {
  assert.equal(
    await render("[hidden](../assets/secret.pdf)"),
    '<p><a href="../assets/secret.pdf" class="internal-link is-unresolved" data-href="../assets/secret.pdf">hidden</a></p>',
  )
})

test("a Markdown link that names no file of the vault, leaves the vault or stays in its page is left as written", async () => {
  assert.equal(await render("[the feed](/index.xml)"), '<p><a href="/index.xml">the feed</a></p>')
  assert.equal(await render("[out](https://example.com/a.pdf)"), '<p><a href="https://example.com/a.pdf">out</a></p>')
  assert.equal(await render("[mail](mailto:a@example.com)"), '<p><a href="mailto:a@example.com">mail</a></p>')
  assert.equal(await render("[below](#below)"), '<p><a href="#below">below</a></p>')
})

test("an embed of an attachment that is no image is a link to it, marked as an embed", async () => {
  assert.equal(
    await render("![[Thesis Draft.pdf]]"),
    '<p><a class="internal-embed" data-src="Thesis Draft.pdf" href="/assets/Thesis%20Draft.pdf" data-href="Thesis Draft.pdf">Thesis Draft.pdf</a></p>',
  )
  assert.match(await render("![[secret.pdf]]"), /<a class="internal-embed is-unresolved" data-src="secret.pdf" href="secret.pdf"/)
})

test("an embedded image is still an image, by a path from the note", async () => {
  assert.equal(await render("![[photo.png]]"), '<p><img src="../assets/photo.png" alt="photo"></p>')
})

test("a file is an image when an embed of it is one", () => {
  assert.equal(isImageFile(vault.getFileByPath("assets/photo.png")!), true)
  assert.equal(isImageFile(vault.getFileByPath("assets/model.pdb")!), false)
  assert.equal(isImageFile(vault.getFileByPath("notes/paper.md")!), false)
})

test("an embedded video is played in place, from its address, as wide as its alias says, with its text inside for a browser that can't", async () => {
  assert.equal(
    await render("![[clip.mp4]]"),
    '<p><video class="internal-embed video-embed" data-src="clip.mp4" src="/assets/clip.mp4" controls preload="metadata" playsinline data-href="clip.mp4">clip.mp4</video></p>',
  )
  assert.match(await render("![[clip.mp4|400]]"), /<video [^>]*src="\/assets\/clip.mp4" [^>]*width="400"/)
  // A time in the clip, as a media fragment.
  assert.match(await render("![[clip.mp4#t=10]]"), /<video [^>]*src="\/assets\/clip.mp4#t=10"/)
})

test("embedded audio is played in place, and a link to either is still a link", async () => {
  assert.equal(
    await render("![[song.mp3]]"),
    '<p><audio class="internal-embed audio-embed" data-src="song.mp3" src="/assets/song.mp3" controls preload="metadata" data-href="song.mp3">song.mp3</audio></p>',
  )
  assert.match(await render("[[clip.mp4]]"), /^<p><a class="internal-link" href="\/assets\/clip.mp4"/)
})

test("an embedded video with no address stays an unresolved embed", async () => {
  assert.match(await render("![[unpublished.mp4]]"), /<a class="internal-embed is-unresolved"/)
})

test("video and audio are told apart by their extensions", () => {
  assert.equal(isVideoFile(vault.getFileByPath("assets/clip.mp4")!), true)
  assert.equal(isAudioFile(vault.getFileByPath("assets/song.mp3")!), true)
  assert.equal(isVideoFile(vault.getFileByPath("assets/song.mp3")!), false)
})
