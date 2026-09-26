// The probability distribution of a dice roll, charted, as a cgc-mdx island.
//
// Supports simple dice ("d20"), several dice ("2d6"), sums and constants ("d20 + 5"),
// advantage and disadvantage ("adv(d20)", "dis(d20)") and max/min ("max(d6, d6)"). The reader can
// edit the expression, and, with `showThreshold`, drag a line across the chart to read off the odds
// of rolling under it and at or over it.
//
// Ported from v4's component.tsx and script.inline.ts beside this file, which Quartz 4 reads until
// cutover. The statistics now render at build time; the chart is drawn in the browser by Plotly,
// which loads only once the widget hydrates, and takes its colours from the theme (widget.css).
import { useEffect, useMemo, useRef, useState } from "preact/hooks"
import { Distribution, parseExpression } from "./dice"
import { onSchemeChange, skin } from "../scheme"
import "./widget.css"

export interface ProbabilityConvolutionsProps {
  /** The dice expression to chart, e.g. "d20", "2d6", "adv(d20)". */
  expression?: string
  /** Chart height in pixels. */
  height?: number
  /** Show probabilities as percentages (0–100) rather than decimals (0–1). */
  asPercentage?: boolean
  /** A title above the chart. */
  title?: string
  /** A draggable threshold line, with the odds of rolling under it and at or over it. */
  showThreshold?: boolean
  /** Where the threshold starts: `6` reads off P(X < 6) and P(X ≥ 6). Defaults to the median. */
  initialThreshold?: number
}

type Evaluated = { dist: Distribution; error?: undefined } | { dist?: undefined; error: string }

function evaluate(expression: string): Evaluated {
  try {
    const dist = parseExpression(expression)
    if (dist.entries().length === 0) throw new Error("Empty distribution")
    return { dist }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

// The line sits between bars, at N - 0.5, so it splits the rolls into under N and N or more.
const startingThreshold = (dist: Distribution, initial?: number) => (initial ?? dist.median()) - 0.5

export function ProbabilityConvolutions({
  expression: initialExpression = "d20",
  height = 300,
  asPercentage = true,
  title,
  showThreshold = false,
  initialThreshold,
}: ProbabilityConvolutionsProps) {
  const [expression, setExpression] = useState(initialExpression)
  // Where the reader dragged the threshold to, for the expression now showing.
  const [dragged, setDragged] = useState<number | null>(null)
  const { dist, error } = useMemo(() => evaluate(expression), [expression])
  const threshold = showThreshold && dist ? (dragged ?? startingThreshold(dist, initialThreshold)) : null

  const chartRef = useRef<HTMLDivElement>(null)
  const plotly = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const [scheme, setScheme] = useState(0)
  // What the drag handler, registered once, needs to see now.
  const latest = useRef({ dist, threshold })
  latest.current = { dist, threshold }
  // The chart stays on the last expression that parsed while the reader types one that doesn't.
  const shown = useRef<{ dist: Distribution; threshold: number | null } | null>(null)
  if (dist) shown.current = { dist, threshold }

  // Plotly is heavy and browser-only, so it loads when the widget hydrates, never at build time.
  // Its global stylesheet, which it adds to the head itself, is outside cgc-mdx's widget layer and
  // outranks the site's CSS; its selectors reach only Plotly's own elements (cgc-mdx ADR-0002).
  useEffect(() => {
    let live = true
    const el = chartRef.current!
    let observer: ResizeObserver | undefined
    import("plotly.js-dist-min").then(({ default: Plotly }) => {
      if (!live) return
      plotly.current = Plotly
      observer = new ResizeObserver(() => el.querySelector(".main-svg") && Plotly.Plots.resize(el))
      observer.observe(el)
      setReady(true)
    })
    const stopWatching = onSchemeChange(() => setScheme((n) => n + 1))
    return () => {
      live = false
      observer?.disconnect()
      stopWatching()
      plotly.current?.purge(el)
    }
  }, [])

  useEffect(() => {
    if (!ready || !shown.current) return
    const Plotly = plotly.current
    const el = chartRef.current! as any
    Plotly.react(el, ...chart(el.parentElement, shown.current.dist, { height, asPercentage, title, threshold: shown.current.threshold }))
    if (showThreshold && !el.cgcDragging) {
      el.cgcDragging = true
      el.on("plotly_relayout", (event: Record<string, number>) => {
        const { dist: current, threshold: now } = latest.current
        // Dragged by its middle, both ends move; by one end, only that end does.
        const x = event["shapes[0].x0"] ?? event["shapes[0].x1"]
        if (!current || now === null || x === undefined) return
        // Snap to the gap between two bars, within the rolls that can happen; anywhere else, the
        // line goes back where it was.
        const snapped = Math.floor(x - 0.5) + 0.5
        const values = current.values()
        const inRange = snapped >= values[0] - 0.5 && snapped <= values[values.length - 1] + 0.5
        const target = inRange ? snapped : now
        if (inRange) setDragged(snapped)
        const line = el.layout.shapes[0]
        if (Math.abs(target - x) > 0.01 || line.x0 !== line.x1 || line.y0 !== 0 || line.y1 !== 1)
          Plotly.relayout(el, { "shapes[0].x0": target, "shapes[0].x1": target, "shapes[0].y0": 0, "shapes[0].y1": 1 })
      })
    }
  }, [ready, dist, threshold, scheme])

  const format = (p: number) => (asPercentage ? `${(p * 100).toFixed(1)}%` : p.toFixed(3))
  // The threshold at N - 0.5 splits P(X < N) from P(X ≥ N).
  const split = threshold === null || !dist ? null : Math.floor(threshold) + 1
  const below = split === null ? null : dist!.cdf(split - 1)

  return (
    <div class="probability-convolutions">
      <label class="probability-convolutions__field">
        <span class="probability-convolutions__label">Expression:</span>
        <input
          class="probability-convolutions__input"
          type="text"
          placeholder="e.g., 2d6, adv(d20)"
          value={expression}
          onInput={(e) => {
            setExpression((e.target as HTMLInputElement).value)
            setDragged(null)
          }}
        />
      </label>
      <div class="probability-convolutions__chart" ref={chartRef} style={{ minHeight: `${height}px` }} />
      <div class="probability-convolutions__stats">
        <span class="probability-convolutions__stat">
          <strong>Mean:</strong> <span class="probability-convolutions__mean">{dist ? dist.mean().toFixed(2) : "—"}</span>
        </span>
        <span class="probability-convolutions__separator">•</span>
        <span class="probability-convolutions__stat">
          <strong>Median:</strong> <span class="probability-convolutions__median">{dist ? String(dist.median()) : "—"}</span>
        </span>
      </div>
      {showThreshold && (
        <div class="probability-convolutions__thresholds">
          <div class="probability-convolutions__threshold probability-convolutions__threshold--below">
            <span>Less than</span>
            <span class="probability-convolutions__threshold-value">{split ?? "—"}</span>
            <span>:</span>
            <span class="probability-convolutions__threshold-odds">{below === null ? "—" : format(below)}</span>
          </div>
          <div class="probability-convolutions__threshold probability-convolutions__threshold--above">
            <span class="probability-convolutions__threshold-value">{split ?? "—"}</span>
            <span> or more:</span>
            <span class="probability-convolutions__threshold-odds">{below === null ? "—" : format(1 - below)}</span>
          </div>
        </div>
      )}
      {error && <div class="probability-convolutions__error">Error: {error}</div>}
    </div>
  )
}

// Plotly's data, layout and config for one distribution: bars for each roll's odds, a line for the
// odds of rolling under each, and the threshold. Colours come from the widget's skin, as it is now.
function chart(root: HTMLElement, dist: Distribution, options: { height: number; asPercentage: boolean; title?: string; threshold: number | null }) {
  const { height, asPercentage, title, threshold } = options
  const colour = (name: string) => skin(root, `--probability-convolutions-${name}`)
  const scale = (p: number) => (asPercentage ? p * 100 : p)
  const xs = dist.values()
  const ys = dist.entries().map(([, p]) => scale(p))
  const last = xs[xs.length - 1]

  const bars = {
    x: xs,
    y: ys,
    type: "bar",
    name: "Probability",
    width: 0.8,
    marker: {
      color: threshold === null ? colour("bar") : xs.map((x) => (x <= Math.floor(threshold) ? colour("below") : colour("above"))),
    },
  }
  // The odds of rolling under x, plotted at x - 0.5, where a threshold line there would sit.
  const cumulative = {
    x: [...xs.map((x) => x - 0.5), last + 0.5],
    y: [...xs.map((x) => scale(dist.cdf(x - 1))), scale(1)],
    type: "scatter",
    mode: "lines+markers",
    name: "Cumulative",
    line: { color: colour("cumulative"), width: 2 },
    marker: { size: 4 },
  }
  const ink = colour("ink")
  const grid = colour("grid")
  const paper = colour("paper")
  const layout = {
    title,
    height,
    paper_bgcolor: paper,
    plot_bgcolor: paper,
    font: { family: getComputedStyle(root).fontFamily, color: ink },
    xaxis: { dtick: 1, type: "linear", range: [xs[0] - 0.5, last + 0.5], gridcolor: grid, linecolor: grid, zerolinecolor: grid },
    yaxis: {
      tickmode: "array",
      tickvals: asPercentage ? [0, 25, 50, 75, 100] : [0, 0.25, 0.5, 0.75, 1],
      ticktext: asPercentage ? ["0%", "25%", "50%", "75%", "100%"] : ["0", "0.25", "0.5", "0.75", "1"],
      gridcolor: grid,
      zerolinecolor: grid,
    },
    margin: { t: title ? 40 : 20, r: 20, b: 40, l: 50 },
    shapes:
      threshold === null
        ? []
        : [{ type: "line", x0: threshold, x1: threshold, y0: 0, y1: 1, yref: "paper", line: { color: colour("threshold"), width: 3, dash: "dash" } }],
    dragmode: false,
    showlegend: true,
    legend: { x: 0.02, y: 0.98, xanchor: "left", yanchor: "top" },
    bargap: 0.2,
  }
  // Only the threshold line moves; nothing else on the chart is editable.
  const config = { responsive: true, displayModeBar: false, edits: { shapePosition: threshold !== null } }
  return [[bars, cumulative], layout, config] as const
}
