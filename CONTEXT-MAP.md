# Context Map

This is a multi-context Nx repo. Each Nx project is its own context (for example, the Quartz site, the Obsidian vault, and auxiliary projects like the resume). A project's `CONTEXT.md` lives next to its `project.json`.

Contexts are deliberately **not** listed here. Discover them with Nx so this map never goes stale:

- **List contexts**: `pnpm nx show projects`
- **Locate a context**: `pnpm nx show project <name> --json`. The `root` field is the directory holding that context's `project.json`, `CONTEXT.md`, and `docs/adr/`.
- **See how contexts relate**: `pnpm nx graph --file=stdout` prints the project graph (nodes and dependencies) as JSON.

Read the `CONTEXT.md` of each context relevant to your task. If one is missing, proceed without it.

Contexts nest. A context inside another inherits the enclosing one's glossary: every package under
`quartz/plugins/`, `quartz/site-plugins/`, `quartz/libs/` and `quartz/tests/` uses the
family vocabulary in `quartz/CONTEXT.md` and defines only its own terms.

## ADRs

- **System-wide decisions**: `docs/adr/` at the repo root.
- **Context-specific decisions**: `<project-root>/docs/adr/`.
