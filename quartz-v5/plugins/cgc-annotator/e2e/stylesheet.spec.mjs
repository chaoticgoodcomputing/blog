// ADR-0003 for a plugin that ships third-party CSS: the stylesheet a site gets is all in this
// plugin's family layer and its own namespace, PDF.js's text-layer rules included, and a selector
// that escapes the namespace fails the plugin's own build (rule 3).
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
import { test, expect } from "../../../tests/harness/test.mjs"

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

test("the stylesheet a site gets is PDF.js's text layer and ours, all in cgc.annotator, all namespaced", async ({ page, emitted }) => {
  await page.goto("/annotations/fixture-paper")
  const hrefs = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((links) => links.filter((l) => new URL(l.href).origin === location.origin).map((l) => new URL(l.href).pathname.slice(1)))
  // Once, though Quartz makes an instance of the plugin for each of its three halves.
  const ours = hrefs.map((href) => emitted.read(href)).filter((text) => text.includes("cgc-annotator"))
  expect(ours).toHaveLength(1)
  const [css] = ours
  // One block, in the family layer.
  expect(css.trim()).toMatch(/^@layer cgc\.annotator\{[\s\S]*\}$/)
  // PDF.js's text layer, prefixed into the Viewer's block.
  expect(css).toContain(".cgc-annotator-viewer__text-layer")
  expect(css).not.toMatch(/\.textLayer\b/)
  // Every custom property it declares is ours; PDF.js's own are only read, with their defaults.
  const declared = [...css.matchAll(/[{;](--[\w-]+):/g)].map(([, name]) => name)
  expect(declared.length).toBeGreaterThan(0)
  expect(declared.filter((name) => !name.startsWith("--cgc-annotator"))).toEqual([])
  expect(css).toContain("var(--scale-x,1)")
})

async function buildWith(extraCss) {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), "cgc-annotator-css-"))
  try {
    for (const entry of ["package.json", "build.mjs", "src"]) fs.cpSync(path.join(pluginRoot, entry), path.join(copy, entry), { recursive: true })
    fs.symlinkSync(path.join(pluginRoot, "node_modules"), path.join(copy, "node_modules"))
    fs.appendFileSync(path.join(copy, "src/styles/annotator.css"), extraCss)
    const build = await promisify(execFile)("node", ["build.mjs"], { cwd: copy }).then(
      () => ({ code: 0, output: "" }),
      (err) => ({ code: err.code, output: `${err.stdout}${err.stderr}` }),
    )
    return { ...build, dist: fs.existsSync(path.join(copy, "dist")) }
  } finally {
    fs.rmSync(copy, { recursive: true, force: true })
  }
}

test("refuses to build a stylesheet that selects what it does not own", async () => {
  // v4's lesson: PDF.js's viewer CSS shipped a bare `.sidebar`, which hid Quartz's sidebars.
  for (const [css, named] of [
    [".sidebar { display: none; }\n", ".sidebar"],
    [".cgc-annotator + hr { margin: 0; }\n", "sibling"],
    [".cgc-annotator { --gap: 1rem; }\n", "--gap"],
    [".cgc-annotator__quote { color: #ffffff; }\n", "colour literal"],
  ]) {
    const build = await buildWith(css)
    expect(build.code, css).not.toBe(0)
    expect(build.output, css).toContain(named)
    expect(build.dist, css).toBe(false)
  }
})
