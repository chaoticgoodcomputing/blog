// cgc-social's browser script: fills each card on the page with what its account shows. Plain
// script, run once per page load; Quartz dispatches `nav` on the first load and after every SPA
// navigation, so each page's cards are drawn once, and a card that navigation brings back is drawn
// again. Leaving a page aborts its requests.
import { drawBluesky } from "./bluesky"
import { drawGitHub } from "./github"

let current: AbortController | undefined

document.addEventListener("prenav", () => current?.abort())
document.addEventListener("nav", () => {
  current?.abort()
  const controller = new AbortController()
  current = controller
  for (const card of document.querySelectorAll<HTMLElement>(".cgc-social__card--github"))
    void drawGitHub(card, controller.signal)
  for (const card of document.querySelectorAll<HTMLElement>(".cgc-social__card--bluesky"))
    void drawBluesky(card, controller.signal)
})
