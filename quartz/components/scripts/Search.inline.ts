import type { DefaultDocumentSearchResults } from "flexsearch"
import { ContentDetails } from "../../plugins/emitters/contentIndex"
import { registerEscapeHandler, removeAllChildren } from "./util"
import { FullSlug, normalizeRelativeURLs, resolveAbsolute } from "../../util/path"

// ============================================================================
// HELPER TYPES & STATE
// ============================================================================

/** Search result item structure */
interface Item {
  id: number
  slug: FullSlug
  title: string
  content: string
  tags: string[]
  [key: string]: any
}

type SearchType = "basic" | "tags"
let searchType: SearchType = "basic"
let currentSearchTerm: string = ""

const p = new DOMParser()
const fetchContentCache: Map<FullSlug, Element[]> = new Map()
const contextWindowWords = 30
const numSearchResults = 8
const numTagResults = 5
let indexPopulated = false

// Lazy-loaded resources
let FlexSearch: typeof import("flexsearch").default | null = null
let contentIndexData: ContentIndex | null = null
let searchDataPromise: Promise<void> | null = null

// ============================================================================
// HELPER FUNCTIONS - Text Processing
// ============================================================================

/**
 * Custom encoder that handles CJK characters and whitespace tokenization
 */
const _encoder = (str: string): string[] => {
  const tokens: string[] = []
  let bufferStart = -1
  let bufferEnd = -1
  const lower = str.toLowerCase()

  let i = 0
  for (const char of lower) {
    const code = char.codePointAt(0)!

    const isCJK =
      (code >= 0x3040 && code <= 0x309f) ||
      (code >= 0x30a0 && code <= 0x30ff) ||
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0x20000 && code <= 0x2a6df)

    const isWhitespace = code === 32 || code === 9 || code === 10 || code === 13

    if (isCJK) {
      if (bufferStart !== -1) {
        tokens.push(lower.slice(bufferStart, bufferEnd))
        bufferStart = -1
      }
      tokens.push(char)
    } else if (isWhitespace) {
      if (bufferStart !== -1) {
        tokens.push(lower.slice(bufferStart, bufferEnd))
        bufferStart = -1
      }
    } else {
      if (bufferStart === -1) bufferStart = i
      bufferEnd = i + char.length
    }

    i += char.length
  }

  if (bufferStart !== -1) {
    tokens.push(lower.slice(bufferStart))
  }

  return tokens
}

// ============================================================================
// LAZY LOADING
// ============================================================================

/**
 * Lazy-load FlexSearch and content index data
 * Only loads once, subsequent calls return cached promise
 */
async function loadSearchResources(): Promise<void> {
  if (searchDataPromise) return searchDataPromise

  searchDataPromise = (async () => {
    // Load FlexSearch library
    if (!FlexSearch) {
      const module = await import("flexsearch")
      FlexSearch = module.default
    }

    // Load content index
    if (!contentIndexData) {
      const response = await fetch("/static/contentIndex.json")
      contentIndexData = await response.json()
    }
  })()

  return searchDataPromise
}

let index: InstanceType<typeof import("flexsearch").default.Document<Item>> | null = null

/**
 * Initialize FlexSearch index (called after resources are loaded)
 */
function initializeIndex() {
  if (!FlexSearch || index) return

  index = new FlexSearch.Document<Item>({
    encode: _encoder,
    document: {
      id: "id",
      tag: "tags",
      index: [
        {
          field: "title",
          tokenize: "forward",
        },
        {
          field: "content",
          tokenize: "forward",
        },
        {
          field: "tags",
          tokenize: "forward",
        },
      ],
    },
  })
}

/**
 * Tokenize a search term into individual tokens and n-grams
 */
function _tokenizeTerm(term: string): string[] {
  const tokens = term.split(/\s+/).filter((t) => t.trim() !== "")
  const tokenLen = tokens.length
  if (tokenLen > 1) {
    for (let i = 1; i < tokenLen; i++) {
      tokens.push(tokens.slice(0, i + 1).join(" "))
    }
  }

  return tokens.sort((a, b) => b.length - a.length) // always highlight longest terms first
}

/**
 * Find the best context window around search term matches
 */
function _findBestContextWindow(
  tokenizedText: string[],
  tokenizedTerms: string[],
): { startIndex: number; endIndex: number; trimmedText: string[] } {
  const includesCheck = (tok: string) =>
    tokenizedTerms.some((term) => tok.toLowerCase().startsWith(term.toLowerCase()))
  const occurrencesIndices = tokenizedText.map(includesCheck)

  let bestSum = 0
  let bestIndex = 0
  for (let i = 0; i < Math.max(tokenizedText.length - contextWindowWords, 0); i++) {
    const window = occurrencesIndices.slice(i, i + contextWindowWords)
    const windowSum = window.reduce((total, cur) => total + (cur ? 1 : 0), 0)
    if (windowSum >= bestSum) {
      bestSum = windowSum
      bestIndex = i
    }
  }

  const startIndex = Math.max(bestIndex - contextWindowWords, 0)
  const endIndex = Math.min(startIndex + 2 * contextWindowWords, tokenizedText.length - 1)
  const trimmedText = tokenizedText.slice(startIndex, endIndex)

  return { startIndex, endIndex, trimmedText }
}

/**
 * Highlight tokens in text by wrapping matches in span elements
 */
function _highlightTokens(tokenizedText: string[], tokenizedTerms: string[]): string {
  return tokenizedText
    .map((tok) => {
      for (const searchTok of tokenizedTerms) {
        if (tok.toLowerCase().includes(searchTok.toLowerCase())) {
          const regex = new RegExp(searchTok.toLowerCase(), "gi")
          return tok.replace(regex, `<span class="highlight">$&</span>`)
        }
      }
      return tok
    })
    .join(" ")
}

/**
 * Highlight search terms in text with optional context trimming
 */
function _highlight(searchTerm: string, text: string, trim?: boolean): string {
  const tokenizedTerms = _tokenizeTerm(searchTerm)
  let tokenizedText = text.split(/\s+/).filter((t) => t !== "")

  let startIndex = 0
  let endIndex = tokenizedText.length - 1

  if (trim) {
    const result = _findBestContextWindow(tokenizedText, tokenizedTerms)
    startIndex = result.startIndex
    endIndex = result.endIndex
    tokenizedText = result.trimmedText
  }

  const slice = _highlightTokens(tokenizedText, tokenizedTerms)
  return `${startIndex === 0 ? "" : "..."}${slice}${endIndex === tokenizedText.length - 1 ? "" : "..."}`
}

/**
 * Create a highlight span element
 */
function _createHighlightSpan(text: string): HTMLSpanElement {
  const span = document.createElement("span")
  span.className = "highlight"
  span.textContent = text
  return span
}

/**
 * Recursively highlight text nodes containing search terms
 */
function _highlightTextNode(node: Node, term: string): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const nodeText = node.nodeValue ?? ""
    const regex = new RegExp(term.toLowerCase(), "gi")
    const matches = nodeText.match(regex)
    if (!matches || matches.length === 0) return

    const spanContainer = document.createElement("span")
    let lastIndex = 0
    for (const match of matches) {
      const matchIndex = nodeText.indexOf(match, lastIndex)
      spanContainer.appendChild(document.createTextNode(nodeText.slice(lastIndex, matchIndex)))
      spanContainer.appendChild(_createHighlightSpan(match))
      lastIndex = matchIndex + match.length
    }
    spanContainer.appendChild(document.createTextNode(nodeText.slice(lastIndex)))
    node.parentNode?.replaceChild(spanContainer, node)
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if ((node as HTMLElement).classList.contains("highlight")) return
    Array.from(node.childNodes).forEach((child) => _highlightTextNode(child, term))
  }
}

/**
 * Highlight search terms in HTML element
 */
function _highlightHTML(searchTerm: string, el: HTMLElement): HTMLElement {
  const tokenizedTerms = _tokenizeTerm(searchTerm)
  const html = p.parseFromString(el.innerHTML, "text/html")

  for (const term of tokenizedTerms) {
    _highlightTextNode(html.body, term)
  }

  return html.body
}

// ============================================================================
// HELPER FUNCTIONS - Search Operations
// ============================================================================

/**
 * Perform a basic search across title and content
 */
async function _performBasicSearch(
  query: string,
): Promise<DefaultDocumentSearchResults<Item>> {
  if (!index) throw new Error("Search index not initialized")
  return await index.searchAsync({
    query,
    limit: numSearchResults,
    index: ["title", "content"],
  })
}

/**
 * Perform a tag-only search
 */
async function _performTagSearch(query: string): Promise<DefaultDocumentSearchResults<Item>> {
  if (!index) throw new Error("Search index not initialized")
  return await index.searchAsync({
    query,
    limit: numSearchResults,
    index: ["tags"],
  })
}

/**
 * Perform a combined tag filter + content search
 */
async function _performTagWithQuerySearch(
  tag: string,
  query: string,
): Promise<DefaultDocumentSearchResults<Item>> {
  if (!index) throw new Error("Search index not initialized")
  const searchResults = await index.searchAsync({
    query: query,
    limit: Math.max(numSearchResults, 10000),
    index: ["title", "content"],
    tag: { tags: tag },
  })

  // Trim results to limit
  for (let searchResult of searchResults) {
    searchResult.result = searchResult.result.slice(0, numSearchResults)
  }

  return searchResults
}

/**
 * Aggregate search results by field and return ordered IDs
 */
function _aggregateSearchResults(
  searchResults: DefaultDocumentSearchResults<Item>,
): number[] {
  const getByField = (field: string): number[] => {
    const results = searchResults.filter((x) => x.field === field)
    return results.length === 0 ? [] : ([...results[0].result] as number[])
  }

  const allIds: Set<number> = new Set([
    ...getByField("title"),
    ...getByField("content"),
    ...getByField("tags"),
  ])

  return [...allIds]
}

/**
 * Fill the FlexSearch index with content data
 */
async function _fillDocument(data: ContentIndex): Promise<void> {
  if (indexPopulated || !index) return

  let id = 0
  const promises: Array<Promise<unknown>> = []
  for (const [slug, fileData] of Object.entries<ContentDetails>(data)) {
    promises.push(
      index.addAsync(id++, {
        id,
        slug: slug as FullSlug,
        title: fileData.title,
        content: fileData.content,
        tags: fileData.tags,
      }),
    )
  }

  await Promise.all(promises)
  indexPopulated = true
}

// ============================================================================
// HELPER FUNCTIONS - UI State
// ============================================================================

/**
 * Hide the search interface and reset state
 */
function _createHideSearchHandler(
  container: HTMLElement,
  searchBar: HTMLInputElement,
  searchLayout: HTMLElement,
  searchButton: HTMLButtonElement,
  results: HTMLElement,
  preview: HTMLDivElement | undefined,
  sidebar: HTMLElement | null,
) {
  return function hideSearch() {
    container.classList.remove("active")
    searchBar.value = ""
    if (sidebar) sidebar.style.zIndex = ""
    removeAllChildren(results)
    if (preview) {
      removeAllChildren(preview)
    }
    searchLayout.classList.remove("display-results")
    searchType = "basic"
    searchButton.focus()
  }
}

/**
 * Show the search interface with specified search type
 */
function _createShowSearchHandler(
  container: HTMLElement,
  searchBar: HTMLInputElement,
  sidebar: HTMLElement | null,
) {
  return function showSearch(searchTypeNew: SearchType) {
    searchType = searchTypeNew
    if (sidebar) sidebar.style.zIndex = "1"
    
    // Close mobile sidebar when search opens (if it's open)
    const mobileSidebarContainer = document.getElementById("mobile-sidebar-container")
    const mobileSidebarBackdrop = document.getElementById("mobile-sidebar-backdrop")
    if (mobileSidebarContainer?.classList.contains("open")) {
      mobileSidebarContainer.classList.remove("open")
      mobileSidebarBackdrop?.classList.remove("visible")
      document.body.style.overflow = ""
    }
    
    container.classList.add("active")
    searchBar.focus()
  }
}

/**
 * Resolve a slug to a full URL using absolute path from site root
 */
function _createUrlResolver(currentSlug: FullSlug) {
  return function resolveUrl(slug: FullSlug): URL {
    return new URL(resolveAbsolute(slug), location.toString())
  }
}

// ============================================================================
// HELPER FUNCTIONS - Result Formatting
// ============================================================================

/**
 * Highlight matching tags in the tag list
 */
function _highlightTags(term: string, tags: string[]): string[] {
  if (!tags || searchType !== "tags") {
    return []
  }

  return tags
    .map((tag) => {
      if (tag.toLowerCase().includes(term.toLowerCase())) {
        return `<li><p class="match-tag">#${tag}</p></li>`
      } else {
        return `<li><p>#${tag}</p></li>`
      }
    })
    .slice(0, numTagResults)
}

/**
 * Format search result for display
 */
function _createFormatForDisplay(data: ContentIndex, idDataMap: FullSlug[]) {
  return function formatForDisplay(term: string, id: number): Item {
    const slug = idDataMap[id]
    return {
      id,
      slug,
      title: searchType === "tags" ? data[slug].title : _highlight(term, data[slug].title ?? ""),
      content: _highlight(term, data[slug].content ?? "", true),
      tags: _highlightTags(term.substring(1), data[slug].tags),
    }
  }
}

/**
 * Create a result card HTML element
 */
function _createResultCardGenerator(
  resolveUrl: (slug: FullSlug) => URL,
  hideSearch: () => void,
  displayPreview: (el: HTMLElement | null) => Promise<void>,
) {
  return function resultToHTML({ slug, title, content, tags }: Item): HTMLAnchorElement {
    const htmlTags = tags.length > 0 ? `<ul class="tags">${tags.join("")}</ul>` : ``
    const itemTile = document.createElement("a")
    itemTile.classList.add("search-result-card")
    itemTile.id = slug
    itemTile.href = resolveUrl(slug).toString()
    itemTile.innerHTML = `
      <h3 class="card-title">${title}</h3>
      ${htmlTags}
      <p class="card-description">${content}</p>
    `

    const handler = (event: MouseEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      hideSearch()
    }

    async function onMouseEnter(ev: MouseEvent) {
      if (!ev.target) return
      const target = ev.target as HTMLInputElement
      await displayPreview(target)
    }

    itemTile.addEventListener("mouseenter", onMouseEnter)
    window.addCleanup(() => itemTile.removeEventListener("mouseenter", onMouseEnter))
    itemTile.addEventListener("click", handler)
    window.addCleanup(() => itemTile.removeEventListener("click", handler))

    return itemTile
  }
}

// ============================================================================
// HELPER FUNCTIONS - Result Display
// ============================================================================

/**
 * Display "no results" message
 */
function _displayNoResults(results: HTMLElement, preview: HTMLDivElement | undefined) {
  results.innerHTML = `<a class="search-result-card no-match">
      <h3>No results.</h3>
      <p>Try another search term?</p>
  </a>`
  if (preview) {
    removeAllChildren(preview)
  }
}

/**
 * Focus and preview the first result
 */
async function _focusFirstResult(
  results: HTMLElement,
  displayPreview: (el: HTMLElement | null) => Promise<void>,
): Promise<HTMLInputElement> {
  const firstChild = results.firstElementChild as HTMLElement
  firstChild.classList.add("focus")
  await displayPreview(firstChild)
  return firstChild as HTMLInputElement
}

/**
 * Create a display results handler
 */
function _createDisplayResultsHandler(
  results: HTMLElement,
  preview: HTMLDivElement | undefined,
  resultToHTML: (item: Item) => HTMLAnchorElement,
  displayPreview: (el: HTMLElement | null) => Promise<void>,
) {
  return async function displayResults(finalResults: Item[], currentHoverRef: { value: HTMLInputElement | null }) {
    removeAllChildren(results)
    if (finalResults.length === 0) {
      _displayNoResults(results, preview)
      return
    }

    results.append(...finalResults.map(resultToHTML))
    currentHoverRef.value = await _focusFirstResult(results, displayPreview)
  }
}

/**
 * Fetch and cache page content for preview
 */
function _createFetchContentHandler(resolveUrl: (slug: FullSlug) => URL) {
  return async function fetchContent(slug: FullSlug): Promise<Element[]> {
    if (fetchContentCache.has(slug)) {
      return fetchContentCache.get(slug) as Element[]
    }

    const targetUrl = resolveUrl(slug).toString()
    const contents = await fetch(targetUrl)
      .then((res) => res.text())
      .then((contents) => {
        if (contents === undefined) {
          throw new Error(`Could not fetch ${targetUrl}`)
        }
        const html = p.parseFromString(contents ?? "", "text/html")
        normalizeRelativeURLs(html, targetUrl)
        return [...html.getElementsByClassName("popover-hint")]
      })

    fetchContentCache.set(slug, contents)
    return contents
  }
}

/**
 * Create a display preview handler
 */
function _createDisplayPreviewHandler(
  searchLayout: HTMLElement,
  enablePreview: boolean,
  preview: HTMLDivElement | undefined,
  fetchContent: (slug: FullSlug) => Promise<Element[]>,
) {
  return async function displayPreview(el: HTMLElement | null) {
    if (!searchLayout || !enablePreview || !el || !preview) return
    const slug = el.id as FullSlug
    const innerDiv = await fetchContent(slug).then((contents) =>
      contents.flatMap((el) => [..._highlightHTML(currentSearchTerm, el as HTMLElement).children]),
    )
    const previewInner = document.createElement("div")
    previewInner.classList.add("preview-inner")
    previewInner.append(...innerDiv)
    preview.replaceChildren(previewInner)

    // scroll to longest highlight
    const highlights = [...preview.getElementsByClassName("highlight")].sort(
      (a, b) => b.innerHTML.length - a.innerHTML.length,
    )
    highlights[0]?.scrollIntoView({ block: "start" })
  }
}

// ============================================================================
// HELPER FUNCTIONS - Keyboard Navigation
// ============================================================================

/**
 * Handle search toggle hotkey (Cmd/Ctrl+K)
 */
function _handleSearchToggle(
  e: KeyboardEvent,
  container: HTMLElement,
  hideSearch: () => void,
  showSearch: (type: SearchType) => Promise<void>,
  searchBar: HTMLInputElement,
): boolean {
  if (e.key === "k" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
    e.preventDefault()
    const searchBarOpen = container.classList.contains("active")
    if (searchBarOpen) {
      hideSearch()
    } else {
      showSearch("basic")
    }
    return true
  } else if (e.shiftKey && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault()
    const searchBarOpen = container.classList.contains("active")
    if (searchBarOpen) {
      hideSearch()
    } else {
      showSearch("tags")
      searchBar.value = "#"
    }
    return true
  }
  return false
}

/**
 * Handle Enter key navigation
 */
async function _handleEnterKey(
  results: HTMLElement,
  displayPreview: (el: HTMLElement | null) => Promise<void>,
): Promise<void> {
  if (results.contains(document.activeElement)) {
    const active = document.activeElement as HTMLInputElement
    if (active.classList.contains("no-match")) return
    await displayPreview(active)
    active.click()
  } else {
    const anchor = document.getElementsByClassName("search-result-card")[0] as HTMLInputElement | null
    if (!anchor || anchor.classList.contains("no-match")) return
    await displayPreview(anchor)
    anchor.click()
  }
}

/**
 * Handle Arrow Up / Shift+Tab navigation
 */
async function _handleArrowUp(
  results: HTMLElement,
  currentHoverRef: { value: HTMLInputElement | null },
  displayPreview: (el: HTMLElement | null) => Promise<void>,
): Promise<void> {
  if (results.contains(document.activeElement)) {
    const currentResult = currentHoverRef.value || (document.activeElement as HTMLInputElement | null)
    const prevResult = currentResult?.previousElementSibling as HTMLInputElement | null
    currentResult?.classList.remove("focus")
    prevResult?.focus()
    if (prevResult) currentHoverRef.value = prevResult
    await displayPreview(prevResult)
  }
}

/**
 * Handle Arrow Down / Tab navigation
 */
async function _handleArrowDown(
  results: HTMLElement,
  searchBar: HTMLInputElement,
  currentHoverRef: { value: HTMLInputElement | null },
  displayPreview: (el: HTMLElement | null) => Promise<void>,
): Promise<void> {
  if (document.activeElement === searchBar || currentHoverRef.value !== null) {
    const firstResult = currentHoverRef.value ||
      (document.getElementsByClassName("search-result-card")[0] as HTMLInputElement | null)
    const secondResult = firstResult?.nextElementSibling as HTMLInputElement | null
    firstResult?.classList.remove("focus")
    secondResult?.focus()
    if (secondResult) currentHoverRef.value = secondResult
    await displayPreview(secondResult)
  }
}

/**
 * Create keyboard shortcut handler
 */
function _createShortcutHandler(
  container: HTMLElement,
  results: HTMLElement,
  searchBar: HTMLInputElement,
  hideSearch: () => void,
  showSearch: (type: SearchType) => Promise<void>,
  displayPreview: (el: HTMLElement | null) => Promise<void>,
  currentHoverRef: { value: HTMLInputElement | null },
) {
  return async function shortcutHandler(e: HTMLElementEventMap["keydown"]) {
    // Handle search toggle hotkeys
    if (_handleSearchToggle(e, container, hideSearch, showSearch, searchBar)) {
      return
    }

    if (currentHoverRef.value) {
      currentHoverRef.value.classList.remove("focus")
    }

    if (!container.classList.contains("active")) return

    if (e.key === "Enter" && !e.isComposing) {
      await _handleEnterKey(results, displayPreview)
    } else if (e.key === "ArrowUp" || (e.shiftKey && e.key === "Tab")) {
      e.preventDefault()
      await _handleArrowUp(results, currentHoverRef, displayPreview)
    } else if (e.key === "ArrowDown" || e.key === "Tab") {
      e.preventDefault()
      await _handleArrowDown(results, searchBar, currentHoverRef, displayPreview)
    }
  }
}

/**
 * Create input handler for search bar
 */
function _createOnTypeHandler(
  searchLayout: HTMLElement,
  formatForDisplay: (term: string, id: number) => Item,
  displayResults: (finalResults: Item[], currentHoverRef: { value: HTMLInputElement | null }) => Promise<void>,
  currentHoverRef: { value: HTMLInputElement | null },
) {
  return async function onType(e: HTMLElementEventMap["input"]) {
    if (!searchLayout || !index) return
    currentSearchTerm = (e.target as HTMLInputElement).value
    searchLayout.classList.toggle("display-results", currentSearchTerm !== "")
    searchType = currentSearchTerm.startsWith("#") ? "tags" : "basic"

    let searchResults: DefaultDocumentSearchResults<Item>
    if (searchType === "tags") {
      currentSearchTerm = currentSearchTerm.substring(1).trim()
      const separatorIndex = currentSearchTerm.indexOf(" ")
      if (separatorIndex != -1) {
        const tag = currentSearchTerm.substring(0, separatorIndex)
        const query = currentSearchTerm.substring(separatorIndex + 1).trim()
        searchResults = await _performTagWithQuerySearch(tag, query)
        searchType = "basic"
        currentSearchTerm = query
      } else {
        searchResults = await _performTagSearch(currentSearchTerm)
      }
    } else {
      searchResults = await _performBasicSearch(currentSearchTerm)
    }

    const allIds = _aggregateSearchResults(searchResults)
    const finalResults = allIds.map((id) => formatForDisplay(currentSearchTerm, id))
    await displayResults(finalResults, currentHoverRef)
  }
}

// ============================================================================
// MARK: MAIN
// ============================================================================

/**
 * Set up search functionality for a search element
 * @param searchElement - The search DOM element
 * @param currentSlug - Current page slug
 */
async function setupSearch(searchElement: Element, currentSlug: FullSlug) {
  // Query and validate DOM elements
  const container = searchElement.querySelector(".search-container") as HTMLElement
  if (!container) return

  const sidebar = container.closest(".sidebar") as HTMLElement | null
  const searchButton = searchElement.querySelector(".search-button") as HTMLButtonElement
  if (!searchButton) return

  const searchBar = searchElement.querySelector(".search-bar") as HTMLInputElement
  if (!searchBar) return

  const searchLayout = searchElement.querySelector(".search-layout") as HTMLElement
  if (!searchLayout) return

  // Track if search is initialized
  let isInitialized = false

  /**
   * Initialize search on first activation
   */
  async function ensureSearchReady(): Promise<void> {
    if (isInitialized) return

    // Show loading state
    searchBar.placeholder = "Loading search..."
    searchBar.disabled = true

    try {
      // Lazy-load resources
      await loadSearchResources()
      
      // Initialize index
      initializeIndex()
      
      // Populate index with data
      if (contentIndexData) {
        await _fillDocument(contentIndexData)
      }

      isInitialized = true
      searchBar.placeholder = searchBar.getAttribute("aria-label") || "Search"
      searchBar.disabled = false
    } catch (error) {
      console.error("Failed to initialize search:", error)
      searchBar.placeholder = "Search unavailable"
      searchBar.disabled = false
    }
  }

  // Initialize UI containers (but don't load data yet)
  const data = contentIndexData || {} // Empty until loaded
  const idDataMap = Object.keys(data) as FullSlug[]
  const enablePreview = searchLayout.dataset.preview === "true"
  const results = document.createElement("div")
  results.className = "search-results-container"
  searchLayout.appendChild(results)

  let preview: HTMLDivElement | undefined = undefined
  if (enablePreview) {
    preview = document.createElement("div")
    preview.className = "search-preview-container"
    searchLayout.appendChild(preview)
  }

  // Create state and handler closures
  const currentHoverRef = { value: null as HTMLInputElement | null }
  const hideSearch = _createHideSearchHandler(container, searchBar, searchLayout, searchButton, results, preview, sidebar)
  
  // Wrap showSearch to ensure resources are loaded
  const originalShowSearch = _createShowSearchHandler(container, searchBar, sidebar)
  const showSearch = async (type: SearchType) => {
    await ensureSearchReady()
    originalShowSearch(type)
  }
  
  const resolveUrl = _createUrlResolver(currentSlug)
  const fetchContent = _createFetchContentHandler(resolveUrl)
  const displayPreview = _createDisplayPreviewHandler(searchLayout, enablePreview, preview, fetchContent)
  
  // These need to be recreated after data loads
  let formatForDisplay = _createFormatForDisplay(data, idDataMap)
  let resultToHTML = _createResultCardGenerator(resolveUrl, hideSearch, displayPreview)
  let displayResults = _createDisplayResultsHandler(results, preview, resultToHTML, displayPreview)
  let onType = _createOnTypeHandler(searchLayout, formatForDisplay, displayResults, currentHoverRef)
  
  // Update handlers after data loads
  const updateHandlers = () => {
    const newData = contentIndexData || {}
    const newIdDataMap = Object.keys(newData) as FullSlug[]
    formatForDisplay = _createFormatForDisplay(newData, newIdDataMap)
    resultToHTML = _createResultCardGenerator(resolveUrl, hideSearch, displayPreview)
    displayResults = _createDisplayResultsHandler(results, preview, resultToHTML, displayPreview)
    onType = _createOnTypeHandler(searchLayout, formatForDisplay, displayResults, currentHoverRef)
    
    // Re-attach input handler
    searchBar.removeEventListener("input", onType)
    searchBar.addEventListener("input", onType)
  }

  const shortcutHandler = _createShortcutHandler(container, results, searchBar, hideSearch, showSearch, displayPreview, currentHoverRef)

  // Attach event listeners
  document.addEventListener("keydown", shortcutHandler)
  window.addCleanup(() => document.removeEventListener("keydown", shortcutHandler))
  
  searchButton.addEventListener("click", async () => {
    await showSearch("basic")
  })
  window.addCleanup(() => searchButton.removeEventListener("click", () => showSearch("basic")))
  
  // Wrap input handler to ensure data is ready
  const wrappedOnType = async (e: Event) => {
    await ensureSearchReady()
    updateHandlers()
    onType(e)
  }
  searchBar.addEventListener("input", wrappedOnType)
  window.addCleanup(() => searchBar.removeEventListener("input", wrappedOnType))
  
  registerEscapeHandler(container, hideSearch)
}

/**
 * Initialize search on all search elements when navigating
 * @param e - Navigation event
 */
async function initializeSearch(e: CustomEventMap["nav"]) {
  const currentSlug = e.detail.url
  const searchElements = document.getElementsByClassName("search")
  for (const element of searchElements) {
    await setupSearch(element, currentSlug)
  }
}

document.addEventListener("nav", initializeSearch)
