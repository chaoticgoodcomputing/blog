# quartz-backlinks

`@chaoticgoodcomputing/quartz-backlinks`, manifest name `cgc-backlinks`: the Quartz 5 component that
lists the pages linking to a page, public ones first, with each private one marked by a lock or, if
the site asks, left out: v4's Backlinks fork (#44, #78, #85). It needs no engine: it reads what
stock Quartz leaves on every page, and takes the private tags as its own option. Inherits the family
vocabulary in [`quartz/CONTEXT.md`](../../CONTEXT.md), the icon vocabulary of
[`icons`](../../libs/icons/CONTEXT.md), and the **Private tag**, **Private page** and **Under** of
[`tags-core`](../../libs/tags-core/CONTEXT.md), whose rule it inlines: a library, not an engine.

## Language

**Backlink**:
A page that links to the page being read, as Quartz's crawl records it on the linking page's
`links`: whatever writes a link there counts, a `.mdx` page's body or an annotation's note alike.
One item in the list, `.cgc-backlinks__item`.
_Avoid_: incoming link, reference, mention

**Private backlink**:
A backlink from a private page: one carrying a tag the `privateTags` option names (`private` on this
site), or a tag under one (`private/work`, but not `privateer`). Its link carries the `--private`
modifier and the **lock**, and it sorts after every public backlink.
_Avoid_: locked link, private link

**Private pages left out**:
The `excludePrivate` option, off by default and on for the real site (the owner's review notes of
2026-09-26, #85): a private page is no backlink at all, rather than a **private backlink**. A page
only private pages link to has none, so `hideWhenEmpty` leaves its section out.
_Avoid_: hidden backlinks, private filter

**Mark**:
The box before each backlink's title, `.cgc-backlinks__mark`: the **lock** for a private backlink,
and a bullet, drawn by the stylesheet, for a public one.
_Avoid_: file icon (v4's class name), bullet (for the box itself)

**Lock**:
The private mark: v4's `mdi:lock`, drawn inline once per build as `svg.cgc-backlinks__icon`, in
`currentColor` and so in the link's colour. It is fixed, as quartz-tag-explorer's lock is.
_Avoid_: private icon, padlock

**Backlink order**:
v4's: public before private, then the most recently modified (else published) first, then titles in
reverse alphabetical order.
_Avoid_: sort, ranking

## Constraints

- **No engine.** It depends on `quartz-styles` for its cascade position only, and on no tag engine: the
  private tags are its own option, as they are quartz-seo's, so a site gives both the same list. Which
  pages are private is tags-core's rule, which it inlines as a library (ADR-0002 rule 4), reading
  each page's frontmatter tags.
- **It draws the lock itself,** with `@chaoticgoodcomputing/icons`, from MDI, which installs with the
  plugin, once per build. Nothing is fetched in the browser.
- **Unlisted pages are never backlinks,** as in stock's component: `unlisted: true` hides a page from
  every listing. A private page stays listed, unless **private pages are left out**.
- **The list is core's overflow list.** It carries core's `overflow` classes and toggles core's
  `gradient-active`, as stock's does. Its own stylesheet selects none of them (ADR-0003 rule 2).
