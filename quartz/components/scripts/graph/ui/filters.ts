/**
 * Graph filtering UI and logic for the global graph view
 */

export type TimePeriod = "all" | "year" | "month"

export interface FilterState {
  timePeriod: TimePeriod
  includePrivate: boolean
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
  privateLabel.textContent = "Include private posts"

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
