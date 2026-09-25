// cgc-tag-explorer's browser script: v4's TagExplorer script, less the tree, which the component now
// renders into the page, and with v4's MobileSidebarMenu's drawer, which is now the explorer's own.
//
// - A tag opens and closes from its fold button. As one opens, its pages are filled in from the
//   index the emitter wrote (docs/adr/0001), public first, each marked when it is the page being read.
// - Which tags are open is kept across navigations, and in localStorage under v4's key and in v4's
//   shape, so a reader's open tags carry over from v4. How far the tree is scrolled is kept for the
//   tab, in sessionStorage, as v4 kept it.
// - At or below the drawer breakpoint the explorer is a drawer: its toggle opens it, and its close
//   button, the backdrop or Escape close it. Following a link closes it too, because Quartz's router
//   swaps the page, the explorer's classes with it, for the new page's.
//
// Bundled by build.mjs into one function that runs once per document (core runs every component
// script so), so every listener sits on the document and reaches the explorer whatever page SPA
// navigation brings in.

interface PagesIndex {
  pages: { slug: string; title: string; private?: true }[]
  tags: Record<string, number[]>
}

const ROOT = "cgc-tag-explorer"
const DRAWER_OPEN = `${ROOT}--open`
// Set once a navigation's state is in place, so only a reader's own clicks animate.
const READY = `${ROOT}--ready`
const CHILDREN_OPEN = `${ROOT}__children--open`
const FOLD_OPEN = `${ROOT}__fold--open`
const LINK_ACTIVE = `${ROOT}__page-link--active`
const FILLED = "cgcFilled"

// v4's keys: `[{ path, collapsed }]` for the tags, and the tree's scroll offset.
const STATE_KEY = "tagTree"
const SCROLL_KEY = "tagExplorerScrollTop"

const child = <T extends Element>(parent: Element, selector: string) =>
  parent.querySelector<T>(`:scope > ${selector}`)
const roots = () => [...document.querySelectorAll<HTMLElement>(`.${ROOT}`)]

// Storage may be off, or full; the explorer works without it.
function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key)
  } catch {
    return null
  }
}
function write(storage: () => Storage, key: string, value: string) {
  try {
    storage().setItem(key, value)
  } catch {}
}

// Which tags the reader has opened (false) or closed (true), for this document's life, and, where
// the site keeps saved state, beyond it.
let collapsed: Map<string, boolean> | undefined
function stateOf(root: HTMLElement): Map<string, boolean> {
  if (!collapsed) {
    collapsed = new Map()
    if (root.dataset.savedState === "true") {
      try {
        const saved = JSON.parse(read(() => localStorage, STATE_KEY) ?? "[]") as {
          path: string
          collapsed: boolean
        }[]
        for (const { path, collapsed: closed } of saved) collapsed.set(path, closed)
      } catch {}
    }
  }
  return collapsed
}
function remember(root: HTMLElement, tag: string, isCollapsed: boolean) {
  const state = stateOf(root)
  state.set(tag, isCollapsed)
  if (root.dataset.savedState !== "true") return
  const entries = [...state].map(([path, closed]) => ({ path, collapsed: closed }))
  write(() => localStorage, STATE_KEY, JSON.stringify(entries))
}

// The index, fetched once per document. Its URL is relative to the page the explorer was rendered
// for, which is the page in the address bar by the time `nav` fires, or absolute on the 404 page.
const indexes = new Map<string, Promise<PagesIndex | null>>()
function indexOf(root: HTMLElement): Promise<PagesIndex | null> {
  const url = new URL(root.dataset.index ?? "", location.href).href
  let index = indexes.get(url)
  if (!index) {
    index = fetch(url)
      .then((response) => (response.ok ? (response.json() as Promise<PagesIndex>) : null))
      .catch(() => null)
      .then((loaded) => {
        if (!loaded) {
          indexes.delete(url)
          console.warn(`cgc-tag-explorer: couldn't load the pages under each tag from ${url}`)
        }
        return loaded
      })
    indexes.set(url, index)
  }
  return index
}

// A page's address from the page being read: `root` is the way back to the site's root (the site's
// base path on the 404 page), and a folder page, `…/index`, is its folder. Quartz's own
// `resolveRelative()`, which runs on the server only.
function hrefOf(root: string, slug: string) {
  const simple =
    slug === "index" ? "" : slug.endsWith("/index") ? slug.slice(0, -"index".length) : slug
  return `${root}/${simple}`
}

// Bumped by every navigation: a fill that finds it moved on while it waited belongs to a page that
// is gone, and the page that replaced it fills its own.
let generation = 0

async function fill(root: HTMLElement, item: HTMLElement) {
  const list = child<HTMLElement>(item, `.${ROOT}__children`)?.querySelector<HTMLElement>(
    `:scope > .${ROOT}__list`,
  )
  if (!list || FILLED in list.dataset) return
  list.dataset[FILLED] = ""
  const at = generation
  const index = await indexOf(root)
  if (at !== generation) return
  if (!index) {
    // Tried again the next time the tag opens, or the next page restores it open.
    delete list.dataset[FILLED]
    return
  }
  const templates = root.querySelector<HTMLTemplateElement>(`.${ROOT}__templates`)?.content
  const pageTemplate = templates?.querySelector(`.${ROOT}__page`)
  const lockTemplate = templates?.querySelector(`.${ROOT}__lock`)
  if (!pageTemplate) return
  const current = document.body.dataset.slug
  for (const i of index.tags[item.dataset.tag ?? ""] ?? []) {
    const page = index.pages[i]
    const li = pageTemplate.cloneNode(true) as HTMLElement
    const link = li.querySelector<HTMLAnchorElement>(`.${ROOT}__page-link`)!
    link.href = hrefOf(root.dataset.root ?? ".", page.slug)
    li.querySelector(`.${ROOT}__page-title`)!.textContent = page.title
    if (page.private && lockTemplate)
      li.querySelector(`.${ROOT}__bullet`)?.replaceWith(lockTemplate.cloneNode(true))
    if (page.slug === current) {
      link.classList.add(LINK_ACTIVE)
      link.setAttribute("aria-current", "page")
    }
    list.append(li)
  }
}

function setOpen(root: HTMLElement, item: HTMLElement, open: boolean) {
  const fold = item.querySelector<HTMLElement>(`:scope > .${ROOT}__row > .${ROOT}__fold`)
  child(item, `.${ROOT}__children`)?.classList.toggle(CHILDREN_OPEN, open)
  fold?.classList.toggle(FOLD_OPEN, open)
  fold?.setAttribute("aria-expanded", String(open))
  return open ? fill(root, item) : Promise.resolve()
}

const isOpen = (item: HTMLElement) =>
  child(item, `.${ROOT}__children`)?.classList.contains(CHILDREN_OPEN) ?? false

// A page's explorer as the reader left it: the tags they opened, filled in, and the tree scrolled
// where it was, or else to the page being read.
async function restore(root: HTMLElement) {
  const state = stateOf(root)
  const fills: Promise<void>[] = []
  for (const item of root.querySelectorAll<HTMLElement>(`.${ROOT}__tag`)) {
    const closed = state.get(item.dataset.tag ?? "")
    const open = closed === undefined ? isOpen(item) : !closed
    fills.push(setOpen(root, item, open))
  }
  // Transitions stay off until the restored state has been painted.
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add(READY)))
  const at = generation
  await Promise.all(fills)
  if (at !== generation) return
  const tree = root.querySelector<HTMLElement>(`.${ROOT}__tree`)
  if (!tree) return
  const scrolled = read(() => sessionStorage, SCROLL_KEY)
  if (scrolled !== null) tree.scrollTop = Number(scrolled)
  else
    tree.querySelector(`.${LINK_ACTIVE}`)?.scrollIntoView({ block: "nearest", inline: "nearest" })
}

function setDrawer(root: HTMLElement, open: boolean) {
  root.classList.toggle(DRAWER_OPEN, open)
  const toggle = root.querySelector<HTMLElement>(`.${ROOT}__toggle`)
  toggle?.setAttribute("aria-expanded", String(open))
  if (open) root.querySelector<HTMLElement>(`.${ROOT}__close`)?.focus({ preventScroll: true })
  else if (root.contains(document.activeElement)) toggle?.focus({ preventScroll: true })
}

document.addEventListener("nav", () => {
  generation++
  for (const root of roots()) void restore(root)
})

document.addEventListener("prenav", () => {
  const tree = document.querySelector<HTMLElement>(`.${ROOT}__tree`)
  if (tree) write(() => sessionStorage, SCROLL_KEY, String(tree.scrollTop))
})

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null
  const root = target?.closest<HTMLElement>(`.${ROOT}`)
  if (!target || !root) return
  const fold = target.closest(`.${ROOT}__fold`)
  if (fold) {
    const item = fold.closest<HTMLElement>(`.${ROOT}__tag`)
    if (!item) return
    const open = !isOpen(item)
    void setOpen(root, item, open)
    remember(root, item.dataset.tag ?? "", !open)
  } else if (target.closest(`.${ROOT}__toggle`)) {
    setDrawer(root, !root.classList.contains(DRAWER_OPEN))
  } else if (target.closest(`.${ROOT}__close, .${ROOT}__backdrop`)) {
    setDrawer(root, false)
  }
})

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return
  for (const root of roots()) if (root.classList.contains(DRAWER_OPEN)) setDrawer(root, false)
})

export {}
