// Draws the icons a widget shows in the browser (docs/adr/0002). @chaoticgoodcomputing/icons draws
// only while a site builds, on the server, and a widget's browser code can't import it. So each
// widget that needs icons lists their ids in `src/<widget>/icons.json`, and this script draws them
// with the library into `src/<widget>/icons.ts`, one exported SVG string per name. The drawn module
// is committed, so the package stays source that any bundler can take.
//
// Usage: node draw-icons.mjs [--check] [src-dir]. With --check it rewrites nothing, and exits 1 if
// any icons.ts isn't exactly what the library draws from its icons.json (the `lint` target runs it).
import fs from "node:fs"
import path from "node:path"
import { createIcons } from "@chaoticgoodcomputing/icons"

const args = process.argv.slice(2)
const check = args.includes("--check")
const root = path.resolve(args.find((a) => !a.startsWith("--")) ?? "src")
const icons = createIcons()

const HEADER = `// Drawn by @chaoticgoodcomputing/icons from icons.json, beside this file. Don't edit it:
// \`npm run icons\` redraws it, and \`npm run lint\` fails when it differs from what the library draws.
`

// A string literal quoted as Prettier quotes it: in whichever quote needs fewer escapes.
function literal(text) {
  if ((text.match(/"/g) ?? []).length <= (text.match(/'/g) ?? []).length)
    return JSON.stringify(text)
  return `'${text.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`
}

/** The module that draws `ids` (name → icon id) for `widget`, each with its block's icon class. */
function drawn(widget, ids) {
  const lines = Object.entries(ids)
    .filter(([name]) => !name.startsWith("//"))
    .map(([name, id]) => {
      if (!/^[a-z][A-Za-z0-9]*$/.test(name))
        throw new Error(`${widget}: "${name}" is not a name an icon can be exported by`)
      return `export const ${name} =\n  ${literal(icons.svg(id, { class: `cgc-${widget}__icon` }))}\n`
    })
  return HEADER + lines.join("")
}

const problems = []
let count = 0
for (const widget of fs.readdirSync(root).sort()) {
  const dir = path.join(root, widget)
  const list = path.join(dir, "icons.json")
  const module = path.join(dir, "icons.ts")
  if (!fs.statSync(dir).isDirectory()) continue
  if (!fs.existsSync(list)) {
    if (fs.existsSync(module))
      problems.push(`${path.relative(process.cwd(), module)}: drawn from no icons.json`)
    continue
  }
  const expected = drawn(widget, JSON.parse(fs.readFileSync(list, "utf8")))
  count++
  if (!check) fs.writeFileSync(module, expected)
  else if (!fs.existsSync(module) || fs.readFileSync(module, "utf8") !== expected)
    problems.push(
      `${path.relative(process.cwd(), module)}: not what the icons library draws from icons.json`,
    )
}

if (problems.length) {
  console.error(`${problems.join("\n")}\n\nRun \`npm run icons\` to redraw.`)
  process.exit(1)
}
const widgets = `${count} widget${count === 1 ? "" : "s"}`
console.log(
  check
    ? `Icons checked for ${widgets}: as the library draws them.`
    : `Icons drawn for ${widgets}.`,
)
