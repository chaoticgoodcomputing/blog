import { JSX } from "preact"

/**
 * Props for the Probability Convolutions widget.
 */
export interface ProbabilityConvolutionsProps {
  /**
   * Initial dice expression to evaluate, e.g. "d20", "2d6", "adv(d20)".
   * @default "d20"
   */
  expression?: string

  /**
   * Height of the chart in pixels.
   * @default 300
   */
  height?: number

  /**
   * Display probabilities as percentages (0-100) vs decimals (0-1).
   * @default true
   */
  asPercentage?: boolean

  /**
   * Optional title for the chart.
   */
  title?: string

  /**
   * Enable draggable threshold slider to show cumulative probabilities.
   * @default false
   */
  showThreshold?: boolean

  /**
   * Initial threshold value. The threshold line will be placed at this value minus 0.5.
   * For example, initialThreshold=6 places the line at 5.5, showing P(X < 6) vs P(X >= 6).
   * If not specified, defaults to the median value.
   */
  initialThreshold?: number
}

/**
 * Probability Convolutions widget - visualizes probability distributions of dice rolls.
 * 
 * Supports various dice notations including:
 * - Simple dice: "d20", "d6"
 * - Multiple dice: "2d6" (shorthand for "d6 + d6")
 * - Addition: "d6 + d6"
 * - Constants: "d20 + 5"
 * - Advantage/Disadvantage: "adv(d20)", "dis(d20)"
 * - Max/Min: "max(d6, d6)", "min(d6, d6)"
 * 
 * Each widget instance includes an editable expression input that updates
 * the chart in real-time, along with computed statistics (mean, median).
 * 
 * @example
 * ```mdx
 * import { ProbabilityConvolutions } from '@content/widgets/probability-convolutions'
 * 
 * <ProbabilityConvolutions 
 *   expression="2d6"
 *   height={400}
 *   title="Distribution of 2d6"
 * />
 * ```
 */
export function ProbabilityConvolutions(props: ProbabilityConvolutionsProps): JSX.Element {
  const {
    expression = "d20",
    height = 300,
    asPercentage = true,
    title,
    showThreshold = false,
    initialThreshold,
  } = props

  // Serialize configuration for the client script
  const config = {
    expression,
    height,
    asPercentage,
    title,
    showThreshold,
    initialThreshold,
  }

  return (
    <div
      class="widget-probability-convolutions"
      data-widget="probability-convolutions"
      data-config={JSON.stringify(config)}
    >
      <div class="prob-conv-input-container">
        <label class="prob-conv-label" for="prob-conv-expression">
          Expression:
        </label>
        <input
          class="prob-conv-expression-input"
          type="text"
          id="prob-conv-expression"
          placeholder="e.g., 2d6, adv(d20)"
          value={expression}
        />
      </div>
      <div class="prob-conv-chart-container"></div>
      <div class="prob-conv-stats">
        <span class="prob-conv-stat">
          <strong>Mean:</strong> <span class="prob-conv-mean">—</span>
        </span>
        <span class="prob-conv-stat-separator">•</span>
        <span class="prob-conv-stat">
          <strong>Median:</strong> <span class="prob-conv-median">—</span>
        </span>
      </div>
      {showThreshold && (
        <div class="prob-conv-threshold-stats">
          <div class="prob-conv-threshold-box prob-conv-threshold-below-box">
            <span class="prob-conv-threshold-label">Less than</span>
            <span class="prob-conv-threshold-value">—</span>
            <span class="prob-conv-threshold-label">:</span>
            <span class="prob-conv-threshold-prob prob-conv-threshold-below">—</span>
          </div>
          <div class="prob-conv-threshold-box prob-conv-threshold-above-box">
            <span class="prob-conv-threshold-value">—</span>
            <span class="prob-conv-threshold-label"> or more:</span>
            <span class="prob-conv-threshold-prob prob-conv-threshold-above">—</span>
          </div>
        </div>
      )}
      <div class="prob-conv-error" style="display: none;"></div>
    </div>
  )
}
