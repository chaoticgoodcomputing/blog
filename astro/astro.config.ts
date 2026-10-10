import { fileURLToPath } from "node:url"
import { satteri } from "@astrojs/markdown-satteri"
import mdx from "@astrojs/mdx"
import preact from "@astrojs/preact"
import { obsidianFeatures, obsidianResolve, obsidianSyntax } from "@chaoticgoodcomputing/obsidian-markdown"
import { defineConfig } from "astro/config"
import { islands } from "./src/lib/islands.ts"
import { urlOf, urlOfPath } from "./src/lib/notes.ts"
import { tagUrl } from "./src/lib/tags.ts"
import { getVault } from "./src/lib/vault.ts"

// A feature that is part of this configuration is imported here, apart from the others, and used
// below. A comment that names a ticket is a label, not a reserved line; a change to this file is
// recorded in README.md, "Working in parallel".

import { attachments } from "./src/integrations/attachments.ts"
import { widgetAddresses } from "./src/lib/widget-addresses.ts"

import { attachmentLinks } from "./src/lib/attachment-links.ts"

import { obsidianExcalidraw } from "@chaoticgoodcomputing/obsidian-markdown"
import { drawingExportUrl } from "./src/lib/drawings.ts"

import { mermaidDiagrams } from "./src/lib/mermaid.ts"

// 05 math
import { math } from "./src/lib/math.ts"

// 07 fonts
import { fontProviders } from "astro/config"

// 11 icons
import icon from "astro-icon"
import { tagDictionary } from "./src/integrations/tag-dictionary.ts"

import sitemap from "@astrojs/sitemap"
import { sitemapEntry } from "./src/lib/sitemap.ts"

import { sitemapAddress } from "./src/integrations/sitemap-address.ts"

import { getAliasRedirects } from "./src/lib/aliases.ts"
import { getFormerAddressRedirects } from "./src/lib/former-addresses.ts"

import { search } from "./src/integrations/search.ts"

import { obsidianAnnotator } from "@chaoticgoodcomputing/obsidian-markdown"
import { annotatedDocument, annotationDate } from "./src/lib/annotations.ts"

import { mirrors } from "./src/integrations/mirrors.ts"

import { externalLinks } from "./src/lib/external-links.ts"
import { headingAnchors } from "./src/lib/heading-anchors.ts"
import { calloutIcons } from "./src/lib/callouts.ts"

// The site's address, named once here because a Markdown plugin, which can't read `Astro.site`,
// must know a link to the site from a link to another (src/lib/external-links.ts).
const site = "https://blog.chaoticgood.computer"

const widgets = fileURLToPath(new URL("./src/components/widgets/", import.meta.url))

// The end-to-end suite builds a site of its own beside the real build, and names a cache for it
// (playwright.config.ts, docs/adr/0007).
const e2eCache = process.env.E2E_CACHE_DIR

// What works on the syntax's own nodes, a wikilink or an embed as written, goes here, before the
// resolver turns each into a link.
const beforeLinks = [
  // An embed of an Excalidraw drawing is the SVGs exported beside it, each at the address the
  // site publishes it at (src/pages/drawings), rather than a link to the drawing's note.
  obsidianExcalidraw({ vault: getVault, urlFor: drawingExportUrl }),

  // A note with an annotation target is its preface, its annotations and its epilogue, in place of
  // the Annotator plugin's blocks, and opens with a link to the annotated document, which the
  // resolver then gives the address the site publishes it at when it is in the vault
  // (src/lib/annotations.ts).
  obsidianAnnotator({ vault: getVault, formatDate: annotationDate }),
  annotatedDocument(),
]

export default defineConfig({
  // The site's address, kept here as Astro has it. A page reads it as `Astro.site`.
  site,
  // One file per page, `content/notes/a.html`, so a note keeps the address it has today, without a
  // trailing slash. Every page's styles are written into the page, so no stylesheet holds its first
  // paint back (docs/adr/2902).
  build: { format: "file", inlineStylesheets: "always" },
  ...(e2eCache ? { cacheDir: e2eCache } : {}),

  // 07 fonts
  // Inter for text and IBM Plex Mono for code, downloaded from Google Fonts when the site builds
  // and served by the site itself (Base.astro). Each is a property under the name the vault's
  // widgets read it by (docs/adr/0005).
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--bodyFont",
      weights: ["400 700"],
      styles: ["normal", "italic"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "IBM Plex Mono",
      cssVariable: "--codeFont",
      weights: [400, 600, 700],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["ui-monospace", "monospace"],
    },
  ],

  // Each alias of a note is an address that forwards the reader to the note, as a page Astro writes
  // (src/lib/aliases.ts). Read once, as the config loads: the dev server takes a new alias on a restart.
  // So does each address the Quartz site served a page or an attachment at that this site serves
  // elsewhere (src/lib/former-addresses.ts, docs/adr/2901).
  redirects: { ...getAliasRedirects(), ...getFormerAddressRedirects() },

  integrations: [
    mdx(),
    preact(),

    // The vault's attachments, each at its path in the vault (docs/adr/0101).
    attachments(),

    // The mirrors of the annotated documents, which git ignores, each at its path in the vault
    // (docs/adr/2801).
    mirrors(),

    // 11 icons
    // An icon id drawn as inline SVG when the site builds: Material Design Icons, and the site's own
    // SVG files in src/icons (docs/adr/1101). The tag dictionary is checked against the vault.
    icon(),
    tagDictionary(),

    // The indexable pages, each with when it last changed (src/lib/sitemap.ts).
    sitemap({
      filter: (page) => sitemapEntry(page) !== undefined,
      serialize: (item) => ({ ...item, lastmod: sitemapEntry(item.url)?.lastModified?.toISOString() }),
    }),

    // The sitemap at /sitemap.xml too, the address search consoles have on file (docs/adr/1501).
    sitemapAddress(),

    // The search index: the indexable pages, each as the build wrote it (docs/adr/1901).
    search(),
  ],
  markdown: {
    // 08 code themes
    // Code is highlighted in GitHub's light and dark themes, each token's colour a `light-dark()`
    // pair, so a block follows the page's colour scheme as the palette does (docs/adr/0801).
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: "light-dark()",
    },

    processor: satteri({
      features: obsidianFeatures,
      mdastPlugins: [
        ...obsidianSyntax({ tags: false }),
        ...beforeLinks,

        // The vault is asked for on every render, so a note is resolved against the vault as the
        // dev server last read it. Where a link goes is the notes query's answer. An embedded note
        // is compiled by the resolver on its own, and runs `beforeLinks` there too.
        obsidianResolve({ vault: getVault, urlFor: urlOf, urlForPath: urlOfPath, tagUrl, beforeResolve: beforeLinks }),

        mermaidDiagrams(),
      ],
      hastPlugins: [
        islands(),
        // A widget that names an attachment as Quartz addressed it gets the attachment's own
        // address (docs/adr/0101).
        widgetAddresses(),

        // A link to an attachment is the browser's to follow, not the client router's (docs/adr/0901).
        attachmentLinks(),

        // 05 math
        math(),

        // A link to another site opens in a new tab (docs/adr/3401).
        externalLinks(site),

        // A callout's title begins with its kind's icon, and a folding one's ends with a fold icon.
        calloutIcons(),

        // Each heading ends with a link to itself (docs/adr/3402). It gives the headings their ids
        // before Astro does, so it stays after every plugin that adds or renames a heading.
        headingAnchors(),
      ],
    }),
  },
  vite: {
    resolve: {
      alias: [
        // The widgets the vault's MDX notes import by package name are this site's own components:
        // `@chaoticgoodcomputing/widgets/pdf-viewer` is src/components/widgets/pdf-viewer.
        { find: /^@chaoticgoodcomputing\/widgets\/(.+)$/, replacement: `${widgets}$1` },
      ],
      // A widget kept in the vault sits outside this project, where no Preact is installed: it
      // takes this site's.
      dedupe: ["preact"],
    },
    server: {
      // The vault sits outside this project, and its images are served from where they are.
      fs: { allow: [".."] },
      // The end-to-end suite's builds are not the dev server's to follow.
      watch: { ignored: ["**/.e2e/**"] },
    },
    // The end-to-end suite's server takes the port it is given or fails, so a spec never reads
    // another checkout's site (docs/adr/0007).
    preview: { strictPort: e2eCache !== undefined },
  },
})
