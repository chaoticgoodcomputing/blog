/**
 * Client-side script for mobile sidebar menu functionality
 */

function setupMobileSidebar() {
  const toggle = document.getElementById("mobile-sidebar-toggle")
  const backdrop = document.getElementById("mobile-sidebar-backdrop")
  const container = document.getElementById("mobile-sidebar-container")

  if (!toggle || !backdrop || !container) return

  // Toggle menu open/closed
  function toggleMenu() {
    if (!container) return
    const isOpen = container.classList.contains("open")

    if (isOpen) {
      closeMenu()
    } else {
      openMenu()
    }
  }

  function openMenu() {
    if (!container || !backdrop || !toggle) return
    container.classList.add("open")
    backdrop.classList.add("visible")
    toggle.setAttribute("aria-expanded", "true")
    // Prevent body scroll when menu is open
    document.body.style.overflow = "hidden"
    
    // Move toggle button to follow sidebar
    updateTogglePosition(true)
  }

  function closeMenu() {
    if (!container || !backdrop || !toggle) return
    container.classList.remove("open")
    backdrop.classList.remove("visible")
    toggle.setAttribute("aria-expanded", "false")
    // Restore body scroll
    document.body.style.overflow = ""
    
    // Reset toggle button position
    updateTogglePosition(false)
  }

  function updateTogglePosition(isOpen: boolean) {
    if (!toggle || !container) return
    
    if (isOpen) {
      // When open, position at the right edge of the sidebar
      const sidebarWidth = container.offsetWidth
      toggle.style.left = `${sidebarWidth - 8}px`
    } else {
      // When closed, position at the left edge
      toggle.style.left = "0px"
    }
  }

  // Click handlers
  toggle.addEventListener("click", toggleMenu)
  backdrop.addEventListener("click", closeMenu)

  // Close menu when navigating to a new page
  window.addEventListener("beforeunload", closeMenu)

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && container.classList.contains("open")) {
      closeMenu()
    }
  })

  // Cleanup function for SPA navigation
  window.addCleanup(() => {
    toggle.removeEventListener("click", toggleMenu)
    backdrop.removeEventListener("click", closeMenu)
    closeMenu()
  })
}

// Initialize on page load
document.addEventListener("nav", () => {
  setupMobileSidebar()
  
  // Close menu on internal navigation
  const container = document.getElementById("mobile-sidebar-container")
  if (container && container.classList.contains("open")) {
    container.classList.remove("open")
    document.getElementById("mobile-sidebar-backdrop")?.classList.remove("visible")
    document.body.style.overflow = ""
  }
})
