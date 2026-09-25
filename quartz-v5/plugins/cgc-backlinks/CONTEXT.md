# cgc-backlinks

The Quartz 5 component that lists the pages linking to a page, public ones first, with each private
one marked by a lock: v4's Backlinks fork (#44, #78). It needs no engine: it reads what stock Quartz
leaves on every page, and takes the private tags as its own option. Inherits the family vocabulary in
[`quartz-v5/CONTEXT.md`](../../CONTEXT.md) and the icon vocabulary of
[`icons`](../../libs/icons/CONTEXT.md). **Private page** means what it means in
[`cgc-seo`](../cgc-seo/CONTEXT.md), less the tag's own listing page.

## Language

**Backlink**:
A page that links to the page being read, as Quartz's crawl records it on the linking page's
`links`: whatever writes a link there counts, a `.mdx` page's body or an annotation's note alike.
One item in the list, `.cgc-backlinks__item`.
_Avoid_: incoming link, reference, mention

**Private tag**:
One of the tags the `privateTags` option names (`private` on this site). A page carrying one, or any
descendant of one (`private/work`), is a **private backlink** wherever it links. A tag that only
starts with the same letters (`privateer`) is no descendant.
_Avoid_: hidden tag, noindex tag (that is cgc-seo's option for the same tags)

**Private backlink**:
A backlink from a private page. Its link carries the `--private` modifier and the **lock**, and it
sorts after every public backlink.
_Avoid_: locked link, private link

**Mark**:
The box before each backlink's title, `.cgc-backlinks__mark`: the **lock** for a private backlink,
and a bullet, drawn by the stylesheet, for a public one.
_Avoid_: file icon (v4's class name), bullet (for the box itself)

**Lock**:
The private mark: the `privateIcon` icon id, `mdi:lock` by default, drawn inline once per build as
`svg.cgc-backlinks__icon`, in `currentColor` and so in the link's colour.
_Avoid_: private icon (that is the option), padlock

**Backlink order**:
v4's: public before private, then the most recently modified (else published) first, then titles in
reverse alphabetical order.
_Avoid_: sort, ranking

## Constraints

- **No engine.** It depends on `cgc-styles` for its cascade position only, and on no tag engine: the
  private tags are its own option, as they are cgc-seo's, so a site gives both the same list.
- **It draws the lock itself,** with `@chaoticgoodcomputing/icons`, on the first page rendered,
  whether or not that page has a private backlink, so an icon id no collection has fails every build.
- **Unlisted pages are never backlinks,** as in stock's component: `unlisted: true` hides a page from
  every listing. A private page stays listed.
- **The list is core's overflow list.** It carries core's `overflow` classes and toggles core's
  `gradient-active`, as stock's does. Its own stylesheet selects none of them (ADR-0003 rule 2).
