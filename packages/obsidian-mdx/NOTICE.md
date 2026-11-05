# Notice

This directory is a **modified version** of [mdx as md](https://github.com/mkozhukharenko/mdx-as-md-obsidian),
by Nikolay Kozhukharenko, on a plugin template by deathau, hard-forked into this repository on
**2026-11-04**.

- **Forked from**: upstream commit
  [`0688d0798c1f93f3046844bf19cd9193420a2f9e`](https://github.com/mkozhukharenko/mdx-as-md-obsidian/commit/0688d0798c1f93f3046844bf19cd9193420a2f9e),
  release 0.0.1, 2021-04-18, upstream's last.
- **What came in**: its one source file, `src/main.ts`. Its rollup build, npm scripts and GitHub
  release workflows are replaced by this repository's esbuild build and Nx targets.
- **What changed**: the plugin's id is `obsidian-mdx` (upstream's is `mdx-as-md-obsidian`), so the
  two install into different folders of a vault. Run one of them, not both: Obsidian lets only one
  plugin register `.mdx`. `obsidian` is pinned to 1.14.4 in place of the API's master branch.
  Since 0.2.0, a note's imports and components are shown as code blocks (`src/editor.ts`,
  `src/reading.ts`).

## License

Upstream's `package.json` names its license as **MIT**; upstream ships no license file and states
no copyright line. This fork is MIT too, in [LICENSE.md](./LICENSE.md), which credits upstream's
authors.
