/**
 * Manifest shape for an external documentation source whose pages should
 * appear in the Quartz content graph but be hosted off-site.
 */
export interface ExternalSource {
  /** Short identifier; used as the default slug prefix (`external/<name>`). */
  name: string

  /** Where the markdown lives. Path is relative to the workspace root. */
  source: {
    path: string
    /** Glob patterns relative to `source.path`. Defaults to `["**\/*.md"]`. */
    include?: string[]
    /** Glob patterns to exclude. */
    exclude?: string[]
  }

  /** Base URL of the deployed external docs site (no trailing slash). */
  baseUrl: string

  /** Override the default slug prefix (`external/<name>`). */
  slugPrefix?: string

  /**
   * Map a relative source path (e.g. `guides/slicing-pipelines.md`) to its
   * external URL. Defaults to stripping the extension and joining with baseUrl;
   * `index.md` files map to the parent directory.
   */
  toExternalUrl?: (relativePath: string, baseUrl: string) => string

  /** Frontmatter derivation rules applied when source files lack metadata. */
  frontmatter?: {
    /** Tags always added to every entry from this source. */
    addTags?: string[]
    /** Description used when neither frontmatter nor first paragraph is available. */
    fallbackDescription?: string
    /** Source of the date field. Defaults to `file-mtime`. */
    dateStrategy?: "file-mtime" | "fixed"
    /** Used when `dateStrategy === "fixed"`. ISO 8601. */
    fixedDate?: string
  }
}
