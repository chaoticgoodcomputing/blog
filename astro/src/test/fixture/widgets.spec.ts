import { expect, test } from "../site.ts"

// An MDX note's widgets are islands, and each loads only its own code: PDF.js only where a note
// shows a PDF. test/fixtures/vault/attachments/one-page shows one, and
// client-side-navigation/widget a Bluesky post.

test("a note loads PDF.js only when it shows a PDF", async ({ page }) => {
  const notes = {
    "/attachments/one-page": true,
    "/client-side-navigation/widget": false,
    "/content/notes/alpha": false,
  }
  for (const [url, pdf] of Object.entries(notes)) {
    const requested: string[] = []
    const listener = (request: { url(): string }) => requested.push(new URL(request.url()).pathname)
    page.on("request", listener)
    await page.goto(url)
    await page.waitForLoadState("networkidle")
    page.off("request", listener)
    // PDF.js by name: the bundle Vite names after its worker, and the worker.
    expect(requested.some((path) => /\/pdf\.worker\./.test(path)), `${url} loads PDF.js`).toBe(pdf)
    // And nothing of the PDF viewer's at all, where there is none.
    if (!pdf) expect(requested.filter((path) => /pdf/i.test(path)), url).toEqual([])
  }
})
