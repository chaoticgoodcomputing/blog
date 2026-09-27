// cgc-graph's browser script (v4 main.inline.ts, adapters/lifecycle.ts). It runs once per page load,
// before Quartz's router dispatches the first `nav`, and draws on every `nav` after:
//
// - each local graph, around the page navigated to;
// - the global graph, in its dialog, when the reader opens it with the button or Ctrl/⌘+G.
//
// A navigation stops and removes whatever it drew, before the page changes under it (`prenav`). A
// scheme switch repaints whatever is drawn, with no new layout (`themechange`). The listeners sit on
// the document, once, so they reach every page SPA navigation brings in.
import { addVisited, loadSources, nodeIdOf } from "./pages"
import { renderGraph, type DrawnGraph } from "./render-graph"

let locals: DrawnGraph[] = []
let global: DrawnGraph | null = null
// The page the graphs are drawn around, as the router last named it.
let slug = document.body.dataset.slug ?? "index"
// Bumped by every navigation, so a draw still waiting for the index when the reader moves on is
// dropped rather than drawn onto the next page.
let generation = 0

const dialogs = () => [...document.querySelectorAll<HTMLDialogElement>(".cgc-graph__dialog")]

function clearLocals() {
  locals.forEach((graph) => graph.destroy())
  locals = []
}

async function drawLocals() {
  const mine = ++generation
  clearLocals()
  let sources
  try {
    sources = await loadSources()
  } catch (err) {
    console.error("cgc-graph: could not load the graph's index", err)
    return
  }
  if (mine !== generation) return
  for (const container of document.querySelectorAll<HTMLElement>(".cgc-graph__local")) {
    locals.push(renderGraph(container, slug, sources))
  }
}

async function openGlobal(dialog: HTMLDialogElement) {
  if (dialog.open) return
  dialog.showModal()
  const container = dialog.querySelector<HTMLElement>(".cgc-graph__global")
  let sources
  try {
    sources = await loadSources()
  } catch (err) {
    console.error("cgc-graph: could not load the graph's index", err)
    return
  }
  if (!dialog.open || !container) return
  global?.destroy()
  global = renderGraph(container, slug, sources)
}

document.addEventListener("nav", ((event: CustomEvent<{ url?: string }>) => {
  slug = event.detail?.url ?? document.body.dataset.slug ?? "index"
  addVisited(nodeIdOf(slug))
  void drawLocals()
}) as EventListener)

document.addEventListener("prenav", () => {
  generation++
  dialogs().forEach((dialog) => dialog.open && dialog.close())
  clearLocals()
})

document.addEventListener("themechange", () => {
  locals.forEach((graph) => graph.repaint())
  global?.repaint()
})

document.addEventListener("click", (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const button = target.closest(".cgc-graph__open")
  if (button) {
    const dialog = button
      .closest(".cgc-graph")
      ?.querySelector<HTMLDialogElement>(".cgc-graph__dialog")
    if (dialog) void openGlobal(dialog)
    return
  }
  // The dialog's content fills it, so a click on the dialog itself is a click on its backdrop.
  if (target instanceof HTMLDialogElement && target.classList.contains("cgc-graph__dialog"))
    target.close()
})

// However the dialog closes, Escape included, the global graph goes with it. `close` doesn't bubble,
// so this listens as it passes down.
document.addEventListener(
  "close",
  (event) => {
    if (event.target instanceof Element && event.target.classList.contains("cgc-graph__dialog")) {
      global?.destroy()
      global = null
    }
  },
  true,
)

// v4's shortcut: Ctrl+G, or ⌘+G, opens the global graph, and closes it again.
document.addEventListener("keydown", (event) => {
  if (event.key !== "g" || !(event.ctrlKey || event.metaKey) || event.shiftKey) return
  const [dialog] = dialogs()
  if (!dialog) return
  event.preventDefault()
  if (dialog.open) dialog.close()
  else void openGlobal(dialog)
})
