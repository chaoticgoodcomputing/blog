// ADR-0003 rule 2 — never select what you do not own — checked where a collision shows up.
//
// The PostCSS pass polices one plugin's stylesheet; it cannot see two stylesheets interact. So
// every fixture page is rendered with our plugins on and off, and every element they do not own
// must compute identically. An element is owned if it, or an ancestor, carries a `cgc-` class.
import { test, expect } from "../harness/test.mjs"

const PAGES = ["/", "/plain-note", "/md-twin", "/mdx-article", "/nested/deep-note", "/tags/fixture"]
const PROPS = ["color", "background-color", "font-family", "font-size", "font-weight", "letter-spacing", "line-height", "margin-top", "margin-bottom", "padding-left", "display", "text-decoration-line"]

// Runs in the page. Keys each unowned element by its path through unowned ancestors, so an
// inserted plugin element does not shift the keys of its siblings.
const snapshot = (props) => {
  const owned = (el) => el.closest('[class*="cgc-"]') !== null
  const key = (el) => {
    const parts = []
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      if (owned(node)) continue
      const index = [...node.parentElement.children].filter((c) => !owned(c) && c.tagName === node.tagName).indexOf(node)
      parts.unshift(`${node.tagName.toLowerCase()}[${index}]`)
    }
    return parts.join(">")
  }
  const out = {}
  for (const el of document.body.querySelectorAll("*")) {
    if (owned(el) || el.closest("script,style,svg")) continue
    const style = getComputedStyle(el)
    out[key(el)] = Object.fromEntries(props.map((p) => [p, style.getPropertyValue(p)]))
  }
  return out
}

for (const url of PAGES) {
  test(`our plugins leave unowned elements alone on ${url}`, async ({ page, baselinePage }) => {
    await page.goto(url)
    await baselinePage.goto(url)
    const [withPlugins, baseline] = await Promise.all([page.evaluate(snapshot, PROPS), baselinePage.evaluate(snapshot, PROPS)])
    const bled = Object.entries(withPlugins)
      .filter(([key]) => baseline[key])
      .flatMap(([key, props]) =>
        Object.entries(props)
          .filter(([prop, value]) => baseline[key][prop] !== value)
          .map(([prop, value]) => `${key} ${prop}: ${baseline[key][prop]} → ${value}`),
      )
    expect(bled).toEqual([])
  })
}
