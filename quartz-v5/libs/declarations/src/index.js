// A plugin's type declarations, emitted while it builds: one bundled `.d.ts` beside each `dist/`
// entry, in the shape tsup gives `@quartz-community/*`, one `export { … }` statement per file. That is
// the shape Quartz's generated plugin index reads a package's exports from, and it skips a package
// with no `dist/index.d.ts` at all (CONTEXT.md). Quartz reads only `export { … }`, so a type is
// exported there as `type Name`, as tsup writes it, never in an `export type { … }` of its own, which
// the index would leave out.
//
// A plugin inlines our libraries into its `dist/`, and a site never installs them, so their types are
// inlined into the declarations too. Everything `external` names (the plugin's peers, and any runtime
// dependency it keeps out of `dist/`) stays an import, which the site resolves from its own copy.
import fs from "node:fs"
import path from "node:path"
import { rollup } from "rollup"
import { dts } from "rollup-plugin-dts"
import ts from "typescript"

/**
 * The compiler options declarations are emitted with. Fixed here rather than read from the plugin's
 * tsconfig.json, so a copy of a plugin built outside the repo (the harness's `buildPluginCopy`)
 * emits the same declarations. They match the family's tsconfig, with a declaration emit.
 * @type {import("typescript").CompilerOptions}
 */
const COMPILER_OPTIONS = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  skipLibCheck: true,
  jsx: ts.JsxEmit.ReactJSX,
  jsxImportSource: "preact",
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  types: ["node"],
}

/**
 * Writes `<outdir>/<name>.d.ts` for each entry: its declarations, bundled, with every import of a
 * package `external` names (or a subpath of one) left as an import, and every other import's types
 * inlined. Throws if TypeScript can't emit them.
 *
 * @param {object} options
 * @param {Record<string, string>} options.entries dist entry name (`index`, `components/index`) to
 *   its TypeScript source, relative to `cwd`, as esbuild's `entryPoints` takes them.
 * @param {string[]} options.external packages that stay imports: the plugin's peers, and its
 *   runtime dependencies.
 * @param {string} [options.outdir] where the declarations go, `dist` by default.
 * @param {string} [options.cwd] the package's directory, the process's by default.
 * @returns {Promise<string[]>} the files written, relative to `cwd`.
 */
export async function emitDeclarations({
  entries,
  external,
  outdir = "dist",
  cwd = process.cwd(),
}) {
  const isExternal = (/** @type {string} */ id) =>
    external.some((name) => id === name || id.startsWith(`${name}/`))
  const written = []
  // One bundle per entry, so each `.d.ts` stands alone, with no shared chunk beside it.
  for (const [name, source] of Object.entries(entries)) {
    const bundle = await rollup({
      input: path.resolve(cwd, source),
      external: isExternal,
      plugins: [dts({ respectExternal: true, compilerOptions: COMPILER_OPTIONS })],
    })
    try {
      const { output } = await bundle.generate({ format: "es" })
      const file = path.join(outdir, `${name}.d.ts`)
      fs.mkdirSync(path.dirname(path.resolve(cwd, file)), { recursive: true })
      fs.writeFileSync(path.resolve(cwd, file), oneExport(output[0].code))
      written.push(file)
    } finally {
      await bundle.close()
    }
  }
  return written
}

/**
 * `code` with its local `export { … }` and `export type { … }` statements (those with no `from`)
 * merged into one `export { … }` at the end, each type named as `type Name`: the only form of a type
 * export Quartz's plugin index reads.
 * @param {string} code
 */
function oneExport(code) {
  /** @type {string[]} */
  const names = []
  const rest = code.replace(
    /^export (type )?\{([^}]*)\};\n?/gm,
    (
      /** @type {string} */ _,
      /** @type {string | undefined} */ type,
      /** @type {string} */ list,
    ) => {
      for (const name of list
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean))
        names.push(type ? `type ${name}` : name)
      return ""
    },
  )
  return names.length ? `${rest.trimEnd()}\n\nexport { ${names.join(", ")} };\n` : rest
}
