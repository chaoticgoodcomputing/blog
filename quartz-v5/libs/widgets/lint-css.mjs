// The library-CSS check (ADR-0003's libraries-that-ship-CSS amendment): the PostCSS pass a plugin
// build would run to namespace its CSS, run here in check mode, since a library has no build. It
// rewrites nothing. The shipped CSS is exactly the source.
//
// Each directory under src/ is one widget, and its block is `cgc-<directory>`. Everything a widget's
// stylesheet puts into the page's global namespaces must be inside that block:
//   - every selector starts at an element the widget renders: its leftmost compound selector
//     carries the block's class or one of its `__element` / `--modifier` classes (rules 1 and 2);
//   - every custom property it declares is `--cgc-<widget>-…` (rule 7);
//   - every @keyframes name is `cgc-<widget>` or `cgc-<widget>-…`.
// CSS the check can't see fails too: an @import, or a source file importing a stylesheet from
// outside the package (say, PDF.js's own), which the page's bundler would otherwise inline.
//
// Usage: node lint-css.mjs [src-dir]. Exits 1 and lists every escape as file:line:col.
import fs from "node:fs"
import path from "node:path"
import postcss from "postcss"
import selectorParser from "postcss-selector-parser"

const root = path.resolve(process.argv[2] ?? "src")
const problems = []
let checked = 0

const shown = (file) =>
  path.relative(process.cwd(), file).startsWith("..") ? file : path.relative(process.cwd(), file)
const report = (file, line, column, message) =>
  problems.push(`${shown(file)}:${line}:${column}  ${message}`)
const at = (file, node, message) =>
  report(file, node.source?.start?.line ?? 0, node.source?.start?.column ?? 0, message)

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

const inBlock = (block, name) =>
  name === block || name.startsWith(`${block}__`) || name.startsWith(`${block}--`)

// The leftmost compound selector: everything before the first combinator. A class inside a
// pseudo-class's argument, like `:not(.cgc-x)`, doesn't count: it doesn't select that element.
function anchored(selector, block) {
  for (const node of selector.nodes) {
    if (node.type === "combinator") return false
    if (node.type === "class" && inBlock(block, node.value)) return true
  }
  return false
}

// A rule nested inside another rule is relative to it (CSS nesting), so only the outermost rule of
// each chain is checked.
function nested(rule) {
  for (let node = rule.parent; node; node = node.parent) if (node.type === "rule") return true
  return false
}

function checkStylesheet(file, block) {
  checked++
  const ast = postcss.parse(fs.readFileSync(file, "utf8"), { from: file })
  ast.walkAtRules((rule) => {
    if (rule.name.toLowerCase() === "import")
      at(file, rule, `@import brings in CSS this check can't see: ${rule.params}`)
    const name = rule.params.trim()
    if (/keyframes$/i.test(rule.name) && name !== block && !name.startsWith(`${block}-`))
      at(file, rule, `@keyframes ${name} is outside the ${block} namespace`)
  })
  ast.walkDecls((decl) => {
    if (decl.prop.startsWith("--") && !decl.prop.startsWith(`--${block}-`))
      at(file, decl, `custom property ${decl.prop} is outside the --${block}- namespace`)
  })
  ast.walkRules((rule) => {
    if (nested(rule) || /keyframes$/i.test(rule.parent?.name ?? "")) return
    selectorParser((selectors) => {
      selectors.each((selector) => {
        if (!anchored(selector, block))
          at(
            file,
            rule,
            `selector "${selector.toString().trim()}" doesn't start at a .${block} element`,
          )
      })
    }).processSync(rule.selector)
  })
}

// Stylesheets a source file imports, by specifier: `import "x.css"` and `import("x.css")`.
const CSS_IMPORT = /\bimport\s*(?:\(\s*|[^'"();]*?\bfrom\s*)?["']([^"']+\.css)["']/g

function checkSource(file) {
  const text = fs.readFileSync(file, "utf8")
  for (const match of text.matchAll(CSS_IMPORT)) {
    if (match[1].startsWith(".")) continue
    const line = text.slice(0, match.index).split("\n").length
    report(
      file,
      line,
      1,
      `imports a stylesheet from outside the package, which this check can't see: ${match[1]}`,
    )
  }
}

for (const file of walk(root)) {
  const widget = path.relative(root, file).split(path.sep)[0]
  const inWidget = widget !== path.basename(file)
  if (file.endsWith(".css")) {
    if (inWidget) checkStylesheet(file, `cgc-${widget}`)
    else report(file, 1, 1, "a stylesheet belongs to one widget, in its directory under src/")
  } else if (/\.[cm]?[jt]sx?$/.test(file)) checkSource(file)
}

if (problems.length) {
  console.error(
    `${problems.join("\n")}\n\n${problems.length} error${problems.length === 1 ? "" : "s"}: CSS outside its widget's namespace (ADR-0003).`,
  )
  process.exit(1)
}
console.log(
  `${checked} stylesheet${checked === 1 ? "" : "s"} checked: everything is inside its widget's namespace.`,
)
