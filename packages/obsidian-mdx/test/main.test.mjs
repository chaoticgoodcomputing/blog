// The build, dist/main.js, loaded as Obsidian loads a plugin: CommonJS, with `obsidian` provided.

import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import vm from "node:vm"

const dist = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), "dist")

// CodeMirror is Obsidian's, at run time; here, the versions the plugin is built against.
const codemirror = createRequire(import.meta.url)

/** Loads main.js with a stand-in for Obsidian's Plugin, which records what it registers. */
function loadPlugin() {
  const registered = []
  const editorExtensions = []
  const postProcessors = []
  class Plugin {
    registerExtensions(extensions, viewType) {
      // Copied out of the sandbox, whose arrays are of another realm.
      registered.push({ extensions: [...extensions], viewType })
    }
    registerEditorExtension(extension) {
      editorExtensions.push(extension)
    }
    registerMarkdownPostProcessor(postProcessor) {
      postProcessors.push(postProcessor)
    }
  }
  const module = { exports: {} }
  const require = (name) => {
    if (name === "obsidian") return { Plugin }
    if (name.startsWith("@codemirror/")) return codemirror(name)
    throw new Error(`main.js requires ${name}, which Obsidian doesn't provide`)
  }
  vm.runInNewContext(fs.readFileSync(path.join(dist, "main.js"), "utf8"), { module, exports: module.exports, require })
  return { PluginClass: module.exports.default, Plugin, registered, editorExtensions, postProcessors }
}

test("main.js exports a Plugin as its default", () => {
  const { PluginClass, Plugin } = loadPlugin()
  assert.equal(typeof PluginClass, "function")
  assert.ok(new PluginClass() instanceof Plugin)
})

test("loading the plugin opens .mdx in the Markdown view", async () => {
  const { PluginClass, registered } = loadPlugin()
  await new PluginClass().onload()
  assert.deepEqual(registered, [{ extensions: ["mdx"], viewType: "markdown" }])
})

test("loading the plugin adds the editor extension and Reading view's post-processor", async () => {
  const { PluginClass, editorExtensions, postProcessors } = loadPlugin()
  await new PluginClass().onload()
  assert.equal(editorExtensions.length, 1)
  assert.equal(postProcessors.length, 1)
})

test("the build's manifest is the package's", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(dist, "manifest.json"), "utf8"))
  assert.equal(manifest.id, "obsidian-mdx")
})

test("the build carries the plugin's styles", () => {
  assert.ok(fs.existsSync(path.join(dist, "styles.css")))
})
