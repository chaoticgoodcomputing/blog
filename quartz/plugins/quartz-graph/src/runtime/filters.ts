// The global graph's filters: a time slider (all, the last year, the last month) and a toggle for
// private pages (v4 ui/filters.ts). The slider reads each page's date, from the graph's own index.
import type { TimePeriod } from "../options"
import type { FilterState } from "./graph-data"
import { element } from "./dom"

const PERIODS: TimePeriod[] = ["all", "year", "month"]
const NAMES: Record<TimePeriod, string> = { all: "All", year: "Year", month: "Month" }

/** The controls, at the top of `container`. Returns their removal. */
export function filterControls(
  container: HTMLElement,
  initial: FilterState,
  onChange: (state: FilterState) => void,
): () => void {
  const state = { ...initial }
  const controls = element("div", "cgc-graph__filters")

  const time = element("div", "cgc-graph__time")
  const labels = element("div", "cgc-graph__time-labels")
  labels.setAttribute("aria-hidden", "true")
  for (const period of PERIODS)
    labels.append(element("span", "cgc-graph__time-label", NAMES[period]))
  const slider = element("input", "cgc-graph__slider")
  Object.assign(slider, { type: "range", min: "0", max: String(PERIODS.length - 1), step: "1" })
  slider.value = String(PERIODS.indexOf(state.timePeriod))
  slider.setAttribute("aria-label", "Time period")
  slider.setAttribute("aria-valuetext", NAMES[state.timePeriod])
  time.append(labels, slider)

  const visibility = element("label", "cgc-graph__visibility")
  const toggle = element("input", "cgc-graph__private-toggle")
  toggle.type = "checkbox"
  toggle.checked = state.includePrivate
  visibility.append(toggle, element("span", "cgc-graph__private-label", "Include private notes"))

  controls.append(time, visibility)
  container.prepend(controls)

  const onSlide = () => {
    state.timePeriod = PERIODS[Number(slider.value)] ?? "all"
    slider.setAttribute("aria-valuetext", NAMES[state.timePeriod])
    onChange({ ...state })
  }
  const onToggle = () => {
    state.includePrivate = toggle.checked
    onChange({ ...state })
  }
  slider.addEventListener("input", onSlide)
  toggle.addEventListener("change", onToggle)
  return () => controls.remove()
}
