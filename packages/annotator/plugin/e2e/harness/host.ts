// The end-to-end suite's stand-in for Obsidian: what src/view.ts does, on a plain page. It frames
// the viewer page, hands it its port, and answers it with the fixture PDF and the fake service over
// a note kept in memory, which the tests read back as `window.harness.note`.

import { blobPage, framePage } from "../../src/frame-page.ts"
import { CONNECT, type Reply, type Request } from "../../src/protocol.ts"
import { createService } from "../../src/service.ts"

const params = new URL(location.href).searchParams
const TARGET = "https://example.org/fixture.pdf"

const harness = {
  /** The annotation note, as the fake service last wrote it. */
  note: params.get("note") ?? `---\nannotation-target: ${TARGET}\n---\n\nA preface.\n`,
  /** Every request the viewer page made, for the tests to look at. */
  requests: [] as Request[],
  /** The links of rendered comments the user followed. */
  links: [] as { href: string; internal: boolean }[],
}

const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (character) => `&#${character.charCodeAt(0)};`)

/** Obsidian's renderer, as far as the suite needs it: paragraphs, bold, and wikilinks as Obsidian writes them. */
const renderMarkdown = (markdown: string) =>
  markdown
    .split(/\n\n+/)
    .map((paragraph) => {
      const html = escapeHtml(paragraph)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => `<a class="internal-link" data-href="${target}" href="${target}">${alias ?? target}</a>`)
      return `<p>${html}</p>`
    })
    .join("")

/** Obsidian's styles, as far as the suite needs them: a variable of its theme, and a rule using it. */
const STYLES = { css: ":host { --text-accent: rgb(1, 2, 3); }\n.internal-link { color: var(--text-accent); }\n", fonts: "" }
;(window as any).harness = harness

const service = createService({
  store: {
    read: async () => harness.note,
    update: async (change) => {
      harness.note = change(harness.note)
    },
  },
  displayName: "Tester",
})

async function frameViewer() {
  // As the plugin frames it (src/view.ts): a `blob:` document whose `<base>` is the folder of pages,
  // opened with the annotation and the page range the harness's own address names.
  const frame = document.createElement("iframe")
  const html = await (await fetch("/frames/viewer.html")).text()
  frame.src = blobPage(framePage(html, `${location.protocol}//127.0.0.1:${location.port}/frames/`, { annotation: params.get("annotation") ?? undefined, pages: params.get("pages") ?? undefined }))
  frame.addEventListener("load", () => {
    const channel = new MessageChannel()
    const port = channel.port1
    port.onmessage = async ({ data }: MessageEvent<Request>) => {
      harness.requests.push(data)
      try {
        const reply = (value: Extract<Reply, { ok: true }>["value"]) => port.postMessage({ id: data.id, ok: true, value } satisfies Reply)
        switch (data.kind) {
          case "document": {
            const bytes = await (await fetch("/fixture.pdf")).arrayBuffer()
            port.postMessage({ id: data.id, ok: true, value: { data: bytes, url: TARGET } } satisfies Reply, [bytes])
            break
          }
          case "api":
            reply(await service(data.request))
            break
          case "markdown":
            reply({ html: renderMarkdown(data.markdown) })
            break
          case "styles":
            reply(STYLES)
            break
          case "open-link":
            harness.links.push({ href: data.href, internal: data.internal })
            reply(null)
            break
        }
      } catch (error) {
        port.postMessage({ id: data.id, ok: false, error: String(error) } satisfies Reply)
      }
    }
    frame.contentWindow!.postMessage({ type: CONNECT }, "*", [channel.port2])
  })
  document.body.append(frame)
}

void frameViewer()
