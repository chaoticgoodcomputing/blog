// How this blog is written, charted, as a cgc-mdx island: its dashes, and the length of its
// sentences and paragraphs, note by note, through the eras of the blog.
//
// The numbers come from corpus.json, which content/utils/writing-stats.ts writes from every note,
// private notes as numbers and titles with none of their text, on each commit. The widget only
// charts them; it never sees the notes' text. Plotly loads once the widget hydrates, as in the
// ProbabilityConvolutions widget, and takes its colours from widget.css.
import { useEffect, useMemo, useRef, useState } from "preact/hooks"
import { onSchemeChange, skin } from "../scheme"
import corpus from "./corpus.json"
import "./widget.css"

const DASH_KINDS = ["em", "double", "single", "en"] as const
type DashKind = (typeof DASH_KINDS)[number]
// Named without the dash itself: the post shows each kind once, at the top, and the charts after it
// don't repeat them.
const DASH_NAMES: Record<DashKind, string> = {
  em: "Em dash",
  double: "Double hyphen",
  single: "Single hyphen",
  en: "En dash",
}

interface Era {
  id: string
  label: string
  from?: string
}

interface Note {
  path?: string
  /** Its page on the site; none for a private note. */
  url?: string
  title: string
  private: boolean
  date: string
  era: string
  form: string
  words: number
  dashes: Record<DashKind, number>
  sentences: number[]
  sentenceDashes: number[]
  paragraphWords: number[]
  paragraphSentences: number[]
}

const ERAS = corpus.eras as Era[]
/** Things that happened, marked on the charts by note without starting an era (writing-stats.ts). */
const MILESTONES = corpus.milestones as { date: string; label: string }[]
const NOTES = corpus.notes as Note[]

export type WritingChart = "dashes-by-note" | "sentences-by-note" | "paragraphs-by-note"

export interface WritingStatsProps {
  /** Which chart to draw. */
  chart?: WritingChart
  /**
   * The fewest words a note needs to be counted, public or private: in a shorter one, a dash or two
   * is a rate no longer one would show. 100 by default.
   */
  minWords?: number
  /** Whether to start with the private notes counted too. */
  includePrivate?: boolean
  /** A title above the chart. */
  title?: string
  /** Chart height in pixels. */
  height?: number
  /** Grow into the margins beside the text, as the site's wide blocks do (note-body.css). */
  wide?: boolean
}

export function WritingStats({
  chart = "dashes-by-note",
  minWords = 100,
  includePrivate = true,
  title,
  height = 340,
  wide = false,
}: WritingStatsProps) {
  const [withPrivate, setWithPrivate] = useState(includePrivate)
  const notes = useMemo(
    () => NOTES.filter((note) => note.words >= minWords && (withPrivate || !note.private)),
    [withPrivate, minWords],
  )

  const chartRef = useRef<HTMLDivElement>(null)
  const plotly = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const [scheme, setScheme] = useState(0)

  // Plotly is heavy and browser-only, so it loads when the widget hydrates, never at build time.
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
    if (!ready) return
    const el = chartRef.current!
    const Plotly = plotly.current
    Plotly.react(el, ...figure(el.parentElement!, chart, notes, { title, height }))
    // A post's bar opens the post in a new tab. Registered once: Plotly keeps the element's handlers
    // across redraws.
    if (!(el as any).cgcLinks) {
      ;(el as any).cgcLinks = true
      const drag = () => el.querySelector<HTMLElement>(".nsewdrag")
      ;(el as any).on("plotly_click", (event: any) => {
        const url = urlOfPoint(event.points?.[0])
        if (url) window.open(url, "_blank", "noopener")
      })
      ;(el as any).on("plotly_hover", (event: any) => {
        const d = drag()
        if (d) d.style.cursor = urlOfPoint(event.points?.[0]) ? "pointer" : ""
      })
      ;(el as any).on("plotly_unhover", () => {
        const d = drag()
        if (d) d.style.cursor = ""
      })
    }
  }, [ready, chart, notes, scheme])

  return (
    <div class={wide ? "writing-stats wide" : "writing-stats"}>
      <div class="writing-stats__filters">
        <button type="button" class="writing-stats__chip" aria-pressed={withPrivate} onClick={() => setWithPrivate((on) => !on)}>
          private notes
        </button>
      </div>
      <div class="writing-stats__chart" ref={chartRef} style={{ minHeight: `${height}px` }} />
    </div>
  )
}

/**
 * How much there is to count: the words, sentences and paragraphs of every note the charts draw on,
 * public and private, with no cutoff. A table, not a chart, so it needs no Plotly.
 */
export function WritingTotals() {
  const groups = [
    { name: "Public", notes: NOTES.filter((n) => !n.private) },
    { name: "Private", notes: NOTES.filter((n) => n.private) },
    { name: "All", notes: NOTES },
  ]
  const rows: [string, (n: Note) => number][] = [
    ["Notes", () => 1],
    ["Words", (n) => n.words],
    ["Sentences", (n) => n.sentences.length],
    ["Paragraphs", (n) => n.paragraphWords.length],
  ]
  return (
    <table class="writing-totals">
      <thead>
        <tr>
          <th />
          {groups.map((g) => (
            <th scope="col">{g.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, count]) => (
          <tr>
            <th scope="row">{label}</th>
            {groups.map((g) => (
              <td>{fmt(sum(g.notes.map(count)), 0)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ---------------------------------------------------------------------------------------------
// Numbers

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const median = (xs: number[]) => {
  if (xs.length === 0) return NaN
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}
const perThousand = (count: number, words: number) => (words ? (count / words) * 1000 : NaN)
const fmt = (n: number, digits = 1) => (Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: digits }) : "—")
const dashesIn = (note: Note) => sum(DASH_KINDS.map((k) => note.dashes[k]))

// The charts by note put the notes side by side in the order they were written, each in a slot of
// its own, and never on a calendar: a calendar shows the gaps between them, which is not what they
// are about. A private note's slot is a fifth of a post's, so the posts read first and the private
// notes run between them as a texture.

const PRIVATE_SLOT = 0.2

interface Slot {
  start: number
  centre: number
  width: number
}

/** Each note's slot along the axis, in order, and where the last ends. */
function noteSlots(notes: Note[]): { slots: Slot[]; end: number } {
  let at = 0
  const slots = notes.map((n) => {
    const width = n.private ? PRIVATE_SLOT : 1
    const slot = { start: at, centre: at + width / 2, width }
    at += width
    return slot
  })
  return { slots, end: at }
}

/**
 * The axis of a chart by note, read as a calendar would be without its gaps: a labelled tick before
 * the first note of each year, and a small one before the first note of each other month. A year
 * whose label would crowd the one after it, where a year has few notes, keeps its tick unlabelled:
 * the later years, where most of the notes are, keep theirs.
 */
function noteAxis(notes: Note[], tickColour: string, plotWidth: number) {
  const { slots, end } = noteSlots(notes)
  const years: { x: number; year: string }[] = []
  const months: number[] = []
  notes.forEach((n, i) => {
    const previous = notes[i - 1]?.date
    if (previous?.slice(0, 4) !== n.date.slice(0, 4)) years.push({ x: slots[i]!.start, year: n.date.slice(0, 4) })
    else if (previous.slice(0, 7) !== n.date.slice(0, 7)) months.push(slots[i]!.start)
  })
  const room = 32 // pixels a year's label needs: a four-digit year is about 28 at 12px
  let nextLabel = Infinity
  const labels = [...years]
    .reverse()
    .map(({ x, year }) => {
      const px = (x / end) * plotWidth
      if (nextLabel - px < room) return ""
      nextLabel = px
      return year
    })
    .reverse()
  return {
    type: "linear",
    range: [0, end],
    tickmode: "array",
    tickvals: years.map((y) => y.x),
    ticktext: labels,
    ticks: "outside",
    ticklen: 8,
    tickcolor: tickColour,
    showgrid: false,
    minor: { tickmode: "array", tickvals: months, ticks: "outside", ticklen: 4, tickcolor: tickColour, showgrid: false },
  }
}

// ---------------------------------------------------------------------------------------------
// Plotly

/** Where a point on a chart by note carries its note's page: the last of its customdata. */
const URL_AT = 4
const urlOfPoint = (point: any): string | undefined => {
  const url = point?.customdata?.[URL_AT]
  return typeof url === "string" && url ? url : undefined
}

function figure(root: HTMLElement, chart: WritingChart, notes: Note[], options: { title?: string; height: number }) {
  const colour = (name: string) => skin(root, `--writing-stats-${name}`)
  const ink = colour("ink")
  const muted = colour("muted")
  const grid = colour("grid")
  const paper = colour("paper")
  const eraColour = (era: Era) => colour(`era-${ERAS.indexOf(era) + 1}`)
  const dashColour = (kind: DashKind) => colour(`dash-${kind}`)
  const top = options.title ? 48 : 16
  const legend = { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", font: { color: ink } }
  const layout: Record<string, any> = {
    // The title starts where the plot does, over the y-axis, not at the chart's edge.
    title: options.title ? { text: options.title, xref: "paper", x: 0, xanchor: "left", font: { size: 16 } } : undefined,
    height: options.height,
    paper_bgcolor: paper,
    plot_bgcolor: paper,
    font: { family: getComputedStyle(root).fontFamily, color: ink, size: 12 },
    margin: { t: top, r: 16, b: 48, l: 56 },
    // Room under the plot for its tick labels and axis title, however long they turn out.
    xaxis: { gridcolor: grid, linecolor: grid, zerolinecolor: grid, tickfont: { color: muted }, automargin: true },
    yaxis: { gridcolor: grid, linecolor: grid, zerolinecolor: grid, tickfont: { color: muted }, automargin: true },
    hoverlabel: { bgcolor: paper, bordercolor: grid, font: { color: ink } },
    showlegend: false,
    dragmode: false,
    bargap: 0.15,
    barcornerradius: 3,
  }
  const config = { responsive: true, displayModeBar: false }
  const axisTitle = (text: string) => ({ text, font: { color: muted } })
  const withLegend = { showlegend: true, legend, margin: { ...layout.margin, t: top + 28 } }

  // Where each era after the first starts, and each milestone falls, on a chart by note: a rule
  // before the first note in it, and its name. Each starts a period that runs to the next rule, and
  // its label gives the median, over the notes in that period, of what the chart plots for a note.
  const { slots, end } = noteSlots(notes)
  const firstFrom = (date: string) => notes.findIndex((n) => n.date >= date)
  const starts = [
    ...ERAS.slice(1).flatMap((era) => (era.from ? [{ label: era.label, first: firstFrom(era.from) }] : [])),
    ...MILESTONES.map((milestone) => ({ label: milestone.label, first: firstFrom(milestone.date) })),
  ]
    .filter((mark) => mark.first >= 0)
    .sort((a, b) => a.first - b.first)
  const periodMarks = (valueOf: (note: Note) => number) => ({
    shapes: starts.map(({ first }) => ({
      type: "line",
      x0: slots[first]!.start,
      x1: slots[first]!.start,
      y0: 0,
      y1: 1,
      yref: "paper",
      layer: "below",
      line: { color: muted, width: 1, dash: "dot" },
    })),
    // Each label two lines tall, the name and the median, and every other one lower, so that labels
    // side by side never collide.
    annotations: starts.map(({ label, first }, i) => {
      const x = slots[first]!.start
      const period = notes.slice(first, starts[i + 1]?.first ?? notes.length)
      // A note with nothing to measure, as one with no paragraphs, has no part in its period's median.
      const middle = median(period.map(valueOf).filter(Number.isFinite))
      // Beside its rule, on the side with more room: the left, in the chart's right half.
      const side = x > end / 2 ? "right" : "left"
      return {
        x,
        y: 1,
        yref: "paper",
        text: Number.isFinite(middle) ? `${label}<br>median ${fmt(middle)}` : label,
        align: side,
        showarrow: false,
        xanchor: side,
        yanchor: "top",
        xshift: side === "right" ? -4 : 4,
        yshift: (i % 2) * -32,
        font: { color: muted, size: 11 },
      }
    }),
  })

  // A note's median sentence, or median paragraph, as one bar a note, in the slots and with the rules
  // of the dash chart. Each bar takes its era's colour: one trace an era, so the legend names them.
  if (chart === "sentences-by-note" || chart === "paragraphs-by-note") {
    const sentences = chart === "sentences-by-note"
    const valueOf = (n: Note) => median(sentences ? n.sentences : n.paragraphWords)
    const counted = (n: Note) => (sentences ? n.sentences : n.paragraphWords).length
    const unit = sentences ? "sentence" : "paragraph"
    const traces = ERAS.map((era) => {
      const at = notes.flatMap((n, i) => (n.era === era.id ? [i] : []))
      return {
        type: "bar",
        name: era.label,
        x: at.map((i) => slots[i]!.centre),
        width: at.map((i) => slots[i]!.width * 0.9),
        y: at.map((i) => valueOf(notes[i]!)),
        customdata: at.map((i) => {
          const n = notes[i]!
          return [n.private ? `${n.title} (private)` : n.title, n.date, counted(n), n.words, n.url ?? ""]
        }),
        marker: { color: eraColour(era) },
        hovertemplate: `<b>%{customdata[0]}</b> · %{customdata[1]}<br>median ${unit}: %{y} words, of %{customdata[2]} ${unit}s<extra></extra>`,
      }
    }).filter((trace) => trace.x.length)
    return [
      traces,
      {
        ...layout,
        ...withLegend,
        legend: { ...legend, traceorder: "normal" },
        ...periodMarks(valueOf),
        barcornerradius: 0,
        xaxis: { ...layout.xaxis, ...noteAxis(notes, muted, root.clientWidth - 72) },
        yaxis: { ...layout.yaxis, rangemode: "tozero", title: axisTitle(`Median words per ${unit}`) },
      },
      config,
    ] as const
  }

  // dashes-by-note: stacked, so a note that mixes its dashes shows each, and a change of habit
  // shows as a change of colour along the notes.
  const traces = DASH_KINDS.map((kind) => ({
    type: "bar",
    name: DASH_NAMES[kind],
    x: slots.map((slot) => slot.centre),
    width: slots.map((slot) => slot.width * 0.9),
    y: notes.map((n) => perThousand(n.dashes[kind], n.words)),
    customdata: notes.map((n) => [n.private ? `${n.title} (private)` : n.title, n.date, n.dashes[kind], n.words, n.url ?? ""]),
    marker: { color: dashColour(kind) },
    hovertemplate: `<b>%{customdata[0]}</b> · %{customdata[1]}<br>${DASH_NAMES[kind]}: %{customdata[2]} in %{customdata[3]} words, %{y:.1f} per 1,000<extra></extra>`,
  }))
  return [
    traces,
    {
      ...layout,
      ...withLegend,
      legend: { ...legend, traceorder: "normal" },
      ...periodMarks((n) => perThousand(dashesIn(n), n.words)),
      barmode: "stack",
      barcornerradius: 0,
      xaxis: { ...layout.xaxis, ...noteAxis(notes, muted, root.clientWidth - 72) },
      yaxis: { ...layout.yaxis, title: axisTitle("Dashes per 1,000 words") },
    },
    config,
  ] as const
}
