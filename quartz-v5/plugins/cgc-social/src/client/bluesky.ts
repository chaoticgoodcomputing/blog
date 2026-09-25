// The Bluesky card, in the browser: the account's latest posts and reposts, drawn by the widget
// library's renderer as compact post cards. The library escapes everything a post carries.
import { getAuthorFeed, renderPost, resolveHandle } from "@chaoticgoodcomputing/widgets/bluesky"
import { element, empty, failed, reasonOf } from "./status"

export async function drawBluesky(card: HTMLElement, signal: AbortSignal) {
  const body = card.querySelector<HTMLElement>(".cgc-social__body")
  const handle = card.dataset.handle
  if (!body || !handle) return
  const limit = Number(card.dataset.postLimit) || 5
  const showMetrics = card.dataset.showMetrics !== "false"

  try {
    const feed = await getAuthorFeed(await resolveHandle(handle, { signal }), { limit, signal })
    if (signal.aborted) return
    if (feed.length === 0) {
      body.replaceChildren(empty("No posts found"))
      return
    }
    // Drawn before it is shown, so a post the renderer can't read fails like a failed fetch.
    const posts = element("div", "posts")
    posts.innerHTML = feed
      .map((item) => renderPost(item, { showMetrics, showContext: true, compact: true }))
      .join("")
    body.replaceChildren(posts)
  } catch (error) {
    if (signal.aborted) return
    body.replaceChildren(failed("Failed to load posts", reasonOf(error)))
  }
}
