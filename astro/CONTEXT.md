# The Astro site

The blog as Astro builds it: the Obsidian vault at `content/public`, rendered through
`@chaoticgoodcomputing/obsidian-markdown`, in a site organised the way Astro's documentation
organises one. It replaces the Quartz site under `quartz/`, and keeps that site's words for what a
reader sees where they still fit. How the project is laid out and worked on is in
[README.md](./README.md); why it departs from an Astro default, where it does, is in
[docs/adr](./docs/adr).

## Language

### The vault and its notes

**Vault**:
The Obsidian vault the site is built from: the assembled vault, or the folder `VAULT_ROOT` names.
Its sources stay where Obsidian has them, outside this project.
_Avoid_: content folder, content directory

**Vault source**:
A folder the assembled vault is put together from, mounted at its root: `content/public`, then the
private notes' stubs in `dist/vault-private`. The site only reads one.
_Avoid_: input vault

**Assembled vault**:
`dist/vault`, which `astro:vault` writes from the vault sources (`src/lib/assembly.ts`): each
note copied, with the `public/` and `private/` its links start with taken off
(`src/lib/link-prefixes.ts`), each attachment linked, without dotfiles and what git ignores. Its
manifest, `.sources.json`, names each file's source file, which is where the file's git history is.
_Avoid_: merged vault, build vault

**Note**:
A Markdown or MDX file of the vault.
_Avoid_: page (what a published note has), document, file (a note is one kind)

**Attachment**:
A file of the vault that is not a note: an image, a PDF, a drawing's exported SVG.
_Avoid_: asset (that is a file of this project's, under `src/assets`), static file

**Attachment address**:
Where the site publishes an attachment: its path in the vault, from the site's root and not
percent-encoded, `/assets/Thesis Draft.pdf`. What `publishedAttachments()` is keyed by, and what
`attachmentAddressOf()` reads from a link's `href` or a request's URL.
_Avoid_: attachment URL, pathname

**Slug**:
A note's path as its address writes it: the path in the vault without its extension, with a space
as `-`. Also the id of the note's collection entry. A tag's path is a **tag slug**, never just a
slug.
_Avoid_: id (except for the collection entry's), permalink

**Notes query**:
`src/lib/notes.ts`: the one module that says which notes are published and what each one knows.
Every listing, the feed, the sitemap, search, the graph and the tag pages ask it, and so does the
Markdown pipeline, for where a link goes.
_Avoid_: content index (Quartz's), `getCollection` (the collection renders a note's body, and is
asked nothing else)

**Published note**:
A note with a page of its own. What the notes query returns unless asked otherwise.
_Avoid_: public note (a published note may be a private page)

**Unpublished note**:
A note taken out of publication for a named reason: a drawing, a tag description note. It has no
page at its own address, and is still a note: another note embeds it, or a tag page shows its body.
A link to one goes where its kind says, or is unresolved.
_Avoid_: hidden note, draft (a draft is no note of the site's), excluded note

**Draft**:
A note whose frontmatter says `draft: true`. It is no file of the site's vault, as a file git
ignores is none (`openVault()`, `src/lib/vault.ts`): it has no page, no other note embeds it, a
link to it is unresolved, and what only it links to is not published.
_Avoid_: unpublished note (which is still a note of the vault), hidden note

**Drawing**:
An Excalidraw drawing: a note that opens with the `excalidraw-plugin` frontmatter key and holds the
scene, which only Obsidian's Excalidraw plugin draws. An unpublished note: where another note
embeds it, the page shows its export.
_Avoid_: doodle (the vault's folder for them), diagram, canvas (Obsidian's other format)

**Export**:
An SVG the Excalidraw plugin writes beside a drawing: `<name>.light.svg` and `<name>.dark.svg`, one
for each colour scheme, or one `<name>.svg` for both. An attachment, and published as well, under
`/drawings`, without the canvas it was drawn on.
_Avoid_: image (any picture), render, preview

**Note's date**:
The one date a note has: its frontmatter's `date`, else the time of the last commit to touch its
file, else the file's modification time. Read and printed in UTC: a frontmatter date is written as
ISO 8601, and one with no zone is UTC. A note also has the time it was last modified, from git and
then the file system, which is never before its date.
_Avoid_: created date, published date (the vault writes neither)

**Reading time**:
How long a note takes to read, in whole minutes: the words of its text, without frontmatter,
comments or markup, at two hundred a minute. Printed `3 min read`, beside the note's date.
_Avoid_: read time, length

**Private tag**:
A tag that site configuration names as private.
_Avoid_: noindex tag, hidden tag

**Private page**:
A page under a private tag, or under a tag under one. It is built and served like any page; it
asks not to be indexed, and whatever lists pages leaves it out or shows it marked, as site
configuration says for each.
_Avoid_: hidden page, unlisted page, draft (which has no page at all)

**Post**:
A published note whose page is not private, as a listing shows it.
_Avoid_: entry, item

**Article**:
A note under one of the site's article folders. The feed holds the articles that are posts.
_Avoid_: blog post

**Article type**:
The schema.org type an article's page says it is in its JSON-LD (`TechArticle`, `HowTo`), and its
section: those of the first of site configuration's rules whose tag the note is under, else the
default type, with no section.
_Avoid_: page type, schema

**Indexable page**:
A page the site asks search engines to index, and lists in its sitemap. Every page is one except a
private page, a private tag page and the 404 page.
_Avoid_: public page, listed page

**Private tag page**:
The tag page of a private tag, or of a tag under one: `tags/private`, `tags/private/work`. Not a
private page, since it is no note's, and kept out of search engines the same way.
_Avoid_: private page (for the tag's own page)

### Tags

**Tag**:
A path of levels, `engineering/ai`, which puts a note under itself and under each of its ancestors.
The site's tags are frontmatter's; a `#word` in a note's body is text.

**Tag slug**:
A tag's full path, every level from the top with `/` between them and no `#`:
`engineering/languages/typescript`. How every module and rule names a tag.
_Avoid_: tag path, full tag

**Tag name**:
The last level of a tag slug: `typescript`. What a reader reads a tag by.
_Avoid_: label, leaf, short name

**Tag dictionary**:
The one table of what a tag is drawn with, its colour and its icon, by tag slug, in site
configuration. The only place either is written.
_Avoid_: tag table, tag config

**Colour value**:
Anything CSS accepts as a colour, a `light-dark()` pair or a `var(--…)` reference included. Every
colour in site configuration is one, never a hex-only string.
_Avoid_: hex, colour code

**Tag colour**:
The colour value a tag carries, its own or its nearest ancestor's. It is decorative: it paints a
tag bubble's rim, and never text.

**Icon id**:
A `prefix:name` string naming one icon: `mdi:robot`, `custom:d20`.
_Avoid_: icon name, icon key

**Icon collection**:
A set of icons under one prefix: an installed set (`mdi`), or the site's own SVG files (`custom`).
_Avoid_: icon pack, icon library

**Tag icon**:
The icon a tag is drawn with: its own icon id's, or its nearest ancestor's. A tag with none in its
lineage has no icon.

**Tag bubble**:
The circle that holds a tag's icon, in a rim of the tag colour. It holds no text, and is drawn the
same in a badge and as a graph node.
_Avoid_: ring, dot, icon badge

**Tag badge**:
A tag bubble, then `#` and the tag name. How a tag appears among text: under a note's title, and
in the post listing.
_Avoid_: pill, chip, tag link

**Tag page**:
The one page a tag has, at `tags/<tag slug>`: one for each tag a published note carries, a private
page included, and each ancestor of one. Its tag description note, its subtags, and the posts under
it. The page of a tag that only private pages carry lists no posts, and is still an indexable page
unless the tag is private.
_Avoid_: tag listing, folder page

**Tags index**:
The page at `tags` that lists the top-level tags but a private tag, and every post.

**Tag description note**:
The note at `tags/<tag slug>.md`, whose body is the body of that tag's page. An unpublished note:
its page is the tag page.
_Avoid_: description file (the Quartz name), tag note

### Pages and layout

**Site configuration**:
`src/site.config.ts`: the values that say what site this is, each of a type in
`src/site.config.types.ts`. The site's address is the one such value kept elsewhere, in
`astro.config.ts`, where Astro has it.
_Avoid_: site config (Quartz's YAML file), settings

**Site shell**:
What is around a page's content on every page, `src/layouts/Page.astro`: the graph column, the
trail's spines, the header over the content, and what follows the body.
_Avoid_: frame (Quartz's), chrome, template

**Graph column**:
The column beside the note on every page, in view while the note scrolls: the site's title and
the search box, the local graph, and the footer.
_Avoid_: sidebar, rail

**Spine**:
One note of the trail before the note shown, as a strip beside it with the note's title on its
side, which goes back to that note.
_Avoid_: column, tab, breadcrumb

**Page kind**:
Which page the site shell is around: a note, the home page, a tag page, an annotation page, the
404 page. A feature is shown on some kinds and not others.
_Avoid_: page type (Quartz's), layout

**Named place**:
A region of a layout that features are put into: the head, the graph column's header and footer,
the header over the content, after the body, the end of the body.
_Avoid_: slot (Astro's word, for content a page passes in), position

**Reserved line**:
The one line of a shared file that names a ticket, and that the ticket's feature replaces. How
features written side by side reach one file without their branches conflicting.

**Annotation page**:
A note with an annotation target, shown as its annotations beside the document they were written
against.
_Avoid_: annotated note, PDF page

**Annotation target**:
The address a note's `annotation-target` property holds.

**Annotated document**:
The file at an annotation target. Somebody else's, and always named by its address.
_Avoid_: source document (the Quartz name), PDF, original

**Annotation**:
One passage of an annotated document, with the comment written on it in Markdown and its tags, as
the Annotator plugin keeps it: a block of the note whose record is JSON. It is addressed by its
block id, `#^id`.
_Avoid_: highlight (that is the passage as the page marks it), card

**Preface**:
What an annotation page's note says before its first annotation.
_Avoid_: intro, description

**Epilogue**:
What an annotation page's note says after its first annotation that is not one.
_Avoid_: conclusion, outro

**Mirror**:
The site's own pinned copy of an annotated document, served from the site under
assets/annotated-documents. Saved in the mirror directory, the repository's dist/mirrors, and never
in the vault, under the document's file name, and never fetched again once saved.
_Avoid_: download, cached PDF

**Annotation viewer**:
The island on an annotation page that draws the mirror with its highlights, and lays the page's
cards out around it: in its margin, or in a drawer. A page whose document has no mirror has none.
_Avoid_: PDF viewer (that is a widget), reader

**Card**:
One annotation as the page shows it: its passage, quoted, the comment on it, its tags and its
date, in a box. Without the document, the cards are the page, in one column.
_Avoid_: comment, annotation (that is the thing the card shows)

**Highlight**:
The annotation viewer's mark over each line of an annotation's passage, where it finds it in the
document: a link to the annotation.
_Avoid_: annotation, selection

**Margin**:
The column beside the document where the cards sit, each level with its passage, where the
document fits beside it.
_Avoid_: sidebar, panel

**Drawer**:
On an annotation page, the cards where the margin doesn't fit, coming in from the right edge, from
its tab. A phone's covers most of the screen.
_Avoid_: sidebar, sheet

### Features

**Backlinks**:
The notes that link to a note, an embed counting as a link.

**Forward links**:
The notes a note links to, an embed counting as a link.
_Avoid_: outgoing links, outlinks

**Links panel**:
Under a note, its forward links beside its backlinks, each with its description.
_Avoid_: backlinks panel (it was only that once)

**Post listing**:
Posts, newest first: all of them on the home page and the 404 page, a tag's on its tag page.
_Avoid_: recent posts (its heading), feed (that is the RSS)

**Graph index**:
The file the site publishes of its notes, its tags and the links between them, which every graph
is drawn from.

**Trail**:
The notes a reader came through to the note shown, oldest first, ending with it, and at most a
configured number of them. Following a link goes on to its note, or back to it if the trail has
it already. The address carries the trail, so a trail can be shared.
_Avoid_: stack, path, history (the browser's)

**Local graph**:
The graph in the graph column: every note of the reader's trail, what is next to each, and their
tags, with the trail drawn through them.
_Avoid_: mini graph

**Global graph**:
Every note and tag of the site, in a dialog opened from the local graph, over the time period and
with or without the private pages the reader chooses.
_Avoid_: full graph, site graph

**Time period**:
Which notes the global graph draws by their date: those of the last month, of the last year, or
all. It opens on site configuration's, widened until it holds enough posts.
_Avoid_: date range, time filter

**Graph shell**:
The ring through the middle of the global graph that its pinned tags are held on, each with its
notes settled around it; what has no way along its edges to a pinned tag is kept inside it.
_Avoid_: orbit, circle, shell alone (that is the site shell)

**Pinned tag**:
A top-level tag that site configuration names to be held on the graph shell.
_Avoid_: anchor tag, root tag

**Node**:
One circle of a graph: a note, or a tag. A tag's node is its tag bubble, and so is a note's, of its
first tag; a note with no tags is a plain disc. A node's id is its page's address.
_Avoid_: vertex, point

**Edge**:
A line between two nodes, of one of three kinds, each with its own settings: a tag to a tag under
it, a note to a tag it carries, a note to a note it links to.
_Avoid_: link (in prose; a link is what a note writes)

**Text alternative**:
The list inside a graph's canvas of every node it draws, linking to its page, with the nodes it has
an edge to. Never shown; read by assistive technology in the drawing's place.
_Avoid_: fallback, hidden list

**Share card**:
The image a page's `og:image` names, drawn when the site builds.
_Avoid_: social card, OG image, thumbnail

**Alias redirect**:
A small page at one of a note's old names, which forwards the reader to the note.
_Avoid_: alias page

**Former address**:
The address the Quartz site served a page or an attachment at: a note's address in lower case, and
an MDX note's with `.mdx` after it; an alias's in lower case; an attachment's path with a space as
`-`, in lower case; `/tags/index` for the tags index. Where it is not the address of the page or the
attachment, it forwards the reader there, as an alias redirect does. A feed item's identifier is
its note's former address.
_Avoid_: old URL, legacy address, Quartz URL

**Link popover**:
The preview of a note shown while the pointer is over a link to it.
_Avoid_: tooltip, hover card

**Heading anchor**:
The link icon at the end of a heading in a note, to the heading's own place on the page, shown
while the pointer is on the heading.
_Avoid_: permalink, autolink

**External link**:
A link in a note to another site: a whole `http:` or `https:` address not on the site's own host.
It opens in a new tab.
_Avoid_: outbound link, absolute link (a link to the site may be written whole too)

**Search box**:
The button in the graph column's header, and the dialog it opens, that searches the site's full
text: the indexable pages', and no other's. Ctrl+K or ⌘K opens it.
_Avoid_: search bar, search modal

**Widget**:
A component an MDX note imports and renders in its body.
_Avoid_: shortcode, embed (that is Obsidian's `![[…]]`)

**Island**:
One use of a component that is hydrated in the reader's browser. Every widget is one.
_Avoid_: mount point

**Colour scheme**:
Light or dark: which of the site's two palettes a reader is seeing. The reader's choice, else
their system's. Anything that paints in script paints again when it changes.
_Avoid_: theme, mode, dark mode (for the scheme itself)

### Tests

**Seam**:
One of the three places the site is tested through: the library's public interface, the pure
modules under `src/lib`, and the built site in a browser.
_Avoid_: layer, level

**Fixture vault**:
The small vault under `test/fixtures/vault` that the unit tests read and the end-to-end suite
builds.
_Avoid_: test content, sample vault
