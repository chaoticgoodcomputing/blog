// Builds the plugin to dist/, in quartz-community/plugin-template's shape: `dist/index.js` is the
// emitter, which publishes the graph's index and ships the stylesheet, and `dist/components/index.js`
// the component. The host's singletons (peerDependencies) stay external; our libraries,
// @chaoticgoodcomputing/tags-core and @chaoticgoodcomputing/icons, ship as TypeScript source and are
// inlined (ADR-0005). The icons library's own dependencies, Iconify's packages, stay external too:
// they run while the site builds and can't all be inlined, so they are this plugin's `dependencies`,
// at the library's versions (libs/icons/docs/adr/0001).
//
// Two bundles, in order:
//
// 1. The browser runtime, `src/runtime/main.ts`, with d3's force, drag and zoom modules and tween.js
//    inlined: one self-contained script, minified, that the component ships as its `afterDOMLoaded`.
//    Quartz runs it as a module in a build and wraps it in a function under `serve`, so it is an IIFE,
//    which is both. It stays in memory: the component imports it as text, as `cgc-graph:runtime`.
// 2. The plugin itself, for Node.
//
// The stylesheet is checked first, and the build fails if it breaks ADR-0003's library-CSS rules.
// It is checked, not rewritten, so the selectors that ship are the ones a reader sees in the source:
// - every rule sits in this package's family layer, `@layer cgc.<name>` (rule 11);
// - every selector is built from this package's BEM block, `.cgc-<name>`, its `__elements` and
//   `--modifiers`, plus pseudo-classes and pseudo-elements: no tags, ids, attributes or other classes
//   (rules 1, 2, 4);
// - no colour literal, and a `font-family` only as a reference to a theme's font: skin comes from the
//   theme's properties (rule 5);
// - every custom property it defines is `--cgc-` prefixed (rule 7).
import esbuild from "esbuild"
import fs from "node:fs"
import path from "node:path"
import postcss from "postcss"
import selectorParser from "postcss-selector-parser"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies)
const iconsLib = JSON.parse(
  fs.readFileSync("node_modules/@chaoticgoodcomputing/icons/package.json", "utf8"),
).dependencies
const drift = Object.entries(iconsLib).filter(([name, spec]) => pkg.dependencies?.[name] !== spec)
if (drift.length) {
  console.error(
    `package.json must carry @chaoticgoodcomputing/icons' dependencies, at its versions:\n${drift
      .map(
        ([name, spec]) => `  "${name}": "${spec}" (here: ${pkg.dependencies?.[name] ?? "missing"})`,
      )
      .join("\n")}`,
  )
  process.exit(1)
}
const external = [...peers, ...Object.keys(iconsLib)]
const block = pkg.name
const layer = `cgc.${block.replace(/^cgc-/, "")}`
const stylesheet = "src/style.css"

const errors = checkStylesheet(fs.readFileSync(stylesheet, "utf8"))
if (errors.length) {
  console.error(
    `${stylesheet} breaks ADR-0003's library-CSS rules:\n${errors.map((e) => `  ${e}`).join("\n")}`,
  )
  process.exit(1)
}

// d3-force gets a timer that never runs: the graph ticks its simulation from the frame loop that draws
// it (src/runtime/still-timer.ts). Only d3-force's: d3-zoom's transitions keep d3-timer's own.
const stillTimer = {
  name: "still-timer",
  setup(build) {
    build.onResolve({ filter: /^d3-timer$/ }, (args) =>
      /[\\/]d3-force[\\/]/.test(args.importer)
        ? { path: path.resolve("src/runtime/still-timer.ts") }
        : undefined,
    )
  },
}

const runtime = await esbuild.build({
  entryPoints: ["src/runtime/main.ts"],
  outfile: "runtime.js",
  write: false,
  bundle: true,
  format: "iife",
  platform: "browser",
  // Quartz's own browser targets (core componentResources.ts).
  target: ["chrome109", "edge115", "firefox102", "safari15"],
  minify: true,
  legalComments: "none",
  plugins: [stillTimer],
  logLevel: "warning",
})
const RUNTIME = "cgc-graph:runtime"
const runtimeModule = {
  name: "runtime",
  setup(build) {
    build.onResolve({ filter: new RegExp(`^${RUNTIME}$`) }, (args) => ({
      path: args.path,
      namespace: RUNTIME,
    }))
    build.onLoad({ filter: /.*/, namespace: RUNTIME }, () => ({
      contents: runtime.outputFiles[0].text,
      loader: "text",
    }))
  },
}

await esbuild.build({
  entryPoints: { index: "src/index.ts", "components/index": "src/components/index.ts" },
  outdir: "dist",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  jsx: "automatic",
  jsxImportSource: "preact",
  external: [...external, ...external.map((p) => `${p}/*`)],
  // The stylesheet ships as text, which the emitter hands to Quartz from externalResources(); the
  // runtime as text, which the component hands to Quartz as its script.
  loader: { ".css": "text" },
  plugins: [runtimeModule],
  logLevel: "warning",
})

function checkStylesheet(css) {
  const errors = []
  const ours = (name) =>
    name === block || name.startsWith(`${block}__`) || name.startsWith(`${block}--`)
  const root = postcss.parse(css, { from: stylesheet })
  const at = (node) => `${stylesheet}:${node.source?.start?.line}`

  root.walkAtRules((rule) => {
    if (rule.name === "layer" && !(rule.params === layer && rule.nodes && rule.parent === root)) {
      errors.push(
        `${at(rule)}: @layer ${rule.params} — the only layer is a top-level @layer ${layer} { … }`,
      )
    } else if (!["layer", "media", "supports", "container"].includes(rule.name)) {
      errors.push(`${at(rule)}: @${rule.name} is not allowed in library CSS`)
    }
  })
  root.walkRules((rule) => {
    let parent = rule.parent
    while (parent.type === "atrule" && parent.name !== "layer") parent = parent.parent
    if (!(parent.type === "atrule" && parent.params === layer)) {
      errors.push(`${at(rule)}: ${rule.selector} is outside @layer ${layer}`)
    }
    selectorParser((selectors) => {
      selectors.walk((node) => {
        if (node.type === "class" && !ours(node.value)) {
          errors.push(
            `${at(rule)}: .${node.value} in "${rule.selector}" is not this package's (.${block}…)`,
          )
        } else if (["tag", "id", "universal", "attribute", "nesting"].includes(node.type)) {
          errors.push(
            `${at(rule)}: ${String(node).trim()} in "${rule.selector}" selects what this package does not own`,
          )
        }
      })
      selectors.each((selector) => {
        if (!selector.some((node) => node.type === "class"))
          errors.push(`${at(rule)}: "${String(selector).trim()}" names no class of this package`)
      })
    }).processSync(rule.selector)
  })
  root.walkDecls((decl) => {
    if (decl.prop.toLowerCase() === "font-family" && !/^var\(--[\w-]+\)$/.test(decl.value.trim()))
      errors.push(
        `${at(decl)}: font-family: ${decl.value} — fonts come from the theme, as var(--…)`,
      )
    if (/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i.test(decl.value)) {
      errors.push(
        `${at(decl)}: ${decl.prop}: ${decl.value} — a colour literal; use the theme's properties`,
      )
    }
    if (decl.prop.startsWith("--") && !decl.prop.startsWith("--cgc-"))
      errors.push(`${at(decl)}: ${decl.prop} — our custom properties are --cgc- prefixed`)
  })
  return errors
}
