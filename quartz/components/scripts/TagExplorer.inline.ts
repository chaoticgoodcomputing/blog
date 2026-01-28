import { FullSlug, resolveAbsolute } from "../../util/path"
import { ContentDetails } from "../../plugins/emitters/contentIndex"
import type { TagIndex } from "../../util/tags"
import { normalizeTag } from "../../util/tags"
import { IconService } from "../../util/iconService"

// Global variable injected by renderPage.tsx
declare const fetchTagData: Promise<any>

type MaybeHTMLElement = HTMLElement | undefined

/** Configuration options for tag explorer behavior and display */
interface ParsedOptions {
  folderClickBehavior: "collapse" | "link"
  folderDefaultState: "collapsed" | "open"
  useSavedState: boolean
  tagNodeSort: string
  fileNodeSort: string
  excludeTags: string[]
  showFileCount: boolean
}

/**
 * Represents the collapsed/expanded state of a tag in the explorer.
 */
type TagState = {
  path: string
  collapsed: boolean
}

/**
 * Represents the current state of the tag explorer.
 */
let currentTagExplorerState: Array<TagState>

/**
 * Load saved tag collapse state from localStorage
 */
function _loadTagState(opts: ParsedOptions): Map<string, boolean> {
  if (!opts.useSavedState) return new Map()
  const storageTree = localStorage.getItem("tagTree")
  if (!storageTree) return new Map()
  const parsed = JSON.parse(storageTree) as TagState[]
  return new Map(parsed.map((entry) => [entry.path, entry.collapsed]))
}

/**
 * Save current tag collapse state to localStorage
 */
function _saveTagState() {
  const stringified = JSON.stringify(currentTagExplorerState)
  localStorage.setItem("tagTree", stringified)
}

/**
 * Load saved scroll position from sessionStorage
 */
function _loadScrollPosition(): number | null {
  const scrollTop = sessionStorage.getItem("tagExplorerScrollTop")
  return scrollTop ? parseInt(scrollTop) : null
}

/**
 * Save scroll position to sessionStorage
 */
function _saveScrollPosition(ul: Element) {
  sessionStorage.setItem("tagExplorerScrollTop", ul.scrollTop.toString())
}

/**
 * Update the collapsed state of a tag in the current state array
 */
function _updateTagState(tagPath: string, isCollapsed: boolean) {
  const existingState = currentTagExplorerState.find((item) => item.path === tagPath)
  if (existingState) {
    existingState.collapsed = isCollapsed
  } else {
    currentTagExplorerState.push({ path: tagPath, collapsed: isCollapsed })
  }
}

/**
 * Check if a tag should be filtered out
 */
function _isTagFiltered(tag: string, excludeTags: string[]): boolean {
  const normalized = normalizeTag(tag)
  return excludeTags.some((excluded) => normalizeTag(excluded) === normalized)
}

/**
 * Determine if a tag should be expanded based on saved state
 */
function _shouldExpandTag(
  tagName: string,
  opts: ParsedOptions,
): boolean {
  const savedState = currentTagExplorerState.find((item) => item.path === tagName)
  const isCollapsed = savedState?.collapsed ?? opts.folderDefaultState === "collapsed"
  return !isCollapsed
}

/**
 * Create comparator for sorting tags by metadata
 */
function _createTagNodeSortFn(strategy: string, tagIndex: TagIndex) {
  return (a: string, b: string) => {
    const metaA = tagIndex.tags[a]
    const metaB = tagIndex.tags[b]
    const countA = metaA?.totalPostCount ?? 0
    const countB = metaB?.totalPostCount ?? 0
    const segmentA = a.split("/").pop() ?? ""
    const segmentB = b.split("/").pop() ?? ""

    switch (strategy) {
      case "count-desc":
        return countB - countA
      case "count-asc":
        return countA - countB
      case "alphabetical":
        return segmentA.localeCompare(segmentB, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      case "alphabetical-reverse":
        return segmentB.localeCompare(segmentA, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      default:
        return 0
    }
  }
}

/**
 * Get immediate children of a tag (non-recursive)
 */
function _getChildTags(tag: string, tagIndex: TagIndex): string[] {
  const metadata = tagIndex.tags[tag]
  return metadata?.children ?? []
}

/**
 * Create comparator function for sorting file nodes
 */
function _createFileNodeSortFn(strategy: string) {
  return (a: ContentDetails, b: ContentDetails) => {
    switch (strategy) {
      case "date-desc":
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      case "date-asc":
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      case "alphabetical":
        return a.title.localeCompare(b.title, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      case "alphabetical-reverse":
        return b.title.localeCompare(a.title, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      default:
        return 0
    }
  }
}

// ===== Old trie-based functions removed - using TagIndex instead =====

/**
 * Create a file node list item from a ContentDetails object
 */
async function _createFileNode(currentSlug: FullSlug, fileSlug: FullSlug, details: ContentDetails): Promise<HTMLLIElement> {
  const template = document.getElementById("template-file-node") as HTMLTemplateTemplate
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const a = li.querySelector("a") as HTMLAnchorElement
  const iconSpan = li.querySelector(".file-icon") as HTMLElement
  const titleSpan = li.querySelector(".file-title") as HTMLElement

  a.href = resolveAbsolute(details.slug)
  a.dataset.for = details.slug
  titleSpan.textContent = details.title

  if (currentSlug === details.slug) a.classList.add("active")

  // Add lock icon if post has #private tag
  if (details.tags.includes("private")) {
    const iconData = await IconService.getIcon("mdi:lock")
    if (iconData) {
      iconSpan.innerHTML = iconData.svgContent
      const svg = iconSpan.querySelector("svg") as SVGElement
      if (svg) {
        svg.setAttribute("width", "12")
        svg.setAttribute("height", "12")
        svg.style.marginRight = "4px"
      }
    }
  }

  return li
}

/**
 * Build tag title as a clickable link
 */
function _buildTagAsLink(
  container: HTMLElement,
  currentSlug: FullSlug,
  tagName: string,
  tagIndex: TagIndex,
  opts: ParsedOptions,
) {
  const button = container.querySelector(".tag-button") as HTMLElement
  const a = document.createElement("a")

  a.href = resolveAbsolute(`tags/${tagName}` as FullSlug)
  a.dataset.for = tagName
  a.className = "tag-link"

  // Apply tag color from TagIndex metadata
  const metadata = tagIndex.tags[tagName]
  if (metadata?.color) {
    a.style.setProperty("--tag-color", metadata.color)
  }

  const titleSpan = document.createElement("span")
  titleSpan.className = "tag-title"
  const segment = tagName.split("/").pop() ?? tagName
  titleSpan.textContent = `#${segment}`
  a.appendChild(titleSpan)

  if (opts.showFileCount) {
    const countSpan = document.createElement("span")
    countSpan.className = "tag-count"
    countSpan.textContent = ` (${metadata?.totalPostCount ?? 0})`
    a.appendChild(countSpan)
  }

  button.replaceWith(a)
}

/**
 * Build tag title as a collapsible button
 */
function _buildTagAsButton(
  container: HTMLElement,
  tagName: string,
  tagIndex: TagIndex,
  opts: ParsedOptions,
) {
  const titleSpan = container.querySelector(".tag-title") as HTMLElement
  const segment = tagName.split("/").pop() ?? tagName
  titleSpan.textContent = `#${segment}`

  // Apply tag color from TagIndex metadata
  const metadata = tagIndex.tags[tagName]
  if (metadata?.color) {
    container.style.setProperty("--tag-color", metadata.color)
  }

  if (opts.showFileCount) {
    const countSpan = container.querySelector(".tag-count") as HTMLElement
    countSpan.textContent = ` (${metadata?.totalPostCount ?? 0})`
  } else {
    const countSpan = container.querySelector(".tag-count") as HTMLElement
    countSpan?.remove()
  }
}

/**
 * Append child tag nodes and file nodes to a parent list
 */
async function _appendChildNodes(
  ul: HTMLUListElement,
  currentSlug: FullSlug,
  tagName: string,
  tagIndex: TagIndex,
  contentIndex: Map<FullSlug, ContentDetails>,
  opts: ParsedOptions,
) {
  const children = _getChildTags(tagName, tagIndex)

  // Sort children
  const sortFn = _createTagNodeSortFn(opts.tagNodeSort, tagIndex)
  children.sort(sortFn)

  for (const childTag of children) {
    if (_isTagFiltered(childTag, opts.excludeTags)) continue
    const childNode = await _createTagNode(currentSlug, childTag, tagIndex, contentIndex, opts)
    ul.appendChild(childNode)
  }

  // Collect files with this tag
  const filesWithTag: Array<[FullSlug, ContentDetails]> = []
  for (const [fileSlug, details] of contentIndex) {
    if (details.tags.includes(tagName)) {
      filesWithTag.push([fileSlug, details])
    }
  }

  // Sort files: public first, then private; within each group, sort by date descending
  filesWithTag.sort(([, a], [, b]) => {
    const aIsPrivate = a.tags.includes("private")
    const bIsPrivate = b.tags.includes("private")

    // Public posts come before private posts
    if (aIsPrivate !== bIsPrivate) {
      return aIsPrivate ? 1 : -1
    }

    // Within same privacy level, sort by date descending
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  // Add sorted file nodes
  for (const [fileSlug, details] of filesWithTag) {
    const fileNode = await _createFileNode(currentSlug, fileSlug, details)
    ul.appendChild(fileNode)
  }
}

/**
 * Create a tag node list item using TagIndex metadata
 */
async function _createTagNode(
  currentSlug: FullSlug,
  tagName: string,
  tagIndex: TagIndex,
  contentIndex: Map<FullSlug, ContentDetails>,
  opts: ParsedOptions,
): Promise<HTMLLIElement> {
  console.log("_createTagNode:", tagName)
  const template = document.getElementById("template-tag-node") as HTMLTemplateElement
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const tagContainer = li.querySelector(".tag-container") as HTMLElement
  const titleContainer = tagContainer.querySelector("div") as HTMLElement
  const tagOuter = li.querySelector(".tag-outer") as HTMLElement
  const ul = tagOuter.querySelector("ul") as HTMLUListElement

  tagContainer.dataset.tagpath = tagName

  console.log("_createTagNode: folderClickBehavior =", opts.folderClickBehavior)
  if (opts.folderClickBehavior === "link") {
    _buildTagAsLink(titleContainer, currentSlug, tagName, tagIndex, opts)
  } else {
    _buildTagAsButton(titleContainer, tagName, tagIndex, opts)
  }

  console.log("_createTagNode: checking if should expand")
  if (_shouldExpandTag(tagName, opts)) {
    tagOuter.classList.add("open")
  }

  console.log("_createTagNode: appending child nodes")
  await _appendChildNodes(ul, currentSlug, tagName, tagIndex, contentIndex, opts)

  return li
}

/**
 * Restore scroll position, falling back to scrolling to active element
 */
function _restoreScrollPosition(ul: Element) {
  const scrollTop = _loadScrollPosition()
  if (scrollTop !== null) {
    ul.scrollTop = scrollTop
  } else {
    const activeElement = ul.querySelector(".active")
    activeElement?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
  }
}

/**
 * Find the tag container element from a click target
 */
function _findTagContainer(target: HTMLElement): MaybeHTMLElement {
  const isSvg = target.nodeName === "svg"
  return (isSvg ? target.parentElement : target.parentElement?.parentElement) as MaybeHTMLElement
}

/**
 * Toggle the explorer panel open/closed
 */
function _toggleExplorer(this: HTMLElement) {
  const explorer = this.closest(".tag-explorer") as HTMLElement
  if (!explorer) return

  const collapsed = explorer.classList.toggle("collapsed")
  explorer.setAttribute("aria-expanded", collapsed ? "false" : "true")

  if (collapsed) {
    document.documentElement.classList.remove("mobile-no-scroll")
  } else {
    document.documentElement.classList.add("mobile-no-scroll")
  }
}

/**
 * Toggle a tag folder open/closed
 */
function _toggleTag(evt: MouseEvent) {
  evt.stopPropagation()
  const target = evt.target as MaybeHTMLElement
  if (!target) return

  const tagContainer = _findTagContainer(target)
  if (!tagContainer) return

  const childTagContainer = tagContainer.nextElementSibling as MaybeHTMLElement
  if (!childTagContainer) return

  const isOpen = childTagContainer.classList.toggle("open")
  const tagPath = tagContainer.dataset.tagpath as string

  _updateTagState(tagPath, !isOpen)
  _saveTagState()
}

/**
 * Attach all event listeners to an explorer element
 */
function _attachEventListeners(explorer: HTMLElement, opts: ParsedOptions) {
  const toggleButtons = explorer.getElementsByClassName(
    "tag-explorer-toggle",
  ) as HTMLCollectionOf<HTMLElement>
  for (const button of toggleButtons) {
    button.addEventListener("click", _toggleExplorer)
    window.addCleanup(() => button.removeEventListener("click", _toggleExplorer))
  }

  if (opts.folderClickBehavior === "collapse") {
    const tagButtons = explorer.getElementsByClassName("tag-button") as HTMLCollectionOf<
      HTMLElement
    >
    for (const button of tagButtons) {
      button.addEventListener("click", _toggleTag)
      window.addCleanup(() => button.removeEventListener("click", _toggleTag))
    }
  }

  const foldIcons = explorer.getElementsByClassName("tag-fold-icon") as HTMLCollectionOf<
    HTMLElement
  >
  for (const icon of foldIcons) {
    icon.addEventListener("click", _toggleTag)
    window.addCleanup(() => icon.removeEventListener("click", _toggleTag))
  }
}

/**
 * Parse configuration options from explorer dataset attributes
 */
function _parseExplorerOptions(explorer: HTMLElement): ParsedOptions {
  return {
    ...JSON.parse(explorer.dataset.opts || "{}"),
    folderClickBehavior: (explorer.dataset.behavior || "collapse") as "collapse" | "link",
    folderDefaultState: (explorer.dataset.collapsed || "collapsed") as "collapsed" | "open",
    useSavedState: explorer.dataset.savestate === "true",
  }
}



/**
 * Initialize the tag state array from saved state and available tags
 */
function _initializeTagState(tagIndex: TagIndex, opts: ParsedOptions) {
  const oldState = _loadTagState(opts)

  currentTagExplorerState = tagIndex.allTags.map((tag) => ({
    path: tag,
    collapsed: oldState.get(tag) ?? opts.folderDefaultState === "collapsed",
  }))
}

/**
 * Render the tag tree into the explorer list using TagIndex
 */
async function _renderTagTree(
  ul: Element,
  currentSlug: FullSlug,
  tagIndex: TagIndex,
  contentIndex: Map<FullSlug, ContentDetails>,
  opts: ParsedOptions,
) {
  const fragment = document.createDocumentFragment()

  // Get top-level tags and sort them
  console.log("_renderTagTree: topLevelTags =", tagIndex.topLevelTags)
  const topLevelTags = tagIndex.topLevelTags.filter((tag) => !_isTagFiltered(tag, opts.excludeTags))
  console.log("_renderTagTree: filtered topLevelTags =", topLevelTags)
  
  const sortFn = _createTagNodeSortFn(opts.tagNodeSort, tagIndex)
  console.log("_renderTagTree: sortFn =", sortFn)
  
  topLevelTags.sort(sortFn)
  console.log("_renderTagTree: sorted topLevelTags =", topLevelTags)

  for (const tag of topLevelTags) {
    console.log("_renderTagTree: Creating node for tag =", tag)
    const node = await _createTagNode(currentSlug, tag, tagIndex, contentIndex, opts)
    fragment.appendChild(node)
  }

  ul.insertBefore(fragment, ul.firstChild)
}

/**
 * Collapse mobile explorer panel if visible
 */
function _collapseMobileExplorer() {
  for (const explorer of document.getElementsByClassName("tag-explorer")) {
    const mobileExplorer = explorer.querySelector(".mobile-tag-explorer")
    if (!mobileExplorer?.checkVisibility()) continue

    explorer.classList.add("collapsed")
    explorer.setAttribute("aria-expanded", "false")
    document.documentElement.classList.remove("mobile-no-scroll")
    mobileExplorer.classList.remove("hide-until-loaded")
  }
}

/**
 * Handle edge case where desktop explorer stays open on resize to mobile
 */
function _handleDesktopToMobileResize() {
  const explorer = document.querySelector(".tag-explorer")
  if (explorer && !explorer.classList.contains("collapsed")) {
    document.documentElement.classList.add("mobile-no-scroll")
  }
}

// =============
// MARK: MAIN
// =============

/**
 * Initialize all tag explorer instances on the page
 * @param currentSlug - The slug of the currently displayed page
 */
async function setupTagExplorer(currentSlug: FullSlug) {
  const allExplorers = document.querySelectorAll("div.tag-explorer") as NodeListOf<HTMLElement>

  try {
    // Preload lock icon for private posts
    await IconService.preloadIcons(["mdi:lock"])
    
    // Fetch TagIndex and content data once
    console.log("TagExplorer: Fetching TagIndex...")
    const tagIndex = (await fetchTagData) as TagIndex
    console.log("TagExplorer: TagIndex loaded", tagIndex)
    
    console.log("TagExplorer: Fetching content index...")
    const contentDataResponse = await fetch("/static/contentIndex.json")
    console.log("TagExplorer: Content index response status:", contentDataResponse.status)
    const contentData = (await contentDataResponse.json()) as Record<FullSlug, ContentDetails>
    console.log("TagExplorer: Content data loaded, entries:", Object.keys(contentData).length)
    
    const contentIndex = new Map(Object.entries(contentData) as [FullSlug, ContentDetails][])
    console.log("TagExplorer: Content index map created")

    for (const explorer of allExplorers) {
      const opts = _parseExplorerOptions(explorer)

      _initializeTagState(tagIndex, opts)

      const explorerUl = explorer.querySelector(".tag-explorer-ul")
      if (!explorerUl) continue

      await _renderTagTree(explorerUl, currentSlug, tagIndex, contentIndex, opts)
      _restoreScrollPosition(explorerUl)
      _attachEventListeners(explorer, opts)
    }
    console.log("TagExplorer: Initialization complete")
  } catch (err) {
    console.error("Error initializing TagExplorer:", err)
    if (err instanceof Error) {
      console.error("Error message:", err.message)
      console.error("Error stack:", err.stack)
    }
  }
}

document.addEventListener("prenav", async () => {
  const explorer = document.querySelector(".tag-explorer-ul")
  if (explorer) _saveScrollPosition(explorer)
})

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  await setupTagExplorer(e.detail.url)
  _collapseMobileExplorer()
})

window.addEventListener("resize", _handleDesktopToMobileResize)
