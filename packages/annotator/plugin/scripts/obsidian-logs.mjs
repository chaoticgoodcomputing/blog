// Streams the logs of a running Obsidian: every console message and uncaught error of its window,
// and of the frames in it (the Annotator's viewer and sidebar pages among them), to the terminal and
// to logs/obsidian.log. It attaches over the Chrome DevTools Protocol, so Obsidian has to have been
// started with remote debugging on (scripts/obsidian-debug.mjs, `nx run annotator:obsidian`).
//
//   node scripts/obsidian-logs.mjs [--port=9222] [--reload] [--open=<note>] [--seconds=<n>]
//
//   --reload       reload Obsidian's window once attached, to log the plugins' starting
//   --open=<note>  open a note, by its link text or path, once attached (and reloaded)
//   --seconds=<n>  stop after n seconds; without it, stream until stopped

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { chromium } from "@playwright/test"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const { values } = parseArgs({
  options: {
    port: { type: "string", default: "9222" },
    reload: { type: "boolean", default: false },
    open: { type: "string" },
    seconds: { type: "string" },
  },
})

const logFile = path.join(root, "logs", "obsidian.log")
fs.mkdirSync(path.dirname(logFile), { recursive: true })
const out = fs.createWriteStream(logFile)
const log = (line) => {
  const stamped = `${new Date().toISOString().slice(11, 23)} ${line}`
  console.log(stamped)
  out.write(`${stamped}\n`)
}

let browser
try {
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${values.port}`)
} catch {
  console.error(`No Obsidian with remote debugging on port ${values.port}. Start it with \`pnpm nx run annotator:obsidian\`.`)
  process.exit(1)
}

/** A frame's name in the log: the page it shows, shortened to what tells the frames apart. */
const nameOf = (frame) => {
  const url = frame.url()
  if (url.includes("/frames/viewer.html")) return "viewer"
  if (url.includes("/frames/sidebar.html")) return "sidebar"
  if (url.startsWith("app://obsidian.md")) return "obsidian"
  return url.slice(0, 60) || "frame"
}

const watched = new WeakSet()
function watch(page) {
  if (watched.has(page)) return
  watched.add(page)
  page.on("console", (message) => {
    const location = message.location()
    const where = location?.url ? ` (${location.url.split("/").pop()}:${location.lineNumber})` : ""
    log(`[${nameOf(message.page()?.mainFrame() ?? page.mainFrame())}] ${message.type()}: ${message.text()}${message.type() === "error" ? where : ""}`)
  })
  page.on("pageerror", (error) => log(`[${nameOf(page.mainFrame())}] uncaught: ${error.stack ?? error.message}`))
  page.on("frameattached", (frame) => log(`[frames] attached ${nameOf(frame)} ${frame.url()}`))
  page.on("framenavigated", (frame) => frame !== page.mainFrame() && log(`[frames] loaded ${nameOf(frame)} ${frame.url()}`))
  page.on("requestfailed", (request) => {
    if (request.url().startsWith("https://annotator.invalid/")) return // the sidebar's preloads of the fake API: expected
    log(`[network] failed ${request.url()}: ${request.failure()?.errorText}`)
  })
  page.on("crash", () => log(`[${nameOf(page.mainFrame())}] crashed`))
}

for (const context of browser.contexts()) {
  context.on("page", watch)
  for (const page of context.pages()) watch(page)
}
const window_ = browser.contexts().flatMap((context) => context.pages()).find((page) => page.url().startsWith("app://obsidian.md"))
if (!window_) {
  console.error("Attached, but found no Obsidian window.")
  process.exit(1)
}
log(`[logs] attached to ${window_.url()}; writing ${path.relative(process.cwd(), logFile)}`)

if (values.reload) {
  log("[logs] reloading Obsidian's window")
  await window_.reload({ waitUntil: "load" })
  // Obsidian loads its plugins after the window does.
  await window_.waitForFunction(() => (window).app?.workspace?.layoutReady, null, { timeout: 60_000 }).catch(() => log("[logs] Obsidian's workspace never became ready"))
}

if (values.open) {
  log(`[logs] opening ${values.open}`)
  await window_.evaluate((note) => (window).app.workspace.openLinkText(note, "", false), values.open).catch((error) => log(`[logs] couldn't open ${values.open}: ${error.message}`))
}

const stop = async () => {
  out.end()
  // Detach from Obsidian, leaving it running.
  await browser.close().catch(() => {})
  process.exit(0)
}
process.on("SIGINT", stop)
if (values.seconds) setTimeout(stop, Number(values.seconds) * 1000)
