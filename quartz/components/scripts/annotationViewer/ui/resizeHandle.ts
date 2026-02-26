/**
 * Implements draggable resize handle between PDF viewer and annotations sidebar
 */

/**
 * Initialize the resize handle for dragging between PDF and sidebar
 */
export function initResizeHandle(): void {
  const viewer = document.querySelector(".annotation-viewer") as HTMLElement
  const handle = document.querySelector(".annotation-resize-handle") as HTMLElement
  const splitView = document.querySelector(".annotation-split-view") as HTMLElement
  
  if (!viewer || !handle || !splitView) {
    console.warn("[ResizeHandle] Required elements not found")
    return
  }

  let isDragging = false
  let startX = 0

  const onMouseDown = (e: MouseEvent) => {
    isDragging = true
    startX = e.clientX
    
    // Prevent text selection during drag
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"
    handle.classList.add("dragging")
    
    e.preventDefault()
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const splitViewRect = splitView.getBoundingClientRect()
    const totalWidth = splitViewRect.width
    
    // Calculate new position relative to split view
    const mouseX = e.clientX - splitViewRect.left
    
    // Calculate new width percentages
    // The handle is 6px wide, account for it in calculations
    const handleWidth = 6
    const effectiveWidth = totalWidth - handleWidth
    const pdfWidthPercent = Math.round((mouseX / effectiveWidth) * 100)
    
    // Clamp between 30% and 70% to ensure both sections remain usable
    const clampedPdfPercent = Math.max(30, Math.min(70, pdfWidthPercent))
    const sidebarPercent = 100 - clampedPdfPercent

    // Update CSS custom properties
    viewer.style.setProperty("--pdf-flex", clampedPdfPercent.toString())
    viewer.style.setProperty("--sidebar-flex", sidebarPercent.toString())

    e.preventDefault()
  }

  const onMouseUp = () => {
    if (!isDragging) return
    
    isDragging = false
    document.body.style.userSelect = ""
    document.body.style.cursor = ""
    handle.classList.remove("dragging")

    // Trigger PDF re-render after resize completes
    // Use a small delay to allow layout to settle
    setTimeout(() => {
      const pdfRerenderEvent = new CustomEvent("pdf-resize", { bubbles: true })
      viewer.dispatchEvent(pdfRerenderEvent)
    }, 100)
  }

  // Attach event listeners
  handle.addEventListener("mousedown", onMouseDown)
  document.addEventListener("mousemove", onMouseMove)
  document.addEventListener("mouseup", onMouseUp)

  // Clean up on navigation
  if (window.addCleanup) {
    window.addCleanup(() => {
      handle.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    })
  }

  console.log("[ResizeHandle] Initialized")
}
