// The library-CSS check (ADR-0003's libraries-that-ship-CSS amendment): the check every styled
// package runs, @chaoticgoodcomputing/css-check, run here as a lint, since a library has no build. It
// rewrites nothing. The shipped CSS is exactly the source.
//
// Each directory under src/ is one subpath, and its block is `cgc-<directory>`. Every block's
// stylesheet is checked against that block, with the others as its neighbours, so a name in
// `cgc-bluesky-post`'s namespace is never `cgc-bluesky`'s, though one block's name is a prefix of
// the other's. A selector starts at an element of the block and may reach anything inside one
// (PDF.js writes the text layer's markup), never beside or above it. The stylesheet declares no
// layer: whoever bundles the widget places it (cgc-mdx in `cgc.mdx.widgets`, cgc-social in its own).
// CSS the check can't see fails too: an @import, or a source file importing a stylesheet from
// outside src/ (say, PDF.js's own), which the page's bundler would otherwise inline.
//
// Usage: node lint-css.mjs [src-dir]. Exits 1 and lists every problem as file:line:col.
import fs from "node:fs"
import path from "node:path"
import { checkImports, checkStylesheet } from "@chaoticgoodcomputing/css-check"

const root = path.resolve(process.argv[2] ?? "src")
const problems = []
let checked = 0

const shown = (file) =>
  path.relative(process.cwd(), file).startsWith("..") ? file : path.relative(process.cwd(), file)

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

const blocks = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `cgc-${entry.name}`)

for (const file of walk(root)) {
  const dir = path.relative(root, file).split(path.sep)[0]
  const inBlock = dir !== path.basename(file)
  if (file.endsWith(".css")) {
    if (!inBlock) {
      problems.push(
        `${shown(file)}:1:1  a stylesheet belongs to one block, in its directory under src/`,
      )
      continue
    }
    checked++
    problems.push(
      ...checkStylesheet(fs.readFileSync(file, "utf8"), {
        from: shown(file),
        block: `cgc-${dir}`,
        neighbours: blocks,
        reach: "inside",
      }),
    )
  } else if (/\.[cm]?[jt]sx?$/.test(file)) {
    problems.push(
      ...checkImports(fs.readFileSync(file, "utf8"), { from: shown(file), root: shown(root) }),
    )
  }
}

if (problems.length) {
  console.error(
    `${problems.join("\n")}\n\n${problems.length} error${problems.length === 1 ? "" : "s"}: CSS outside its block (ADR-0003).`,
  )
  process.exit(1)
}
console.log(
  `${checked} stylesheet${checked === 1 ? "" : "s"} checked: everything is inside its block.`,
)
