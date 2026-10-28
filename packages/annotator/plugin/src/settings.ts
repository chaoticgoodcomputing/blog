// The plugin's settings, kept in its data.json. The names are upstream's, so that a vault's settings
// from upstream carry over; settings for what the Annotator no longer does are dropped on saving.

import { type App, PluginSettingTab, Setting } from "obsidian"
import type AnnotatorPlugin from "./main.ts"

export interface AnnotatorSettings {
  /** Prepended to an annotation target that names no file, to look for it again (upstream's "custom default path"). */
  customDefaultPath: string
  /** The user's name, as the sidebar shows it on annotations. */
  displayName: string
  annotationMarkdownSettings: {
    /** Open annotation notes in annotation mode, not as Markdown. */
    annotationModeByDefault: boolean
    /** A block's view writes the text before its passage. */
    includePrefix: boolean
    /** A block's view marks its passage as highlighted. */
    highlightHighlightedText: boolean
    /** A block's view writes the text after its passage. */
    includePostfix: boolean
  }
}

export const DEFAULT_SETTINGS: AnnotatorSettings = {
  customDefaultPath: "",
  displayName: "Me",
  annotationMarkdownSettings: {
    annotationModeByDefault: true,
    includePrefix: true,
    highlightHighlightedText: true,
    includePostfix: true,
  },
}

/** Settings as saved, with what they lack filled in from the defaults. */
export function settingsFrom(saved: unknown): AnnotatorSettings {
  const data = (saved ?? {}) as Partial<AnnotatorSettings>
  return {
    customDefaultPath: data.customDefaultPath ?? DEFAULT_SETTINGS.customDefaultPath,
    displayName: data.displayName ?? DEFAULT_SETTINGS.displayName,
    annotationMarkdownSettings: { ...DEFAULT_SETTINGS.annotationMarkdownSettings, ...data.annotationMarkdownSettings },
  }
}

export class AnnotatorSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: AnnotatorPlugin,
  ) {
    super(app, plugin)
  }

  display() {
    const { containerEl } = this
    const settings = this.plugin.settings
    const markdown = settings.annotationMarkdownSettings
    const save = () => this.plugin.saveSettings()
    containerEl.empty()

    new Setting(containerEl)
      .setName("Open annotation notes in annotation mode")
      .setDesc("Show a note with an annotation target as its document, with the annotations beside it. Off, it opens as Markdown.")
      .addToggle((toggle) => toggle.setValue(markdown.annotationModeByDefault).onChange((value) => ((markdown.annotationModeByDefault = value), save())))

    new Setting(containerEl)
      .setName("Your name")
      .setDesc("How the sidebar names you on your annotations.")
      .addText((text) => text.setValue(settings.displayName).onChange((value) => ((settings.displayName = value || DEFAULT_SETTINGS.displayName), save())))

    new Setting(containerEl)
      .setName("Default path")
      .setDesc("Looked in for an annotation target that names no file of the vault: put before the target, it names one.")
      .addText((text) => text.setPlaceholder("Attachments/").setValue(settings.customDefaultPath).onChange((value) => ((settings.customDefaultPath = value), save())))

    containerEl.createEl("h3", { text: "How annotations are written into the note" })
    new Setting(containerEl)
      .setName("Text before the passage")
      .addToggle((toggle) => toggle.setValue(markdown.includePrefix).onChange((value) => ((markdown.includePrefix = value), save())))
    new Setting(containerEl)
      .setName("Highlight the passage")
      .addToggle((toggle) => toggle.setValue(markdown.highlightHighlightedText).onChange((value) => ((markdown.highlightHighlightedText = value), save())))
    new Setting(containerEl)
      .setName("Text after the passage")
      .addToggle((toggle) => toggle.setValue(markdown.includePostfix).onChange((value) => ((markdown.includePostfix = value), save())))
  }
}
