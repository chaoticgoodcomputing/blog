/**
 * TagList inline script
 * 
 * Populates tag badges with:
 * - Colors from TagIndex metadata
 * - Icons from TagIndex metadata (rendered via IconService)
 * - Post counts (if enabled)
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

  // Check if we're on mobile only (screen width <= 800px)
  const isMobile = () => window.matchMedia("(max-width: 800px)").matches

  const expand = (link: HTMLAnchorElement) => {
    if (!isMobile()) return
    
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
    if (!isMobile()) return
    
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
    if (isMobile()) {
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
 * Initialize all tag lists on the page or within a container
 * @param container - Optional container element to search within (defaults to document)
 */
async function setupTagList(container?: HTMLElement | Document) {
  const root = container || document
  const allTagLists = root.querySelectorAll("ul.tags[data-showtags='true']") as NodeListOf<
    HTMLUListElement
  >

  if (allTagLists.length === 0) return

  try {
    console.log("TagList: Fetching TagIndex...")
    const tagIndex = (await fetchTagData) as TagIndex
    console.log("TagList: TagIndex loaded")

    for (const tagList of allTagLists) {
      const showCount = tagList.dataset.showcount === "true"
      const showSubtags = tagList.dataset.showsubtags === "true"
      const currentSlug = tagList.dataset.currentslug || ""

      // Determine which tags to render for this list
      let tagsForList: string[] = []

      if (showSubtags && currentSlug) {
        const tagName = currentSlug.replace(/^tags\//, "").replace(/\/index$/, "").replace(/\/+$/, "")
        const meta = tagIndex.tags[tagName]
        if (meta) {
          tagsForList = meta.children
        }
      } else {
        const existingItems = tagList.querySelectorAll("li.tag-item") as NodeListOf<HTMLLIElement>
        tagsForList = Array.from(existingItems)
          .map((el) => el.dataset.tag)
          .filter((t): t is string => !!t)
      }

      // If showing subtags, rebuild the list with child tags
      if (showSubtags) {
        tagList.innerHTML = ""
        for (const tag of tagsForList) {
          const li = document.createElement("li")
          li.className = "tag-item"
          li.dataset.tag = tag

          const a = document.createElement("a")
          a.className = "internal tag-link"
          a.href = "#"

          const iconSpan = document.createElement("span")
          iconSpan.className = "tag-icon-badge"

          const nameSpan = document.createElement("span")
          nameSpan.className = "tag-name"

          const countSpan = document.createElement("span")
          countSpan.className = "tag-count"

          a.append(iconSpan, nameSpan, countSpan)
          li.appendChild(a)
          tagList.appendChild(li)
        }
      }

      // Collect icons to preload for this list
      const iconsToLoad = new Set<string>()
      const tagItems = tagList.querySelectorAll("li.tag-item") as NodeListOf<HTMLLIElement>
      for (const tagItem of tagItems) {
        const tagName = tagItem.dataset.tag
        if (!tagName) continue
        const metadata = tagIndex.tags[tagName]
        if (metadata?.icon) {
          iconsToLoad.add(metadata.icon)
        }
      }

      if (iconsToLoad.size > 0) {
        await IconService.preloadIcons(Array.from(iconsToLoad))
      }

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
    setupLongPressExpansion(tagList)

    console.log("TagList: Setup complete")
  } catch (err) {
    console.error("Error initializing TagList:", err)
    if (err instanceof Error) {
      console.error("Error message:", err.message)
      console.error("Error stack:", err.stack)
    }
  }
}

// Expose setup function for popover re-use
;(window as any).setupTagList = setupTagList

// Set up on initial page load
document.addEventListener("nav", async (_e: CustomEventMap["nav"]) => {
  await setupTagList()
})

// Also run immediately in case nav event already fired
setupTagList()
