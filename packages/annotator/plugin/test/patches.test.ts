// The installed Hypothesis client carries the plugin's patch (patches/README.md): if a new version
// of the client is installed without it, or pnpm stops applying it, this fails before anything
// subtler does.

import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { test } from "node:test"

const require = createRequire(import.meta.url)
const bundle = fs.readFileSync(path.join(path.dirname(require.resolve("hypothesis/package.json")), "build/scripts/sidebar.bundle.js"), "utf8")

test("the sidebar's Markdown renderer defers to the plugin's hook, once", () => {
  const hook = "if(window.__annotatorRenderMarkdown)return window.__annotatorRenderMarkdown(e);"
  assert.equal(bundle.split(hook).length - 1, 1)
  // At the start of the function after the one `"{math:"`, which is the renderer.
  assert.match(bundle, /"\{math:"\+e\.toString\(\)\+"\}"\}function [A-Za-z_$][\w$]*\(e\)\{if\(window\.__annotatorRenderMarkdown\)/)
})
