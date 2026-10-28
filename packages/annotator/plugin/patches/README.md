# Patches

Changes to the plugin's dependencies, which pnpm applies on installing them (`patchedDependencies`
in the repository's `pnpm-workspace.yaml`). Each patch is for one exact version: bumping the
dependency fails the install until the patch is made again for the new one, with `pnpm patch`.

## `hypothesis@1.1769.0.patch`

The [Hypothesis client](https://github.com/hypothesis/client), © Hypothes.is Project and
contributors, is licensed under the BSD 2-Clause license, whose text the build copies beside the
client (`frames/hypothesis/LICENSE`) and which is at
<https://github.com/hypothesis/client/blob/main/LICENSE>. This patch, which holds a few lines of the
client's built code as its context, modifies it, as that license permits.

**What it does.** The sidebar renders an annotation's comment with the client's own Markdown
renderer, which has no setting to replace it. The patch makes it defer to
`window.__annotatorRenderMarkdown` when the sidebar page defines one (`frames/sidebar.ts`), which
the plugin answers with Obsidian's rendering of the comment.

**Where.** `build/scripts/sidebar.bundle.js`: the minified `renderMathAndMarkdown` of
`@hypothesis/annotation-ui` (its `src/utils/render-markdown.js`, in the bundle's source map), found by
the only `"{math:"` in the bundle, just before it. Its minified name changes between versions.

**Making it again for a new version.**

1. `pnpm patch hypothesis@<version>`
2. In the extracted folder's `build/scripts/sidebar.bundle.js`, find `"{math:"`. The function that
   follows it, `function <name>(e){`, is the renderer. Insert at its start:
   `if(window.__annotatorRenderMarkdown)return window.__annotatorRenderMarkdown(e);`
3. `pnpm patch-commit <folder> --patches-dir packages/annotator/plugin/patches`, from the
   repository's root, and delete the old version's patch.
4. `pnpm nx run annotator:test`: `test/patches.test.ts` checks the
   installed client has the hook, and the end-to-end suite that the sidebar uses it.
