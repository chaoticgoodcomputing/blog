// The global graph's settings panel, on the dev server only: a field for each number of the graph's
// settings and one for its pinned tags, beside the graph, which is drawn again on every change, and
// under them the settings as they are now, to paste over `graph.global` in src/site.config.ts. The
// built site has none of this: GlobalGraph.astro imports it under `import.meta.env.DEV`, which the
// build reads as false.

import { numbersIn, withNumber } from "../../lib/graph-tuning.ts"
import type { GlobalGraphSettings } from "../../site.config.types.ts"

/** Fills `panel` with the fields, each change handing `onChange` the settings with it made. */
export function settingsPanel(panel: HTMLElement, settings: GlobalGraphSettings, onChange: (settings: GlobalGraphSettings) => void) {
  let current = settings
  const source = document.createElement("pre")
  const show = () => (source.textContent = JSON.stringify(current, null, 2))
  const change = (next: GlobalGraphSettings) => {
    current = next
    show()
    onChange(current)
  }

  const heading = document.createElement("h3")
  heading.textContent = "Graph settings (dev only)"
  const fields = document.createElement("div")
  fields.className = "fields"

  const pinned = field("shell.pinnedTags", "text", current.shell.pinnedTags.join(", "))
  pinned.input.addEventListener("change", () => {
    const tags = pinned.input.value.split(",").map((tag) => tag.trim()).filter(Boolean)
    change({ ...current, shell: { ...current.shell, pinnedTags: tags } })
  })
  fields.append(pinned.label)

  for (const { path, value } of numbersIn(current)) {
    const { label, input } = field(path, "number", String(value))
    input.step = "any"
    input.addEventListener("change", () => {
      if (input.value === "" || Number.isNaN(input.valueAsNumber)) return
      change(withNumber(current, path, input.valueAsNumber))
    })
    fields.append(label)
  }

  show()
  panel.replaceChildren(heading, fields, source)
}

function field(name: string, type: string, value: string) {
  const label = document.createElement("label")
  const input = document.createElement("input")
  input.type = type
  input.value = value
  label.append(name, input)
  return { label, input }
}
