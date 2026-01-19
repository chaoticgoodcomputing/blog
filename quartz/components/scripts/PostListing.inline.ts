/**
 * PostListing inline script
 * 
 * Populates tag badges in post listings with:
 * - Colors from TagIndex metadata
 * - Icons from TagIndex metadata (rendered via IconService)
 * - Post counts (optional)
 * - Proper links to tag pages
 */

import type { TagIndex } from "../../util/tags"
import { IconService } from "../../util/iconService"

// Global variable injected by renderPage.tsx
declare const fetchTagData: Promise<any>

/**
 * Setup long-press expansion for tag links on mobile/tablet
 * On long-press/long-click, the tag expands to show name and count
 * @param tagList - The tag list container element
 */
function setupLongPressExpansion(tagList: HTMLElement) {
  const tagLinks = tagList.querySelectorAll("a.tag-link") as NodeListOf<HTMLAnchorElement>
  let longPressTimer: number | undefined
  let currentExpanded: HTMLAnchorElement | null = null
  const LONG_PRESS_DURATION = 500 // milliseconds

  // Check if we're on mobile/tablet (screen width < 1200px)
  const isMobileTablet = () => window.matchMedia("(max-width: 1200px)").matches

  const expand = (link: HTMLAnchorElement) => {
    if (!isMobileTablet()) return
    
    // Collapse any previously expanded tag
    if (currentExpanded && currentExpanded !== link) {
      currentExpanded.classList.remove("expanded")
    }
    
    link.classList.add("expanded")
    currentExpanded = link
  }

  const collapse = (link: HTMLAnchorElement) => {
    link.classList.remove("expanded")
    if (currentExpanded === link) {
      currentExpanded = null
    }
  }

  const startLongPress = (e: TouchEvent | MouseEvent, link: HTMLAnchorElement) => {
    if (!isMobileTablet()) return
    
    // Prevent default link behavior during long-press detection
    e.preventDefault()
    
    longPressTimer = window.setTimeout(() => {
      expand(link)
    }, LONG_PRESS_DURATION)
  }

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = undefined
    }
  }

  const handleEnd = (e: TouchEvent | MouseEvent, link: HTMLAnchorElement) => {
    cancelLongPress()
    
    // If tag is expanded, navigate on tap/click release
    if (link.classList.contains("expanded")) {
      // Allow the link to navigate naturally
      return
    }
    
    // If not expanded and was a quick tap/click, navigate immediately
    if (isMobileTablet()) {
      window.location.href = link.href
    }
  }

  for (const link of tagLinks) {
    // Touch events (mobile)
    link.addEventListener("touchstart", (e) => startLongPress(e, link), { passive: false })
    link.addEventListener("touchend", (e) => handleEnd(e, link))
    link.addEventListener("touchcancel", cancelLongPress)
    link.addEventListener("touchmove", cancelLongPress)

    // Mouse events (tablet/desktop with mouse)
    link.addEventListener("mousedown", (e) => {
      if (e.button === 0) { // Left click only
        startLongPress(e, link)
      }
    })
    link.addEventListener("mouseup", (e) => handleEnd(e, link))
    link.addEventListener("mouseleave", () => {
      cancelLongPress()
      // Collapse after a delay when mouse leaves
      if (currentExpanded === link) {
        setTimeout(() => collapse(link), 300)
      }
    })
  }

  // Click outside to collapse
  document.addEventListener("click", (e) => {
    if (currentExpanded && !currentExpanded.contains(e.target as Node)) {
      collapse(currentExpanded)
    }
  })
}

/**
 * Initialize all tag lists in post listings
 */
async function setupPostListingTags() {
  const allTagLists = document.querySelectorAll("ul.tags[data-component='post-listing']") as NodeListOf<
    HTMLUListElement
  >

  if (allTagLists.length === 0) return

  try {
    const tagIndex = (await fetchTagData) as TagIndex

    // Collect all unique icons to preload
    const iconsToLoad = new Set<string>()
    for (const tagList of allTagLists) {
      const tagItems = tagList.querySelectorAll("li.tag-item") as NodeListOf<HTMLLIElement>
      for (const tagItem of tagItems) {
        const tagName = tagItem.dataset.tag
        if (!tagName) continue
        const metadata = tagIndex.tags[tagName]
        if (metadata?.icon) {
          iconsToLoad.add(metadata.icon)
        }
      }
    }

    // Preload all icons
    if (iconsToLoad.size > 0) {
      await IconService.preloadIcons(Array.from(iconsToLoad))
    }

    for (const tagList of allTagLists) {
      const showCount = tagList.dataset.showcount === "true"

      const tagItems = tagList.querySelectorAll("li.tag-item") as NodeListOf<HTMLLIElement>

      for (const tagItem of tagItems) {
        const tagName = tagItem.dataset.tag
        if (!tagName) continue

        const metadata = tagIndex.tags[tagName]
        if (!metadata) continue

        const link = tagItem.querySelector("a.tag-link") as HTMLAnchorElement
        if (!link) continue

        // Set the link destination
        link.href = `/tags/${tagName}/`

        // Update icon badge
        const iconBadge = link.querySelector(".tag-icon-badge") as HTMLElement
        const color = metadata.color || "#888888"
        iconBadge.style.borderColor = color
        iconBadge.setAttribute("title", tagName)

        // Render icon if available
        if (metadata.icon) {
          const iconData = await IconService.getIcon(metadata.icon)
          if (iconData) {
            iconBadge.innerHTML = iconData.svgContent
            // Ensure the SVG has proper sizing and coloring
            const svg = iconBadge.querySelector("svg") as SVGElement
            if (svg) {
              svg.setAttribute("width", "18")
              svg.setAttribute("height", "18")
              // Set fill color to match border
              svg.style.fill = color
            }
          }
        }

        // Update tag name
        const nameSpan = link.querySelector(".tag-name") as HTMLElement
        const segment = tagName.split("/").pop() || tagName
        nameSpan.textContent = segment

        // Update count if enabled
        if (showCount) {
          const countSpan = link.querySelector(".tag-count") as HTMLElement
          countSpan.textContent = `(${metadata.totalPostCount})`
        } else {
          const countSpan = link.querySelector(".tag-count") as HTMLElement
          countSpan?.remove()
        }
      }
    }

    // Add long-press/long-click support for mobile/tablet (screen width < 1200px)
    for (const tagList of allTagLists) {
      setupLongPressExpansion(tagList)
    }
  } catch (err) {
    console.error("Error initializing PostListing tags:", err)
    if (err instanceof Error) {
      console.error("Error message:", err.message)
      console.error("Error stack:", err.stack)
    }
  }
}

// Initialize on page load and navigation
document.addEventListener("nav", setupPostListingTags)
