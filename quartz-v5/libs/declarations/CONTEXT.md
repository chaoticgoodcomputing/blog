# @chaoticgoodcomputing/declarations

The type declarations of a plugin that is a package (#89, #93,
[ADR-0005](../../../docs/adr/0005-plugins-ship-as-npm-packages.md)): its `build.mjs` calls
`emitDeclarations` after esbuild has written `dist/`, and gets one bundled `.d.ts` beside each entry.
Quartz's generated plugin index, which a TypeScript layout override imports plugins' exports from,
reads a package's exports from its `dist/index.d.ts` and skips a package without one, and a
TypeScript site reads a plugin's options from them. Inherits the family vocabulary in
[`quartz-v5/CONTEXT.md`](../../CONTEXT.md).

It ships as JavaScript source that `build.mjs` imports, for the reason
[`@chaoticgoodcomputing/css-check`](../css-check/docs/adr/0001-javascript-a-build-imports.md) does,
and nothing inlines it. It runs `rollup-plugin-dts`, the bundler tsup gives `@quartz-community/*`,
under TypeScript with fixed compiler options, so a copy of a plugin built outside the repo emits the
same declarations as the plugin does.

## Language

**Declarations**:
`dist/<entry>.d.ts`, one per `dist/` entry (`index`, `components/index`, `frames/index`): the types a
site sees of the entry, bundled into one file that stands alone. `emitDeclarations({ entries,
external })` writes them, taking `entries` in the shape esbuild's `entryPoints` does.
_Avoid_: typings, d.ts files (in prose), types (alone)

**Inlined types**:
The types of a library the plugin inlines, such as `tags-core`'s: bundled into the declarations,
since a site never installs the library. The mirror of what esbuild does to the library's code.
_Avoid_: vendored types, copied types

**External**:
A package the declarations import rather than inline: the plugin's peers, which resolve to the site's
own copies, and any runtime dependency it keeps out of `dist/`, such as Iconify's packages. The same
list the build passes esbuild.
_Avoid_: peer (a runtime dependency is external too), import

**The one export**:
The single `export { …, type Name }` statement at the end of each file. Quartz's plugin index reads
exports with a pattern that matches only that form, so a type exported in an `export type { … }` of
its own would be left out of the index. The library merges them.
_Avoid_: export list, barrel

## Recipe

In a plugin's `build.mjs`, with the library as a `workspace:*` devDependency:

```js
import { emitDeclarations } from "@chaoticgoodcomputing/declarations"

const entryPoints = { index: "src/index.ts", "components/index": "src/components/index.ts" }
await esbuild.build({ entryPoints, /* … */ external: [...external, ...external.map((p) => `${p}/*`)] })
await emitDeclarations({ entries: entryPoints, external })
```

and in its `package.json`, `types` beside `import` for each entry in `exports`. It is tested through
its consumers, in `tests/specs/package-plugins.spec.mjs`: Quartz's plugin index takes the package in,
and a strict TypeScript site, with `skipLibCheck` off, reads its types.
