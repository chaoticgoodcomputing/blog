// Touches, for specs about gestures: Chromium's own touch input, through the DevTools protocol, so the
// page sees real touch and pointer events, as a phone would send them. Each finger is a list of
// points it passes through, all fingers moving together, in `steps` moves.
export async function touch(page, fingers, steps = 10) {
  const cdp = await page.context().newCDPSession(page)
  const at = (i) => fingers.map((path, id) => {
    const t = i / steps
    const [from, to] = [path[0], path[path.length - 1]]
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, id }
  })
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(0) })
  for (let i = 1; i <= steps; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(i) })
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  await cdp.detach()
}
