// ADR-0003's libraries-that-ship-CSS amendment: a library's CSS is checked, never transformed. The
// package's Nx `lint` target runs `lint-css.mjs`, which fails on anything a stylesheet puts outside
// its own block. The failing cases run it on a copy of `src/` with the escape planted,
// since the real tree is shared with the other specs.
import { test, expect } from "../../../tests/harness/test.mjs"
import { execFile } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const run = promisify(execFile)
const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

async function lint(root) {
  try {
    const { stdout, stderr } = await run("node", ["lint-css.mjs", ...(root ? [root] : [])], {
      cwd: pkg,
    })
    return { code: 0, output: stdout + stderr }
  } catch (err) {
    return { code: err.code ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}` }
  }
}

// A copy of the package's src/, with `plant(dir)` applied to it.
async function lintPlanted(plant) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-widgets-lint-"))
  try {
    fs.cpSync(path.join(pkg, "src"), dir, { recursive: true })
    plant(dir)
    return await lint(dir)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

const appendCss = (css) => (dir) =>
  fs.appendFileSync(path.join(dir, "pdf-viewer", "pdf-viewer.css"), `\n${css}\n`)

test("the real CSS passes", async () => {
  const { code, output } = await lint()
  expect(output).not.toMatch(/error/i)
  expect(code).toBe(0)
})

test("a planted un-namespaced selector fails, named with its file and line", async () => {
  // PDF.js's own bare selector, the one v4 had to fight with !important.
  const { code, output } = await lintPlanted(appendCss(".sidebar { display: none; }"))
  expect(code).not.toBe(0)
  expect(output).toMatch(/pdf-viewer[\\/]pdf-viewer\.css:\d+:\d+/)
  expect(output).toContain(".sidebar")
})

test("reaching out from an unowned ancestor fails, as does a bare pseudo-element", async () => {
  for (const css of [
    ":root .cgc-pdf-viewer { color: var(--dark); }",
    "::selection { background: var(--highlight); }",
    ":not(.cgc-pdf-viewer) > .left { position: static; }",
  ]) {
    const { code, output } = await lintPlanted(appendCss(css))
    expect(code, css).not.toBe(0)
    expect(output, css).toContain(css.slice(0, css.indexOf(" {")))
  }
})

test("another widget's block is outside this one's namespace", async () => {
  const { code, output } = await lintPlanted(appendCss(".cgc-bluesky-post__card { margin: 0; }"))
  expect(code).not.toBe(0)
  expect(output).toContain(".cgc-bluesky-post__card")
})

test("custom properties and keyframes are namespaced too", async () => {
  const property = await lintPlanted(appendCss(".cgc-pdf-viewer { --page-gap: 1rem; }"))
  expect(property.code).not.toBe(0)
  expect(property.output).toContain("--page-gap")
  const keyframes = await lintPlanted(
    appendCss("@keyframes spin { to { transform: rotate(1turn); } }"),
  )
  expect(keyframes.code).not.toBe(0)
  expect(keyframes.output).toContain("spin")
})

test("CSS imported from outside the package fails, since the check can't see it", async () => {
  const { code, output } = await lintPlanted((dir) => {
    const file = path.join(dir, "pdf-viewer", "index.tsx")
    fs.writeFileSync(
      file,
      `import "pdfjs-dist/web/pdf_viewer.css"\n${fs.readFileSync(file, "utf8")}`,
    )
  })
  expect(code).not.toBe(0)
  expect(output).toContain("pdfjs-dist/web/pdf_viewer.css")
})

test("the post card's block and the Bluesky widget's are two blocks", async () => {
  const { code, output } = await lintPlanted((dir) =>
    fs.appendFileSync(
      path.join(dir, "bluesky-post", "bluesky-post.css"),
      "\n.cgc-bluesky__text { margin: 0; }\n",
    ),
  )
  expect(code).not.toBe(0)
  expect(output).toMatch(/bluesky-post[\\/]bluesky-post\.css:\d+:\d+/)
  expect(output).toContain(".cgc-bluesky__text")
})

// A block's names are its own: /bluesky's `cgc-bluesky` is a prefix of the post card's
// `cgc-bluesky-post`, but a name in the longer block's namespace is still that block's.
test("the Bluesky widget's names don't reach into the post card's", async () => {
  for (const css of [
    ".cgc-bluesky { --cgc-bluesky-post-gap: 1rem; }",
    "@keyframes cgc-bluesky-post-spin { to { opacity: 0; } }",
  ]) {
    const { code, output } = await lintPlanted((dir) =>
      fs.appendFileSync(path.join(dir, "bluesky", "bluesky.css"), `\n${css}\n`),
    )
    expect(code, css).not.toBe(0)
    expect(output, css).toMatch(/bluesky[\\/]bluesky\.css:\d+:\d+/)
    expect(output, css).toContain("cgc-bluesky-post")
  }
})

test("a selector can't reach beside or above the block, nested or not", async () => {
  for (const [css, named] of [
    [".cgc-bluesky ~ p { margin: 0; }", ".cgc-bluesky ~ p"],
    [".cgc-pdf-viewer ~ p { color: var(--dark); }", ".cgc-pdf-viewer ~ p"],
    [".cgc-pdf-viewer__page + .sidebar { display: none; }", "+ .sidebar"],
    [".cgc-pdf-viewer { & ~ p { margin: 0; } }", "& ~ p"],
    [".cgc-pdf-viewer { .sidebar & { margin: 0; } }", ".sidebar &"],
    [".cgc-pdf-viewer:has(~ .sidebar) { margin: 0; }", ":has(~ .sidebar)"],
    [".cgc-pdf-viewer__page:nth-child(1 of :root *) { margin: 0; }", ":root *"],
  ]) {
    const { code, output } = await lintPlanted(appendCss(css))
    expect(code, css).not.toBe(0)
    expect(output, css).toContain(named)
  }
})

test("global names a widget can't namespace fail: @property and @font-face", async () => {
  for (const [css, named] of [
    [
      "@property --cgc-pdf-viewer-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }",
      "@property",
    ],
    ["@font-face { font-family: Inter; src: local(Inter); }", "@font-face"],
    [".cgc-pdf-viewer { view-transition-name: page; }", "page"],
  ]) {
    const { code, output } = await lintPlanted(appendCss(css))
    expect(code, css).not.toBe(0)
    expect(output, css).toContain(named)
  }
})

test("widget CSS takes its skin from the theme", async () => {
  for (const [css, named] of [
    [".cgc-pdf-viewer { color: white; }", "white"],
    [".cgc-pdf-viewer { background: #fff; }", "#fff"],
    [".cgc-pdf-viewer { font: 12px Georgia; }", "Georgia"],
    [
      ".cgc-pdf-viewer { --cgc-pdf-viewer-font: Georgia; font-family: var(--cgc-pdf-viewer-font); }",
      "var(--cgc-pdf-viewer-font)",
    ],
    [".cgc-pdf-viewer { color: WindowText; }", "WindowText"],
  ]) {
    const { code, output } = await lintPlanted(appendCss(css))
    expect(code, css).not.toBe(0)
    expect(output, css).toContain(named)
  }
})

test("a relative import that leaves the package fails, since the check can't see it", async () => {
  const specifier = "../../node_modules/pdfjs-dist/web/pdf_viewer.css"
  const { code, output } = await lintPlanted((dir) => {
    const file = path.join(dir, "pdf-viewer", "index.tsx")
    fs.writeFileSync(file, `import "${specifier}"\n${fs.readFileSync(file, "utf8")}`)
  })
  expect(code).not.toBe(0)
  expect(output).toMatch(/pdf-viewer[\\/]index\.tsx:1:\d+/)
  expect(output).toContain(specifier)
})

// draw-icons.mjs imports the icons library's TypeScript source, as package.json's scripts run it.
const STRIP_TYPES = ["--experimental-strip-types", "--disable-warning=ExperimentalWarning"]

// The icons a subpath shows in the browser are drawn ahead by @chaoticgoodcomputing/icons, into its
// committed icons.ts (docs/adr/0002). The lint target checks they are still what the library draws
// from the icons.json beside it.
async function drawIcons(root) {
  try {
    const { stdout, stderr } = await run(
      "node",
      [...STRIP_TYPES, "draw-icons.mjs", "--check", ...(root ? [root] : [])],
      { cwd: pkg },
    )
    return { code: 0, output: stdout + stderr }
  } catch (err) {
    return { code: err.code ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}` }
  }
}

async function drawPlanted(plant) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-widgets-icons-"))
  try {
    fs.cpSync(path.join(pkg, "src"), dir, { recursive: true })
    plant(dir)
    return await drawIcons(dir)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

test("the committed icons are what the icons library draws", async () => {
  const { code, output } = await drawIcons()
  expect(output).not.toMatch(/not what/)
  expect(code).toBe(0)
})

test("a hand-edited icon fails the check, named with its file", async () => {
  const { code, output } = await drawPlanted((dir) => {
    const file = path.join(dir, "bluesky", "icons.ts")
    const text = fs.readFileSync(file, "utf8")
    expect(text).toContain('fill="currentColor"')
    fs.writeFileSync(file, text.replace('fill="currentColor"', 'fill="#ff0000"'))
  })
  expect(code).not.toBe(0)
  expect(output).toMatch(/bluesky[\\/]icons\.ts/)
})

test("an icon id the library doesn't know fails the check", async () => {
  const { code, output } = await drawPlanted((dir) => {
    const file = path.join(dir, "bluesky", "icons.json")
    fs.writeFileSync(
      file,
      JSON.stringify({ ...JSON.parse(fs.readFileSync(file, "utf8")), likes: "mdi:no-such-icon" }),
    )
  })
  expect(code).not.toBe(0)
  expect(output).toContain("mdi:no-such-icon")
})
