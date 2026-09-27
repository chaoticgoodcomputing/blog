---
status: accepted
date: 2026-09-25
---

# The check ships as JavaScript that a build imports

Every other library in the family ships as TypeScript source that a consuming plugin's esbuild
inlines into its `dist/` (ADR-0005: *our libraries are inlined*). This one is not
inlined into anything. A plugin's `build.mjs` runs it while the package builds, and the widgets
library's `lint` target runs it as a script, both straight under Node, with no bundler in between.

Node runs TypeScript only by stripping its types, and it refuses to strip them from a file under
`node_modules` ([Node.js: type stripping in dependencies](https://nodejs.org/api/typescript.html#type-stripping-in-dependencies)).
On `main`, npm links a `file:` library, and Node resolves its real path outside `node_modules`, so a
TypeScript check would run. Downstream it would not. A site installs a plugin from git, and the
loader runs `npm install`, then the package's `build`, then prunes its dev dependencies
([gitLoader.ts:389-410](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L389-L410)).
The install puts the library, published at the release's version, under the plugin's own
`node_modules`, where Node won't strip it.

## Decision

The library is JavaScript, typed with JSDoc and checked by `tsc` (`checkJs`, the `typecheck`
target). Its `exports` point at `./src/index.js`, so it stays source-only: no build and no `dist/`.
`postcss` and `postcss-selector-parser` are its own `dependencies`, and a consumer lists the library
as a `devDependency`, since it is needed only while the consumer builds.

## Consequences

- **A plugin's `build.mjs` imports it like any package** and calls `checkStylesheet` before it
  bundles, with nothing to prepare first.
- **The plugins lose their own `postcss` dependencies.** They install through the library: the pnpm
  workspace on `main`, npm under the library's published version downstream. `cgc-annotator` keeps
  its own, for the pass that prefixes PDF.js's text-layer CSS into its block.
- **Editors and `tsc` still see types**, from the JSDoc, though no `.ts` file ships.

## Considered alternatives

- **TypeScript, stripped by Node.** It works on `main` and fails on the first downstream install, as
  above.
- **TypeScript, bundled by each `build.mjs` before use.** `cgc-annotator` does this for
  `@chaoticgoodcomputing/island-runtime`, whose entry source it needs at build time. For the check it
  would add an esbuild pass to each of the ten packages that run it, to run code that needs no
  compiling.
- **A copy of the check in each package**, as before this library. The copies drifted: by the time
  there were nine, they and the widgets lint enforced ADR-0003 in six different ways (ADR-0002).

## Amendment: workspace links, and no downstream build

_2026-09-27, from [#92](https://github.com/chaoticgoodcomputing/blog/issues/92) and
[#93](https://github.com/chaoticgoodcomputing/blog/issues/93)._

The premise above describes npm and the git route. Since #92, pnpm links a library as a `workspace:*`
dependency, not npm as a `file:` one, and Node still resolves its real path outside `node_modules`, so
a TypeScript check would still run on `main`. Since #93, a site installs a plugin from npm with its
built `dist/` ([ADR-0005](../../../../../docs/adr/0005-plugins-ship-as-npm-packages.md)),
and no plugin build runs downstream, so the failure this ADR guards against no longer has a place to
happen. The decision stands: JavaScript needs no stripping wherever the check runs, and changing it
back would buy nothing.
