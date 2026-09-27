// Builds the plugin to dist/, in quartz-community/plugin-template's shape: `dist/index.js` is the
// transformer that ships the stylesheet, `dist/components/index.js` the component. The host's
// singletons (peerDependencies) stay external.
//
// Three steps:
// 1. The stylesheet is checked, by @chaoticgoodcomputing/css-check, and the build fails if it breaks
//    ADR-0003's library-CSS rules: every rule in this package's family layer, `@layer cgc.<name>`,
//    every selector inside its BEM block, `.cgc-<name>`, every name it defines (custom properties,
//    keyframes) in the block's namespace, and skin only from the theme's properties (the library's
//    CONTEXT.md has the rules). It is checked, not rewritten, so the selectors that ship are the ones
//    a reader sees in the source.
// 2. The cards' browser script, src/client/, is bundled for the browser into one plain script, with
//    our library's Bluesky client and renderer inlined (`@chaoticgoodcomputing/widgets/bluesky`,
//    ADR-0005). The renderer brings the post card's stylesheet, which the library's own lint checks;
//    it joins ours in this package's family layer.
// 3. The plugin is bundled for Node, with the script and the stylesheet as text, through the
//    virtual module `cgc-social:client` (src/client.d.ts).
import esbuild from "esbuild"
import fs from "node:fs"
import { checkStylesheet } from "@chaoticgoodcomputing/css-check"

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
const peers = Object.keys(pkg.peerDependencies)
const block = pkg.quartz.name
const layer = `cgc.${block.replace(/^cgc-/, "")}`
const stylesheet = "src/style.css"

const own = fs.readFileSync(stylesheet, "utf8")
const problems = checkStylesheet(own, { from: stylesheet, block, layer })
if (problems.length) {
  console.error(
    `${stylesheet} breaks ADR-0003's library-CSS rules:\n${problems.map((p) => `  ${p}`).join("\n")}`,
  )
  process.exit(1)
}

// The browser script, and the stylesheet the libraries it inlines bring with them.
const client = await esbuild.build({
  entryPoints: { social: "src/client/social.ts" },
  outdir: "dist/client",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  minify: true,
  write: false,
  logLevel: "warning",
})
const output = (ext) => client.outputFiles.find((file) => file.path.endsWith(ext))?.text ?? ""
// One spelling of the layer in the whole stylesheet, dotted: lightningcss inverts sublayer order in a
// file that mixes dotted and nested names (ADR-0003's family-layer amendment).
const bundled = output(".css").trim()
const css = `${bundled ? `@layer ${layer} {\n${bundled}\n}\n` : ""}${own}`

await esbuild.build({
  entryPoints: { index: "src/index.ts", "components/index": "src/components/index.ts" },
  outdir: "dist",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  jsx: "automatic",
  jsxImportSource: "preact",
  external: [...peers, ...peers.map((p) => `${p}/*`)],
  plugins: [
    {
      name: "cgc-social-client",
      setup(build) {
        build.onResolve({ filter: /^cgc-social:client$/ }, (args) => ({
          path: args.path,
          namespace: "cgc-social-client",
        }))
        build.onLoad({ filter: /.*/, namespace: "cgc-social-client" }, () => ({
          contents: `export const script = ${JSON.stringify(output(".js"))}\nexport const stylesheet = ${JSON.stringify(css)}\n`,
          loader: "js",
        }))
      },
    },
  ],
  logLevel: "warning",
})
