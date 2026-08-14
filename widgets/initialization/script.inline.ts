/**
 * Client-side script for Initialization widget.
 * 
 * Updates status to confirm content widget system initialization.
 */

// === Widget Script Helper (inlined to avoid import issues) ===
interface WidgetScriptConfig {
  selector: string
  initialize: (element: HTMLElement) => (() => void) | void
}

function createWidgetScript(config: WidgetScriptConfig) {
  const cleanupHandlers = new WeakMap<HTMLElement, () => void>()
  
  function cleanupInstance(element: HTMLElement): void {
    const cleanup = cleanupHandlers.get(element)
    if (cleanup) {
      cleanup()
      cleanupHandlers.delete(element)
    }
  }
  
  function initializeAll(): void {
    const elements = document.querySelectorAll<HTMLElement>(config.selector)
    elements.forEach((element) => {
      cleanupInstance(element)
      const cleanup = config.initialize(element)
      if (cleanup) cleanupHandlers.set(element, cleanup)
    })
  }
  
  return {
    start() {
      document.addEventListener("nav", initializeAll)
      window.addEventListener("load", initializeAll)
      window.addCleanup(() => {
        document.removeEventListener("nav", initializeAll)
        window.removeEventListener("load", initializeAll)
      })
      initializeAll()
    }
  }
}
// === End Widget Script Helper ===

const contentInitWidget = createWidgetScript({
  selector: ".widget-content-initialization",
  initialize: (element) => {
    const statusItem = element.querySelector<HTMLElement>(".init-status-item")
    if (!statusItem) return
    
    const text = statusItem.querySelector(".init-text")
    if (!text) return
    
    text.textContent = "Vault widgets initialized"
    
    // Switch from loading to initialized state
    statusItem.classList.remove("loading")
    statusItem.classList.add("initialized")
  }
})

contentInitWidget.start()
