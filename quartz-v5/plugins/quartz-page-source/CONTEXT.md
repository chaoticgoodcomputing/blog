# quartz-page-source

`@chaoticgoodcomputing/quartz-page-source`, manifest name `cgc-page-source`, loaded by package name (#89, #94): the Quartz 5 plugin that links each page to its source file in the site's repository: v4's
`ShowPageSource`, kept on [#42](https://github.com/chaoticgoodcomputing/blog/issues/42) and homed on
[#44](https://github.com/chaoticgoodcomputing/blog/issues/44). Inherits the family vocabulary in
[`quartz-v5/CONTEXT.md`](../../CONTEXT.md).

## Language

**Source link**:
The link this plugin renders, from a page to its source file as the repository host shows it.
_Avoid_: edit link, GitHub link (the host is whatever `repoUrl` names)

**Source file**:
The file in the repository a page was built from. For a page whose file in the content folder is a
symlink, as a **Plugin note** is, the source file is the file the link points at. Pages that Quartz
makes up (the 404 page, a tag page with no description file) have none, and get no source link.
_Avoid_: page file, markdown file (an `.mdx` page has one too)

**Content path**:
The content folder's path from the repository root, the `contentPath` option. Quartz only knows the
content folder relative to where it runs, so the plugin is told where that folder sits in the
repository.
_Avoid_: content dir, directory (Quartz's `-d` is relative to the build, not the repository)
