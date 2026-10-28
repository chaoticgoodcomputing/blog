// The sidebar page: the Hypothesis client's sidebar app, as Hypothesis's own server serves it
// (`<hypothesis-app>`, its settings as JSON, the boot script), with two things of the plugin's:
//
// - The API the client calls is answered by the fake service. The client calls the global `fetch`
//   for every API request, so this script replaces it before the client loads: requests to the API
//   go to the viewer page, this page's parent and on its origin, which asks the plugin; anything
//   else goes out as before.
// - Comments are rendered by Obsidian, as in the note. The client's Markdown renderer defers to
//   `window.__annotatorRenderMarkdown` (patches/README.md), which must answer at once with HTML;
//   Obsidian renders in the plugin, later. So it answers with an `<annotator-markdown>` element,
//   which fills itself in when the rendering comes, in a shadow root of its own, with Obsidian's
//   styles, so that neither Obsidian's styles nor the sidebar's reach the other.

// First, before the client adds its stylesheets.
import "./stylesheets.ts"
import type { Bridge } from "./viewer.ts"
import type { StylesReply } from "../src/protocol.ts"
import { API_URL } from "../src/service.ts"

const bridge = (parent as any).annotatorBridge as Bridge
const networkFetch = window.fetch.bind(window)

window.fetch = async function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request ? input : null
  const url = request ? request.url : String(input)
  if (!url.startsWith(API_URL)) return networkFetch(input, init)
  const method = init?.method ?? request?.method ?? "GET"
  const body = init?.body != null ? String(init.body) : request ? await request.text() : undefined
  const answer = await bridge.api({ method, url, body: body || undefined })
  return new Response(answer.status === 204 ? null : answer.body, { status: answer.status, headers: { "Content-Type": "application/json" } })
}

// Obsidian's styles, shared by every rendered comment's shadow root, and its fonts, which apply
// only from the document's own stylesheets. Both follow Obsidian's when they change.
const obsidianStyles = new CSSStyleSheet()
const obsidianFonts = new CSSStyleSheet()
// A comment in the sidebar's card: Obsidian's styles, without the margins of a note's first and
// last blocks, at the card's size.
const commentStyles = new CSSStyleSheet()
commentStyles.replaceSync(`
  :host { display: block; }
  .annotator-comment { font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
  .annotator-comment > :first-child { margin-top: 0; }
  .annotator-comment > :last-child { margin-bottom: 0; }
`)
document.adoptedStyleSheets = [...document.adoptedStyleSheets, obsidianFonts]
function applyStyles({ css, fonts }: StylesReply) {
  obsidianStyles.replaceSync(css)
  obsidianFonts.replaceSync(fonts)
}
bridge.styles().then(applyStyles, (error) => console.warn("Annotator: no styles from Obsidian", error))
bridge.onStyles(applyStyles)

// Renderings, by the Markdown they render; and the Markdown, by the number its placeholder names.
const rendered = new Map<string, Promise<string>>()
const sources: string[] = []
const numbers = new Map<string, number>()

const render = (markdown: string) => {
  let html = rendered.get(markdown)
  if (!html) {
    html = bridge.renderMarkdown(markdown)
    rendered.set(markdown, html)
    // A failed rendering is asked for again next time.
    html.catch(() => rendered.delete(markdown))
  }
  return html
}

/**
 * The client's Markdown renderer, deferring to the plugin. The same Markdown always gives the same
 * placeholder, so the client, which only replaces a comment's HTML when the HTML changes, keeps an
 * element that has filled itself in.
 */
;(window as any).__annotatorRenderMarkdown = (markdown: string): string => {
  let number = numbers.get(markdown)
  if (number === undefined) {
    number = sources.push(markdown) - 1
    numbers.set(markdown, number)
    void render(markdown)
  }
  return `<annotator-markdown data-source="${number}"></annotator-markdown>`
}

class AnnotatorMarkdown extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return
    const root = this.attachShadow({ mode: "open" })
    root.adoptedStyleSheets = [obsidianStyles, commentStyles]
    const body = document.createElement("div")
    body.className = "markdown-rendered annotator-comment"
    root.append(body)
    root.addEventListener("click", (event) => followLink(event as MouseEvent))
    const markdown = sources[Number(this.dataset.source)]
    if (markdown === undefined) return
    // Until Obsidian's rendering comes, the comment as written.
    body.textContent = markdown
    render(markdown).then(
      (html) => (body.innerHTML = html),
      (error) => console.warn("Annotator: Obsidian could not render a comment", error),
    )
  }
}
customElements.define("annotator-markdown", AnnotatorMarkdown)

/** A link in a rendered comment opens in Obsidian: a link to the vault in a tab, any other outside it. */
function followLink(event: MouseEvent) {
  const link = event.composedPath().find((target): target is HTMLAnchorElement => target instanceof HTMLAnchorElement)
  if (!link) return
  event.preventDefault()
  event.stopPropagation()
  const internal = link.classList.contains("internal-link")
  const href = internal ? (link.dataset.href ?? link.getAttribute("href") ?? "") : link.href
  if (href) void bridge.openLink(href, internal)
}

// A `blob:` document whose `<base>` is the plugin's folder of pages (src/frame-page.ts).
const here = (path: string) => new URL(path, document.baseURI).href

// The settings the sidebar reads from its page (ConfigFromSidebar in the client). `authDomain` is
// other than the service's authority, which makes the client a third party's, with no login of
// its own; and there is no Sentry.
const config = document.createElement("script")
config.type = "application/json"
config.className = "js-hypothesis-config"
config.textContent = JSON.stringify({
  assetRoot: here("hypothesis/"),
  apiUrl: API_URL,
  authDomain: "hypothes.is",
  oauthClientId: "annotator",
  rpcAllowedOrigins: [],
})
const boot = document.createElement("script")
boot.src = here("hypothesis/build/boot.js")
document.body.append(config, boot)
