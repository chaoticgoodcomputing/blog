// The plugin's settings, kept in its data.json. The names are upstream's, so that a vault's settings
// from upstream carry over; settings for what the Annotator no longer does are dropped on saving.

import { type App, PluginSettingTab, Setting } from "obsidian"
import type AnnotatorPlugin from "./main.ts"
import { DEFAULT_PORT } from "./server.ts"

export interface AnnotatorSettings {
  /** Prepended to an annotation target that names no file, to look for it again (upstream's "custom default path"). */
  customDefaultPath: string
  /** The user's name, as the sidebar shows it on annotations. */
  displayName: string
  /**
   * Where saved copies of documents on the web are kept: a folder of the vault, or an absolute path.
   * Empty, the plugin's own folder's `documents/`, which git and the vault's index leave alone.
   */
  documentFolder: string
  /** The annotator's height in each note that was given one, by the note's path. */
  annotatorHeights: Record<string, number>
  /**
   * Whether the plugin serves the Annotator extension (the local service, src/server.ts). Off until
   * the user turns it on: it listens on a port of the user's machine.
   */
  serveExtension: boolean
  /** The local service's port; the extension's local settings name 27183. */
  servicePort: number
  /** Where a page's new annotation note goes, made from the browser: empty, where Obsidian puts new notes. */
  webNoteFolder: string
  annotationMarkdownSettings: {
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
  documentFolder: "",
  annotatorHeights: {},
  serveExtension: false,
  servicePort: DEFAULT_PORT,
  webNoteFolder: "",
  annotationMarkdownSettings: {
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
    documentFolder: data.documentFolder ?? DEFAULT_SETTINGS.documentFolder,
    annotatorHeights: { ...data.annotatorHeights },
    serveExtension: data.serveExtension ?? DEFAULT_SETTINGS.serveExtension,
    servicePort: Number.isInteger(data.servicePort) ? data.servicePort! : DEFAULT_SETTINGS.servicePort,
    webNoteFolder: data.webNoteFolder ?? DEFAULT_SETTINGS.webNoteFolder,
    annotationMarkdownSettings: {
      includePrefix: data.annotationMarkdownSettings?.includePrefix ?? DEFAULT_SETTINGS.annotationMarkdownSettings.includePrefix,
      highlightHighlightedText: data.annotationMarkdownSettings?.highlightHighlightedText ?? DEFAULT_SETTINGS.annotationMarkdownSettings.highlightHighlightedText,
      includePostfix: data.annotationMarkdownSettings?.includePostfix ?? DEFAULT_SETTINGS.annotationMarkdownSettings.includePostfix,
    },
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
      .setName("Your name")
      .setDesc("How the sidebar names you on your annotations.")
      .addText((text) => text.setValue(settings.displayName).onChange((value) => ((settings.displayName = value || DEFAULT_SETTINGS.displayName), save())))

    new Setting(containerEl)
      .setName("Default path")
      .setDesc("Looked in for an annotation target that names no file of the vault: put before the target, it names one.")
      .addText((text) => text.setPlaceholder("Attachments/").setValue(settings.customDefaultPath).onChange((value) => ((settings.customDefaultPath = value), save())))

    new Setting(containerEl)
      .setName("Where documents are kept")
      .setDesc(
        "A PDF on the web is saved the first time it is opened, and opened from its copy after; one supplied by hand is kept here too. " +
          "A folder of the vault, or an absolute path to one anywhere. Empty, the plugin's own folder, which the vault doesn't index.",
      )
      .addText((text) => text.setPlaceholder(this.plugin.defaultDocumentFolder()).setValue(settings.documentFolder).onChange((value) => ((settings.documentFolder = value.trim()), save())))

    containerEl.createEl("h3", { text: "The browser extension" })
    new Setting(containerEl)
      .setName("Serve the Annotator extension")
      .setDesc(
        "Annotations made in the browser with the Annotator extension are kept here, in each page's annotation note. " +
          "Listens on 127.0.0.1, this machine only, while Obsidian runs.",
      )
      .addToggle((toggle) => toggle.setValue(settings.serveExtension).onChange(async (value) => ((settings.serveExtension = value), await save(), await this.plugin.restartService())))
    new Setting(containerEl)
      .setName("Port")
      .setDesc(`The extension's local build calls ${DEFAULT_PORT}.`)
      .addText((text) =>
        text.setPlaceholder(String(DEFAULT_PORT)).setValue(String(settings.servicePort)).onChange(async (value) => {
          const port = Number(value || DEFAULT_PORT)
          if (!Number.isInteger(port) || port < 1 || port > 65535) return
          settings.servicePort = port
          await save()
          await this.plugin.restartService()
        }),
      )
    new Setting(containerEl)
      .setName("Folder for new notes")
      .setDesc("Where a page's annotation note is made, on its first annotation in the browser. Empty, where Obsidian puts new notes.")
      .addText((text) => text.setPlaceholder("Obsidian's folder for new notes").setValue(settings.webNoteFolder).onChange((value) => ((settings.webNoteFolder = value.trim()), save())))

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
