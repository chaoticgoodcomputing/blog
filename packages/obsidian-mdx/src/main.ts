import { Plugin } from "obsidian"
import { mdxInEditor } from "./editor.ts"
import { EXTENSIONS } from "./extensions.ts"
import { mdxInReading } from "./reading.ts"

/**
 * Opens `.mdx` files in Obsidian's Markdown view, so they are edited, linked and searched as notes,
 * and shows what MDX adds to Markdown, its imports and components, as code blocks.
 */
export default class MdxPlugin extends Plugin {
  async onload() {
    // Obsidian unregisters all three when the plugin unloads.
    this.registerExtensions(EXTENSIONS, "markdown")
    this.registerEditorExtension(mdxInEditor(this.app))
    this.registerMarkdownPostProcessor(mdxInReading(this.app))
  }
}
