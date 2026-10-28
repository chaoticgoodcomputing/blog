// The end-to-end suite's stand-in for Obsidian: what src/view.ts does, on a plain page. It frames
// the viewer page, hands it its port, and answers it with the fixture PDF and the fake service over
// a note kept in memory, which the tests read back as `window.harness.note`.

import { ANNOTATION_PARAM, CONNECT, PAGES_PARAM, type Reply, type Request } from "../../src/protocol.ts"
import { createService } from "../../src/service.ts"

const params = new URL(location.href).searchParams
const TARGET = "https://example.org/fixture.pdf"

const harness = {
  /** The annotation note, as the fake service last wrote it. */
  note: params.get("note") ?? `---\nannotation-target: ${TARGET}\n---\n\nA preface.\n`,
  /** Every request the viewer page made, for the tests to look at. */
  requests: [] as Request[],
}
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

const page = new URL("/frames/viewer.html", location.href)
const annotation = params.get(ANNOTATION_PARAM)
if (annotation) page.searchParams.set(ANNOTATION_PARAM, annotation)
const pages = params.get(PAGES_PARAM)
if (pages) page.searchParams.set(PAGES_PARAM, pages)

const frame = document.createElement("iframe")
frame.src = page.href
frame.addEventListener("load", () => {
  const channel = new MessageChannel()
  const port = channel.port1
  port.onmessage = async ({ data }: MessageEvent<Request>) => {
    harness.requests.push(data)
    try {
      if (data.kind === "document") {
        const bytes = await (await fetch("/fixture.pdf")).arrayBuffer()
        port.postMessage({ id: data.id, ok: true, value: { data: bytes, url: TARGET } } satisfies Reply, [bytes])
      } else {
        port.postMessage({ id: data.id, ok: true, value: await service(data.request) } satisfies Reply)
      }
    } catch (error) {
      port.postMessage({ id: data.id, ok: false, error: String(error) } satisfies Reply)
    }
  }
  frame.contentWindow!.postMessage({ type: CONNECT }, "*", [channel.port2])
})
document.body.append(frame)
