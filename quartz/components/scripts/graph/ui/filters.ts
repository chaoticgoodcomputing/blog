/**
 * Graph filtering UI and logic for the global graph view
 */

import type { ContentDetails } from "../../../../plugins/emitters/contentIndex"
import type { SimpleSlug } from "../../../../util/path"
import type { NodeData } from "../core/types"

export type TimePeriod = "all" | "year" | "month"

export interface FilterState {
  timePeriod: TimePeriod
  includePrivate: boolean
}

export interface AdaptiveTimePeriodConfig {
  minPosts: number          // settle on the narrowest period with at least this many posts
  order?: TimePeriod[]      // narrow→wide preference; default ["month", "year", "all"]
}

/**
 * Create filter controls UI for the global graph
 */
export function createFilterControls(
  container: HTMLElement,
  onFilterChange: (state: FilterState) => void,
  initialState?: Partial<FilterState>,
): { cleanup: () => void } {
  const filterContainer = document.createElement("div")
  filterContainer.className = "graph-filters"

  // Time period slider (no header, labels at positions)
  const timeSliderGroup = document.createElement("div")
  timeSliderGroup.className = "time-slider-group"

  const timeLabels = document.createElement("div")
  timeLabels.className = "time-labels"
  timeLabels.innerHTML = `
    <span>All</span>
    <span>Year</span>
    <span>Month</span>
  `

  const slider = document.createElement("input")
  slider.type = "range"
  slider.min = "0"
  slider.max = "2"
  slider.value = "0"
  slider.step = "1"

  timeSliderGroup.appendChild(timeLabels)
  timeSliderGroup.appendChild(slider)

  // Private/public toggle (no header)
  const visibilityToggle = document.createElement("div")
  visibilityToggle.className = "visibility-toggle"

  const privateCheckbox = document.createElement("input")
  privateCheckbox.type = "checkbox"
  privateCheckbox.id = "graph-private-toggle"
  privateCheckbox.checked = true

  const privateLabel = document.createElement("label")
  privateLabel.htmlFor = "graph-private-toggle"
  privateLabel.textContent = "Include private notes"

  visibilityToggle.appendChild(privateCheckbox)
  visibilityToggle.appendChild(privateLabel)

  // Add groups to container
  filterContainer.appendChild(timeSliderGroup)
  filterContainer.appendChild(visibilityToggle)

  // Insert at the beginning of the container
  container.insertBefore(filterContainer, container.firstChild)

  // Current filter state (use initial state if provided)
  let currentState: FilterState = {
    timePeriod: initialState?.timePeriod ?? "all",
    includePrivate: initialState?.includePrivate ?? true,
  }

  // Set UI controls to match initial state
  const timePeriods: TimePeriod[] = ["all", "year", "month"]
  slider.value = timePeriods.indexOf(currentState.timePeriod).toString()
  privateCheckbox.checked = currentState.includePrivate

  // Event handlers
  const handleSliderChange = () => {
    const value = parseInt(slider.value)
    const periods: TimePeriod[] = ["all", "year", "month"]
    currentState.timePeriod = periods[value]
    onFilterChange(currentState)
  }

  const handlePrivateToggle = () => {
    currentState.includePrivate = privateCheckbox.checked
    onFilterChange(currentState)
  }

  slider.addEventListener("input", handleSliderChange)
  privateCheckbox.addEventListener("change", handlePrivateToggle)

  return {
    cleanup: () => {
      slider.removeEventListener("input", handleSliderChange)
      privateCheckbox.removeEventListener("change", handlePrivateToggle)
      filterContainer.remove()
    },
  }
}

/**
 * Calculate the cutoff date for a given time period
 */
export function getTimePeriodCutoff(period: TimePeriod): Date | null {
  if (period === "all") return null

  const now = new Date()
  const cutoff = new Date(now)

  if (period === "year") {
    cutoff.setFullYear(now.getFullYear() - 1)
  } else if (period === "month") {
    cutoff.setMonth(now.getMonth() - 1)
  }

  return cutoff
}

/**
 * Count post nodes that fall within a given time period.
 *
 * Mirrors the post-node criteria of `shouldIncludeNode`: tag nodes are
 * ignored, the private toggle is respected so the count reflects what the
 * viewer will actually see, and nodes are kept when their date passes the
 * period cutoff.
 */
export function countPostsInPeriod(
  nodes: NodeData[],
  data: Map<SimpleSlug, ContentDetails>,
  period: TimePeriod,
  includePrivate: boolean,
): number {
  const cutoffDate = getTimePeriodCutoff(period)
  let count = 0

  for (const node of nodes) {
    if (node.id.startsWith("tags/")) continue

    const contentDetails = data.get(node.id)
    if (!contentDetails) continue

    if (!includePrivate) {
      const hasPrivateTag = contentDetails.tags.some((tag) => tag.toLowerCase() === "private")
      if (hasPrivateTag) continue
    }

    if (cutoffDate && contentDetails.date && new Date(contentDetails.date) < cutoffDate) {
      continue
    }

    count++
  }

  return count
}

/**
 * Resolve the effective default time period adaptively against the data.
 *
 * Walks `order` from narrowest to widest and returns the first period whose
 * in-period post count meets `minPosts`. Falls through to the widest period
 * in `order` (defaults guarantee "all", which is always non-empty).
 */
export function resolveTimePeriod(
  nodes: NodeData[],
  data: Map<SimpleSlug, ContentDetails>,
  config: AdaptiveTimePeriodConfig,
  includePrivate: boolean,
): TimePeriod {
  const order: TimePeriod[] =
    config.order && config.order.length > 0 ? config.order : ["month", "year", "all"]

  for (const period of order) {
    if (countPostsInPeriod(nodes, data, period, includePrivate) >= config.minPosts) {
      return period
    }
  }

  return order[order.length - 1]
}
