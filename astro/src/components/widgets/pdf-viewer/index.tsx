// pdf-viewer: a PDF drawn page by page with PDF.js, bundled rather than fetched from a CDN. An
// island: the build-time HTML is the toolbar, a download link and a way to open the PDF, and
// hydration draws the pages.
import { useEffect, useRef, useState } from "preact/hooks"
import styles from "./pdf-viewer.module.css"

export interface PDFViewerProps {
  /** The PDF's URL, as the page would link it. */
  src: string
  /** Shown in the toolbar. */
  title?: string
  /** A CSS width. */
  width?: string
  /** A CSS height. The pages scroll inside it. */
  height?: string
}

type Status =
  | { state: "loading" }
  | { state: "shown"; pages: number }
  | { state: "failed"; message: string }

export function PDFViewer({
  src,
  title = "PDF Document",
  width = "100%",
  height = "600px",
}: PDFViewerProps) {
  const pages = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>({ state: "loading" })

  // Runs only in the browser, after hydration. The cleanup runs when the island unmounts.
  useEffect(() => {
    let shown: { destroy(): void } | undefined
    let unmounted = false
    import("./document")
      .then(({ show }) => {
        if (unmounted) return
        shown = show(src, pages.current!, {
          loaded: (count) => setStatus({ state: "shown", pages: count }),
          failed: (error) => setStatus({ state: "failed", message: error.message }),
        })
      })
      .catch((error) => {
        if (!unmounted) setStatus({ state: "failed", message: String(error?.message ?? error) })
      })
    return () => {
      unmounted = true
      shown?.destroy()
    }
  }, [src])

  return (
    <div class={styles.root} style={{ width, height }}>
      <div class={styles.toolbar}>
        <span class={styles.info}>
          <span class={styles.title}>{title}</span>
          {status.state === "shown" && (
            <span class={styles.count}>
              {status.pages} page{status.pages === 1 ? "" : "s"}
            </span>
          )}
        </span>
        <a
          class={styles.download}
          href={src}
          download
          title="Download PDF"
        >
          <DownloadIcon />
          Download
        </a>
      </div>
      <div class={styles.viewport}>
        {status.state !== "shown" && (
          <p
            class={`${styles.status}${status.state === "failed" ? ` ${styles.statusFailed}` : ""}`}
          >
            {status.state === "failed"
              ? `The PDF couldn't be shown here: ${status.message}`
              : "Loading PDF…"}{" "}
            <a
              class={styles.open}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open the PDF
            </a>
          </p>
        )}
        {/* Drawn into by PDF.js, outside Preact's reach: its vnode never has children. */}
        <div class={styles.pages} ref={pages} />
      </div>
    </div>
  )
}

const DownloadIcon = () => (
  <svg
    class={styles.icon}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
