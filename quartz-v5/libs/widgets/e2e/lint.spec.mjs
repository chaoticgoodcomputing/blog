// ADR-0003's libraries-that-ship-CSS amendment: a library's CSS is checked, never transformed. The
// package's Nx `lint` target runs `lint-css.mjs`, which fails on anything a widget's stylesheet puts
// outside its own namespace. The failing cases run it on a copy of `src/` with the escape planted,
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
