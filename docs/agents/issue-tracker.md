# Issue tracker: local Markdown

Issues and specs for this repo live as Markdown files under `.scratch/`, at the repo root. `.gitignore` excludes the directory, so issues stay on this machine: they are never committed or filed on GitHub. Don't create GitHub issues unless the user asks for one.

## Layout

One directory per effort, holding numbered issue files:

```
.scratch/<effort>/
├── 0-tracking.md            the effort's parent issue
├── 1-<slug>.md
└── 2-<slug>.md
```

- An issue's **id** is `<effort>/<number>`, e.g. `vault-immutable/2`. Within one effort, a bare number is enough.
- A file's first line is `# <title>`, after its frontmatter. The body opens with an executive summary.
- An effort's `0-*.md` is its parent: the goal, the decisions that span the effort, and the order of its children. Every other file in the directory is a child.

## Frontmatter

```yaml
---
status: open             # open | closed | wontfix
labels: [needs-triage]   # see triage-labels.md
blocked-by: [1]          # numbers of issues in the same effort; omit when none
assignee: agent          # set when work is claimed; omit when unclaimed
---
```

## Conventions

- **Create an issue**: write the next numbered file in the effort's directory, or a new directory with a `0-tracking.md` for a new effort.
- **Read an issue**: read its file.
- **List issues**: glob `.scratch/*/*.md` and read each file's frontmatter, filtering on `status` and `labels`.
- **Comment on an issue**: append to a `## Comments` section at the end of the file, each entry headed `### <YYYY-MM-DD>`.
- **Apply / remove labels**: edit `labels`.
- **Close**: set `status: closed` and add a comment saying why or what resolved it.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(`/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Write the issue file. Publishing is local, so no approval gate is needed before writing it.

## When a skill says "fetch the relevant ticket"

Read its file under `.scratch/`.

## Wayfinding operations

Used by `/wayfinder`.

- **Map**: the effort's `0-tracking.md`, holding the Notes / Decisions-so-far / Fog body. Add `wayfinder:map` to its labels.
- **Child ticket**: any other file in the effort's directory. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`).
- **Blocking**: the child's `blocked-by` list. A ticket is unblocked when every issue it lists is `closed`.
- **Frontier query**: the effort's children with `status: open`, no open blocker and no `assignee`. The lowest number wins.
- **Claim**: set `assignee`, as the session's first write.
- **Resolve**: comment the answer, set `status: closed`, then append a context pointer (gist + file path) to the map's Decisions-so-far.
