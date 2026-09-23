# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This is a **multi-context** repo coordinated by Nx. Every Nx project (any directory with a `project.json`) is a context and should have its own `CONTEXT.md` beside its `project.json`.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root. It doesn't list contexts; it explains how to discover them with Nx (`pnpm nx show projects`, `pnpm nx show project <name> --json` for a project's `root`).
- **`<project-root>/CONTEXT.md`** for each context relevant to the topic.
- **`docs/adr/`** for system-wide decisions, and **`<project-root>/docs/adr/`** for context-scoped decisions in the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved. When it does, a context's `CONTEXT.md` goes in that Nx project's root, next to `project.json`.

## File structure

```
/
├── CONTEXT-MAP.md                     ← points at Nx for discovery
├── docs/adr/                          ← system-wide decisions
├── <project-root>/                    ← e.g. quartz/, content/, resume/
│   ├── project.json
│   ├── CONTEXT.md
│   └── docs/adr/                      ← context-specific decisions
└── ...
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
