// bluesky-post: one Bluesky post, fetched in the browser. An island: the build-time HTML is a
// loading state and a link to the post, and hydration fetches the post from Bluesky's public API and
// draws it with src/lib/bluesky's renderer. The build never touches the network.
import { useEffect, useState } from "preact/hooks"
import { BlueskyError, getPost, parseBlueskyUrl, renderPost } from "../../../lib/bluesky"
import styles from "./bluesky-post.module.css"

export interface BlueskyPostProps {
  /** The post's URL, as bsky.app shows it: `https://bsky.app/profile/<handle>/post/<id>`. */
  url: string
  /**
   * Show the post's reply, repost and like counts. Read as v4 read it, as text: only `true` or
   * `"true"` shows them, so an MDX author's quoted `showMetrics="false"` shows none.
   */
  showMetrics?: boolean | "true" | "false"
  /** A CSS max-width. */
  maxWidth?: string
}

type Status =
  | { state: "loading" }
  | { state: "shown"; html: string }
  | { state: "failed"; title: string; details: string }

// What a reader is told when the post can't be shown, by why (v4's words).
function failure(error: unknown): Status {
  if (error instanceof BlueskyError && error.reason === "not-found")
    return {
      state: "failed",
      title: "Post not found",
      details: "This post may have been deleted or is not publicly accessible.",
    }
  if (error instanceof BlueskyError && error.reason === "blocked")
    return {
      state: "failed",
      title: "Post blocked",
      details: "You do not have permission to view this post.",
    }
  return {
    state: "failed",
    title: "Failed to load post",
    details: String((error as Error)?.message ?? error),
  }
}

export function BlueskyPost({
  url,
  showMetrics: showMetricsProp = false,
  maxWidth = "600px",
}: BlueskyPostProps) {
  const showMetrics = String(showMetricsProp) === "true"
  const [status, setStatus] = useState<Status>({ state: "loading" })
  // Thrown while rendering at build time, a typo fails the build rather than shipping (v4 showed it
  // to readers instead).
  const address = parseBlueskyUrl(url)
  if (!address)
    throw new Error(
      `BlueskyPost: ${JSON.stringify(url)} is not a Bluesky post's URL (https://bsky.app/profile/<handle>/post/<id>)`,
    )

  // Runs only in the browser, after hydration. The cleanup runs when the island unmounts, which
  // the island runtime does before every SPA navigation, and abandons the request. The post is
  // drawn here too, so that a post the renderer can't make sense of fails like one that didn't come.
  useEffect(() => {
    const request = new AbortController()
    getPost(address.atUri, { signal: request.signal })
      .then(
        (post) =>
          ({
            state: "shown",
            html: renderPost({ post }, { showMetrics, showContext: false }),
          }) as const,
      )
      .catch(failure)
      .then((next) => request.signal.aborted || setStatus(next))
    return () => request.abort()
  }, [url, showMetrics])

  return (
    <div class={styles.root} style={{ maxWidth }}>
      {status.state === "shown" ? (
        <div dangerouslySetInnerHTML={{ __html: status.html }} />
      ) : (
        <div
          class={`${styles.status}${status.state === "failed" ? ` ${styles.statusFailed}` : ""}`}
          role="status"
        >
          {status.state === "loading" ? (
            <>
              <span class={styles.spinner} aria-hidden="true" />
              <p class={styles.message}>Loading post…</p>
            </>
          ) : (
            <>
              <p class={`${styles.message} ${styles.messageFailed}`}>
                {status.title}
              </p>
              <p class={styles.details}>{status.details}</p>
            </>
          )}
          <a class={styles.link} href={url} target="_blank" rel="noopener noreferrer">
            View on Bluesky
          </a>
        </div>
      )}
    </div>
  )
}
