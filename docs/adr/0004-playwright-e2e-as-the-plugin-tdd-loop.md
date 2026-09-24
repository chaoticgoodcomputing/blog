---
status: accepted
date: 2026-09-24
---

# Playwright e2e as the plugin TDD loop

Every `cgc-*` plugin is written test-first against a real, built Quartz site. The suite is the
Nx project **`site-v5-e2e`** at `quartz-v5/tests/`. Each run builds our plugins and a small
**content fixture** into a site, then drives it with Playwright. It asserts on the rendered page and
on emitted files. A plugin's own specs live beside the plugin. One standing spec, **no-bleed**,
checks ADR-0003's rule 2 at the rendered page, where a collision actually shows up. One spec runs
red to green in about 3.5 seconds.

The repo had almost no test infrastructure before this: `tsx --test` behind one target. This ADR
is a new commitment, not an extension. Unit tests still live in the package they test, run by that
package's own `test` target. This suite is e2e only, because what it proves needs a whole built site.

> Source links point at upstream Quartz at
> [`97a2d05`](https://github.com/jackyzha0/quartz/tree/97a2d05f80c4c50534959b1d0d41cc4b3895625e)
> (v5.0.0), the ref `quartz-v5/upstream.json` pins. `nx run site-v5:diff-upstream` proves the
> vendored copy is byte-identical to it. Every claim below marked _measured_ was run on the throwaway
> `prototype/playwright-loop` branch, which also holds a stub plugin and a spec made to fail.

## Why

**A cold build per run, never `quartz build --serve`.** Serve looks like the fast option, but it
cannot run this loop. A watch rebuild reuses the build context it started with
([build.ts:103-106](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/build.ts#L103-L106)),
and Node's ESM cache holds the plugin module it first imported. _Measured:_ a running server kept
rendering a plugin's old output after the plugin was rebuilt, and kept doing so after a content edit
had triggered a rebuild. A test loop that doesn't notice the code under test changing is worse than
no loop at all. The cold build is cheap anyway. _Measured:_ both fixture variants build in parallel
in 1.5s, and a plugin builds in under 0.1s.

**The fixture site needs its own root.** Quartz reads its config from `process.cwd()` and from
nowhere else
([config-loader.ts:35](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/config-loader.ts#L35)),
and it installs plugins under `cwd` too
([gitLoader.ts:41](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L41)).
So the real site and the fixture site can't share the vendored root. Each variant is built from a
**fixture root** (`tests/.site*/`, gitignored): it symlinks every entry of the vendored copy and
holds its own config, written from `tests/quartz.config.yaml`. This makes no vendored change, and
`diff-upstream` stays clean.

**Quartz does not build our plugins.** A local source is symlinked into `.quartz/plugins/`, and
`installPlugin` returns before it reaches the build step
([gitLoader.ts:435-482](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L435-L482)).
Only a git source gets `npm install` and `npm run build`
([:547](https://github.com/jackyzha0/quartz/blob/97a2d05f80c4c50534959b1d0d41cc4b3895625e/quartz/plugins/loader/gitLoader.ts#L547)).
The harness therefore builds every package under `quartz-v5/plugins/` before it builds a site. This
corrects the trap recorded on
[Plugin packaging and shared SCSS tokens](https://github.com/chaoticgoodcomputing/blog/issues/22):
"the loader does run npm" holds for git sources only.

**The PostCSS pass cannot see a collision.** ADR-0003 enforces rules 1–4 at each plugin's build.
That polices *one* stylesheet: whether its selectors escape its own namespace. A bleed is the
*interaction* of stylesheets, such as an inherited property, a custom property redefined on an
ancestor, or load order deciding a specificity tie. So the suite builds a **baseline**: the same
fixture with every one of our plugins disabled. The **no-bleed** spec renders each fixture page on
both sites. Every element no plugin owns (one without a `cgc-` class on itself or an ancestor) must
compute identically on both. _Measured:_ a stub plugin shipping `article p { letter-spacing: 2px }`
turned it red, and the failure named every affected element and `normal → 2px`.

## The rule

1. **Specs assert on the rendered page and on emitted files.** Both are available through the
   **harness** (`harness/test.mjs`). It re-exports `test` and `expect` with an `emitted` fixture
   (the built site on disk) and a `baselinePage` fixture.
2. **A plugin's specs live beside it**, in `quartz-v5/plugins/<pkg>/e2e/*.spec.mjs`, and import
   from the harness by relative path. They cannot import `@playwright/test` directly, because the
   suite's `node_modules` isn't on their resolution path. That is deliberate: it gives one copy of
   Playwright and one set of fixtures. Cross-plugin specs, such as no-bleed and composition between
   an engine and its consumers, live centrally in `quartz-v5/tests/specs/`.
3. **The no-bleed spec is standing.** It isn't opt-in and it isn't CI-only. It costs a second site
   build, which runs in parallel with the first.
4. **The content fixture grows one page at a time**, when a plugin needs a case. It stays small,
   because its build time is the loop's floor.
5. **The loop:** `nx run site-v5-e2e:e2e`, or narrowed with
   `--args="../plugins/<pkg> -g <name>"`. For a faster turn, run `npx playwright test ...` from
   `quartz-v5/tests/`. Every run rebuilds all plugins and both sites. There is no watch mode, and
   Playwright's UI mode runs global setup only once, so it does not see plugin rebuilds.
6. **The suite gates CI.** The workflow itself is deferred to the deployment work, alongside
   [Per-package Nx projects break the deploy gate's affected check](https://github.com/chaoticgoodcomputing/blog/issues/33).
   Nothing is pushed before cutover.

## Considered alternatives

- **`quartz build --serve` as the server.** Rejected above. It never reloads a rebuilt plugin.
- **Specs in `tests/specs/<pkg>/` only.** Rejected. A plugin's proof belongs beside the plugin.
  The price is a relative import into `tests/harness/`, which has to be rewritten if a package is
  ever promoted to its own repo.
- **Each package devDepending on `@playwright/test`.** Rejected. That means N copies of Playwright
  and N copies of the fixtures, all for a promotion that may never happen.
- **Relying on the PostCSS pass alone for rule 2.** Rejected. It checks a stylesheet in isolation,
  and a bleed is between stylesheets.
- **Naming the project `tests`.** Rejected. The name is workspace-global and generic. The
  directory == project-name rule on #22 exists because the plugin loader keys on basename, and this
  project isn't a plugin. `site-v5-e2e` follows Nx's `<app>-e2e` convention, and the cutover
  find-and-replace `site-v5` → `site` renames it for free.

## Consequences

- **Chromium is a dependency.** The headless shell is about 94 MiB, downloaded once by the
  `install` target. The suite has its own isolated npm install, as the vendored copy does, because
  the repo root is the v4 pnpm tree.
- **The build is the loop's floor.** About 1.5s of every run is plugin and site builds, and that
  grows with the fixture and with each plugin. When it hurts, the first lever is skipping the
  baseline build when only the `plugins` project is selected.
- **Owning an element means a `cgc-` class**, which ADR-0003's BEM namespaces already guarantee.
  An element a plugin renders without one counts as unowned. Any style change on it then reads as a
  bleed, and that is the right pressure.
- **No-bleed checks computed style, not layout.** It compares a fixed list of properties. An
  inserted element that pushes its siblings down doesn't count as a bleed. Geometry is a different
  question, and nothing here answers it yet.
- **Both site variants share the vendored copy's transpile cache** through the symlinks. They have
  run in parallel without a race. If they ever do race, build them one after the other.
