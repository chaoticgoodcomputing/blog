---
authors: [spelkington]
contexts: [site, obsidian-markdown]
areas: [testing]
exemplars: []
status: accepted
---

# Durable and ephemeral tests

Every test is one of two kinds, and where it lives says which. A **durable** test is a long-term
guarantee of what the site does, written loosely enough to outlive a redesign. An **ephemeral**
test enforces the behaviour an effort is building, as precisely as that work needs, and is deleted
when the effort closes. We decided this because the suite was fragile: tests written to drive one
design went on asserting that design, so a redesign broke them even where nothing a reader relies
on had changed.

## The two kinds

**Durable** tests live where tests live today. Each states a guarantee in the terms a reader of
the site would use ("every note lists the notes that link to it", "the footer links to the
author's contact addresses"), and asserts it through what a reader or a machine meets: roles and
accessible names, landmarks, addresses, emitted files. Never class names, which region holds a
feature, or measured geometry. A durable test that fails means a guarantee broke, or is being
changed on purpose, and that change is the effort's to justify.

**Ephemeral** tests live in an `efforts/<effort>/` directory under their test root, named for the
effort in `.scratch/<effort>/`. They may assert anything the work in progress needs pinned down:
structure, placement, breakpoints, pixel positions. Closing the effort deletes the directory.
Before it goes, any guarantee among its tests that should outlive the effort is rewritten as a
durable test.

## Considered options

- **One kind of test, rewritten at each redesign.** The cost recurs with every redesign, and
  every rewrite is a chance to drop a guarantee by accident.
- **A tag on each ephemeral test.** Finer-grained, since a file could mix both kinds, but the two
  test runners tag differently, and closing an effort becomes editing files rather than deleting
  them.
- **The effort in each ephemeral file's name.** As easy to delete, but leaves ephemeral and
  durable files side by side, where the difference is easy to miss.

## Consequences

The site's Playwright specs that assert the current site shell's structure (its sidebars, the
regions features sit in, its breakpoint widths) are ephemeral tests of the design that built the
shell, written before this distinction existed. The effort that replaces the shell
(`stacked-notes`) deletes them, keeping as durable tests the guarantees among them still wanted.

## Status

**Accepted.**

## Changelog

- **2026-10-24**: Recorded.
