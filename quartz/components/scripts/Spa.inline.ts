import micromorph from "micromorph"
import { FullSlug, RelativeURL, getFullSlug, normalizeRelativeURLs } from "../../util/path"
import { fetchCanonical } from "./util"

// ============================================================================
// HELPER FUNCTIONS - URL & Navigation Utilities
// ============================================================================

const NODE_TYPE_ELEMENT = 1
const cleanupFns: Set<(...args: any[]) => void> = new Set()
let announcer = document.createElement("route-announcer")
let isNavigating = false
let p: DOMParser

/**
 * Check if a target is an Element node
 */
function _isElement(target: EventTarget | null): target is Element {
  return (target as Node)?.nodeType === NODE_TYPE_ELEMENT
}

/**
 * Check if a URL is on the same origin
 */
function _isLocalUrl(href: string): boolean {
  try {
    const url = new URL(href)
    if (window.location.origin === url.origin) {
      return true
    }
  } catch (e) {}
  return false
}

/**
 * Check if a URL is the same page (origin + pathname match)
 */
function _isSamePage(url: URL): boolean {
  const sameOrigin = url.origin === window.location.origin
  const samePath = url.pathname === window.location.pathname
  return sameOrigin && samePath
}

/**
 * Extract navigation options from click event
 */
function _getNavigationOpts(event: Event): { url: URL; scroll?: boolean } | undefined {
  if (!_isElement(event.target)) return
  if (event.target.attributes.getNamedItem("target")?.value === "_blank") return

  const a = event.target.closest("a")
  if (!a) return
  if ("routerIgnore" in a.dataset) return

  const { href } = a
  if (!_isLocalUrl(href)) return

  return { url: new URL(href), scroll: "routerNoscroll" in a.dataset ? false : undefined }
}

/**
 * Dispatch navigation event to notify listeners
 */
function _notifyNav(url: FullSlug): void {
  const event: CustomEventMap["nav"] = new CustomEvent("nav", { detail: { url } })
  document.dispatchEvent(event)
}

/**
 * Dispatch pre-navigation event
 */
function _notifyPreNav(): void {
  const event: CustomEventMap["prenav"] = new CustomEvent("prenav", { detail: {} })
  document.dispatchEvent(event)
}

/**
 * Clean up all registered cleanup functions
 */
function _runCleanup(): void {
  cleanupFns.forEach((fn) => fn())
  cleanupFns.clear()
}

/**
 * Execute scripts that should not be persisted across navigations.
 * Looks in both head and body since afterDOMReady scripts are placed at end of body.
 */
function _executeNewScripts(): void {
  // Find non-persisted scripts in both head and body
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[src][data-persist="false"]:not([data-loaded])',
  )
  scripts.forEach((oldScript) => {
    const newScript = document.createElement("script")
    newScript.src = oldScript.src
    newScript.type = oldScript.type || "module"
    
    // Copy all data attributes
    Array.from(oldScript.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-")) {
        newScript.setAttribute(attr.name, attr.value)
      }
    })
    
    // Mark as loaded to prevent re-execution
    newScript.dataset.loaded = "true"
    
    // Replace old script with new one to trigger execution
    oldScript.replaceWith(newScript)
  })
}

// ============================================================================
// HELPER FUNCTIONS - UI Updates
// ============================================================================

/**
 * Start loading bar animation
 */
function _startLoading(): void {
  const loadingBar = document.createElement("div")
  loadingBar.className = "navigation-progress"
  loadingBar.style.width = "0"
  if (!document.body.contains(loadingBar)) {
    document.body.appendChild(loadingBar)
  }

  setTimeout(() => {
    loadingBar.style.width = "80%"
  }, 100)
}

/**
 * Update document title from new page HTML
 */
function _updateTitle(html: Document, url: URL): string {
  let title = html.querySelector("title")?.textContent
  if (title) {
    document.title = title
  } else {
    const h1 = html.querySelector("h1")
    title = h1?.innerText ?? h1?.textContent ?? url.pathname
  }
  return title
}

/**
 * Update route announcer for screen readers
 */
function _updateAnnouncer(html: Document, title: string): void {
  if (announcer.textContent !== title) {
    announcer.textContent = title
  }
  announcer.dataset.persist = ""
  html.body.appendChild(announcer)
}

/**
 * Scroll to hash target or top of page
 */
function _scrollToTarget(url: URL): void {
  if (url.hash) {
    const el = document.getElementById(decodeURIComponent(url.hash.substring(1)))
    el?.scrollIntoView()
  } else {
    window.scrollTo({ top: 0 })
  }
}

/**
 * Update head elements by removing old non-persisted elements and adding all new elements
 * Returns a promise that resolves when all new scripts and stylesheets have loaded
 */
function _updateHead(html: Document): Promise<void> {
  const elementsToRemove = document.head.querySelectorAll(":not([data-persist])")
  elementsToRemove.forEach((el) => el.remove())

  const resourceLoadPromises: Promise<void>[] = []
  // Add ALL elements from new page (including persisted ones that might not be in current page)
  const elementsToAdd = html.head.querySelectorAll("title, link, meta, script, style")
  
  elementsToAdd.forEach((el) => {
    // For script elements, create a new script tag to ensure it executes
    if (el.tagName === "SCRIPT") {
      const script = document.createElement("script")
      Array.from(el.attributes).forEach((attr) => {
        script.setAttribute(attr.name, attr.value)
      })
      
      // Create a promise that resolves when the script loads
      if ((el as HTMLScriptElement).src) {
        const loadPromise = new Promise<void>((resolve, reject) => {
          script.onload = () => resolve()
          script.onerror = () => reject(new Error(`Failed to load script: ${(el as HTMLScriptElement).src}`))
        })
        resourceLoadPromises.push(loadPromise)
        script.src = (el as HTMLScriptElement).src
      } else {
        script.textContent = el.textContent
      }
      
      document.head.appendChild(script)
    } else if (el.tagName === "LINK" && (el as HTMLLinkElement).rel === "stylesheet") {
      // For stylesheet links, create a new link element to ensure it loads
      const link = document.createElement("link")
      Array.from(el.attributes).forEach((attr) => {
        link.setAttribute(attr.name, attr.value)
      })
      
      // Create a promise that resolves when the stylesheet loads
      const loadPromise = new Promise<void>((resolve, reject) => {
        link.onload = () => resolve()
        link.onerror = () => reject(new Error(`Failed to load stylesheet: ${(el as HTMLLinkElement).href}`))
      })
      resourceLoadPromises.push(loadPromise)
      
      document.head.appendChild(link)
    } else {
      document.head.appendChild(el)
    }
  })
  
  // Wait for all scripts and stylesheets to load
  return Promise.all(resourceLoadPromises).then(() => {})
}

// ============================================================================
// HELPER FUNCTIONS - Navigation Core
// ============================================================================

/**
 * Fetch and parse page content
 */
async function _fetchPage(url: URL): Promise<string | undefined> {
  const contents = await fetchCanonical(url)
    .then((res) => {
      const contentType = res.headers.get("content-type")
      if (contentType?.startsWith("text/html")) {
        return res.text()
      } else {
        window.location.assign(url)
      }
    })
    .catch(() => {
      window.location.assign(url)
    })

  return contents!
}

/**
 * Core navigation logic - update DOM with new page
 */
async function _performNavigation(url: URL, isBack: boolean): Promise<void> {
  _startLoading()
  p = p || new DOMParser()

  const contents = await _fetchPage(url)
  if (!contents) return

  _notifyPreNav()
  _runCleanup()

  const html = p.parseFromString(contents, "text/html")
  normalizeRelativeURLs(html, url)

  const title = _updateTitle(html, url)
  _updateAnnouncer(html, title)

  // Morph body with new content
  micromorph(document.body, html.body)

  // Execute non-persistent scripts that were added during morph
  _executeNewScripts()

  // Scroll and update history
  if (!isBack) {
    _scrollToTarget(url)
  }

  // Wait for all head scripts to load before dispatching nav event
  await _updateHead(html)

  // Update URL after everything is loaded
  if (!isBack) {
    history.pushState({}, "", url)
  }

  _notifyNav(getFullSlug(window))
  delete announcer.dataset.persist
}

// ============================================================================
// HELPER FUNCTIONS - Event Handlers
// ============================================================================

/**
 * Handle same-page hash navigation
 */
function _handleSamePageHash(url: URL): boolean {
  if (_isSamePage(url) && url.hash) {
    const el = document.getElementById(decodeURIComponent(url.hash.substring(1)))
    el?.scrollIntoView()
    history.pushState({}, "", url)
    return true
  }
  return false
}

/**
 * Determine navigation source from clicked element
 */
function _getNavigationSource(target: Element): string {
  const a = target.closest("a")
  if (!a) return "unknown"

  // Check for graph navigation (should be tracked separately in d3Behaviors)
  if (a.closest(".graph")) return "graph"

  // Check for tag explorer (left sidebar)
  if (a.closest(".tag-explorer")) return "tag-explorer"

  // Check for tag badges (TagList component)
  if (a.classList.contains("tag-link") || a.closest(".tags")) return "tag-badge"

  // Check for inline content links
  if (a.classList.contains("internal")) return "inline-link"

  return "other"
}

/**
 * Handle click events for SPA navigation
 */
async function _handleClick(event: MouseEvent): Promise<void> {
  const opts = _getNavigationOpts(event)
  if (!opts || event.ctrlKey || event.metaKey) return

  const { url } = opts
  event.preventDefault()

  if (_handleSamePageHash(url)) {
    return
  }

  // Track navigation in PostHog
  if (_isElement(event.target) && window.posthog) {
    const source = _getNavigationSource(event.target)
    window.posthog.capture("navigation", {
      source: source,
      from_page: window.location.pathname,
      to_page: url.pathname,
      url: url.toString(),
    })
  }

  navigate(url, false)
}

/**
 * Handle popstate events for browser back/forward
 */
function _handlePopstate(event: PopStateEvent): void {
  const opts = _getNavigationOpts(event)
  if (window.location.hash && window.location.pathname === opts?.url?.pathname) return

  navigate(new URL(window.location.toString()), true)
}

// ============================================================================
// MARK: MAIN
// ============================================================================

window.addCleanup = (fn) => cleanupFns.add(fn)

/**
 * Navigate to a new URL with SPA behavior
 * @param url - Target URL to navigate to
 * @param isBack - Whether this is a back navigation
 */
async function navigate(url: URL, isBack: boolean = false): Promise<void> {
  if (isNavigating) return
  isNavigating = true
  try {
    await _performNavigation(url, isBack)
  } catch (e) {
    console.error(e)
    window.location.assign(url)
  } finally {
    isNavigating = false
  }
}

window.spaNavigate = navigate

/**
 * Create and initialize the SPA router
 */
function createRouter() {
  if (typeof window !== "undefined") {
    window.addEventListener("click", _handleClick)
    window.addEventListener("popstate", _handlePopstate)
  }

  return new (class Router {
    go(pathname: RelativeURL) {
      const url = new URL(pathname, window.location.toString())
      return navigate(url, false)
    }

    back() {
      return window.history.back()
    }

    forward() {
      return window.history.forward()
    }
  })()
}

createRouter()
_notifyNav(getFullSlug(window))

/**
 * Define route announcer custom element for accessibility
 */
if (!customElements.get("route-announcer")) {
  const attrs = {
    "aria-live": "assertive",
    "aria-atomic": "true",
    style:
      "position: absolute; left: 0; top: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap; width: 1px; height: 1px",
  }

  customElements.define(
    "route-announcer",
    class RouteAnnouncer extends HTMLElement {
      constructor() {
        super()
      }
      connectedCallback() {
        for (const [key, value] of Object.entries(attrs)) {
          this.setAttribute(key, value)
        }
      }
    },
  )
}
