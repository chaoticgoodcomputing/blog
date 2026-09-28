// The debug panel (the `debugPanel` option): every graph setting as a control, beside the global
// graph in its dialog, for trying settings on the page. A switch picks which graph's settings it
// edits, the global graph's or the local graph's, and the dialog draws that graph: the local one
// around the current page, as the page's layout would. Every change draws the graph afresh, as the
// filters do. Below the controls, both graphs' settings as YAML, where they differ from the plugin's
// defaults: a site config's `localGraph` and `globalGraph`, to paste in place of its own.
//
// The edits last until the page reloads, so the dialog can close and open again, and the reader can
// navigate, without losing them.
import {
  DEFAULT_GLOBAL,
  DEFAULT_LOCAL,
  EDGE_KINDS,
  GRAPH_STYLES,
  LINE_STYLES,
  NODE_KINDS,
  SHELL_DEFAULTS,
  isMap,
  type ContainerConfig,
  type GraphConfig,
} from "../options"
import { element } from "./dom"
import type { FilterState } from "./graph-data"
import { settingsOf } from "./settings"

type Mode = "global" | "local"
type Config = Record<string, any>

/** A control's kind: a number in a range, a switch, one of a few words, a list of tags, a colour. */
type Control =
  | { kind: "number"; min: number; max: number; step: number }
  | { kind: "boolean" }
  | { kind: "word"; words: readonly string[] }
  | { kind: "tags" }
  | { kind: "colour" }

interface Field {
  /** The setting's path in a graph's settings, as the site config writes it. */
  path: string[]
  control: Control
}

const number = (min: number, max: number, step: number): Control => ({
  kind: "number",
  min,
  max,
  step,
})
const field = (path: string, control: Control): Field => ({ path: path.split("."), control })
const perEdge = (setting: string, control: Control) =>
  EDGE_KINDS.map((kind) => field(`${setting}.${kind}`, control))
const perNode = (setting: string, control: Control) =>
  NODE_KINDS.map((kind) => field(`${setting}.${kind}`, control))

// Every setting of a graph, but `defaultFilterState`, which only sets the filters the dialog already
// shows. Each number's range is a guide: a value outside it widens it.
const GROUPS: [string, Field[]][] = [
  [
    "Layout",
    [
      field("depth", number(-1, 5, 1)),
      field("scale", number(0.1, 3, 0.05)),
      field("repelForce", number(0, 10, 0.1)),
      field("centerForce", number(0, 3, 0.05)),
      field("enableRadial", { kind: "boolean" }),
      field("graphStyle", { kind: "word", words: GRAPH_STYLES }),
    ],
  ],
  [
    "Edges",
    [
      ...perEdge("linkDistance", number(0, 200, 1)),
      ...perEdge("linkStrength", number(0, 3, 0.05)),
      ...EDGE_KINDS.flatMap((kind) => [
        field(`edgeOpacity.${kind}.min`, number(0, 1, 0.05)),
        field(`edgeOpacity.${kind}.max`, number(0, 1, 0.05)),
      ]),
      ...perEdge("linkStyle", { kind: "word", words: LINE_STYLES }),
    ],
  ],
  [
    "Nodes",
    [
      ...perNode("baseSize", number(0, 30, 0.5)),
      ...perNode("sizeScaling", number(0, 5, 0.1)),
      field("privatePostSizeMultiplier", number(0, 3, 0.05)),
      field("expandSelectedSize", number(1, 3, 0.05)),
      field("expandSelectedOscillationTime", number(0.1, 10, 0.1)),
    ],
  ],
  ["Labels", [field("fontSize", number(0.1, 2, 0.05)), field("opacityScale", number(0, 5, 0.1))]],
  [
    "Behaviour",
    [
      field("drag", { kind: "boolean" }),
      field("zoom", { kind: "boolean" }),
      field("showTags", { kind: "boolean" }),
      field("focusOnHover", { kind: "boolean" }),
      field("removeTags", { kind: "tags" }),
    ],
  ],
  [
    "Colours",
    [
      field("nodeColors.public", { kind: "colour" }),
      field("nodeColors.private", { kind: "colour" }),
    ],
  ],
  [
    "Pseudo-shell",
    [
      field("pseudoShellConfig.pinnedTags", { kind: "tags" }),
      field("pseudoShellConfig.radiusBase", number(0, 1000, 10)),
      field("pseudoShellConfig.radiusScale", number(0, 20, 0.1)),
      field("pseudoShellConfig.showShell", { kind: "boolean" }),
      field("pseudoShellConfig.zoomMargin", number(0, 300, 5)),
      field("pseudoShellConfig.circumferentialRepulsion", number(0, 5, 0.05)),
      field("pseudoShellConfig.shellStyle.color", { kind: "colour" }),
      field("pseudoShellConfig.shellStyle.opacity", number(0, 1, 0.05)),
      field("pseudoShellConfig.shellStyle.lineStyle", { kind: "word", words: LINE_STYLES }),
      field("pseudoShellConfig.shellStyle.lineWidth", number(0, 10, 0.5)),
    ],
  ],
]

// The keys a container's settings carry that are no graph setting: the site's option, and which
// graph it is.
const NOT_SETTINGS = ["privateTags", "global"]

/**
 * A graph's settings with every shorthand spelled out and every setting present, so each control has
 * a value to show: a number for every kind becomes a map by kind, and the pseudo-shell's settings take
 * their defaults, as `settingsOf` fills them when it draws.
 */
function spelledOut(cfg: ContainerConfig): Config {
  const settings = settingsOf(cfg)
  const shell = cfg.pseudoShellConfig
  return structuredClone({
    ...cfg,
    focusOnHover: settings.focusOnHover,
    enableRadial: settings.enableRadial,
    graphStyle: settings.graphStyle,
    linkDistance: settings.linkDistance,
    linkStrength: settings.linkStrength,
    edgeOpacity: settings.edgeOpacity,
    baseSize: settings.baseSize,
    sizeScaling: settings.sizeScaling,
    linkStyle: settings.linkStyle,
    nodeColors: { ...cfg.nodeColors },
    privatePostSizeMultiplier: settings.privatePostSizeMultiplier,
    expandSelectedSize: settings.expandSelectedSize,
    expandSelectedOscillationTime: settings.expandSelectedOscillationTime,
    pseudoShellConfig: {
      ...SHELL_DEFAULTS,
      ...shell,
      shellStyle: { ...SHELL_DEFAULTS.shellStyle, ...shell?.shellStyle },
    },
  })
}

const getIn = (config: Config, path: string[]) => path.reduce((at, key) => at?.[key], config)

function setIn(config: Config, path: string[], value: unknown) {
  const parent = path.slice(0, -1).reduce((at, key) => (at[key] ??= {}), config)
  const key = path[path.length - 1]
  if (value === undefined) delete parent[key]
  else parent[key] = value
}

/** What `value` changes from `baseline`: the keys of a map that differ, or the value itself. */
function changes(value: unknown, baseline: unknown): unknown {
  if (isMap(value) && isMap(baseline)) {
    const changed = Object.entries(value)
      .map(([key, v]) => [key, changes(v, baseline[key])] as const)
      .filter(([, v]) => v !== undefined)
    return changed.length > 0 ? Object.fromEntries(changed) : undefined
  }
  return JSON.stringify(value) === JSON.stringify(baseline) ? undefined : value
}

// A slider's steps add up in floating point: 0.1 + 0.2 is 0.30000000000000004.
const tidy = (value: number) => Number(value.toFixed(4))

// YAML, for the handful of shapes a graph's settings take. A string is written JSON-quoted, which
// YAML reads as it is, so a colour such as `var(--secondary)` needs no rules of its own.
function yamlLines(key: string, value: unknown, indent: string): string[] {
  const scalar = (v: unknown) => (typeof v === "string" ? JSON.stringify(v) : String(v))
  if (Array.isArray(value))
    return value.length === 0
      ? [`${indent}${key}: []`]
      : [`${indent}${key}:`, ...value.map((item) => `${indent}  - ${scalar(item)}`)]
  if (isMap(value))
    return [
      `${indent}${key}:`,
      ...Object.entries(value).flatMap(([k, v]) => yamlLines(k, v, `${indent}  `)),
    ]
  return [`${indent}${key}: ${scalar(value)}`]
}

const OPTION: Record<Mode, string> = { local: "localGraph", global: "globalGraph" }
const DEFAULTS: Record<Mode, GraphConfig> = { local: DEFAULT_LOCAL, global: DEFAULT_GLOBAL }

/** Both graphs' settings, where they differ from the plugin's defaults, as a site config writes them. */
function yamlOf(configs: Record<Mode, Config>): string {
  const lines = (["local", "global"] as const).flatMap((mode) => {
    const config = configs[mode]
    const baseline = spelledOut({
      ...DEFAULTS[mode],
      privateTags: config.privateTags,
      global: mode === "global",
    })
    const settings = Object.fromEntries(
      Object.entries(config).filter(([key]) => !NOT_SETTINGS.includes(key)),
    )
    const changed = changes(settings, baseline)
    return changed === undefined ? [] : yamlLines(OPTION[mode], changed, "")
  })
  return lines.length > 0 ? lines.join("\n") : "# Every setting is the plugin's default."
}

export interface DebugState {
  mode: Mode
  configs: Record<Mode, Config>
  /** The groups of controls the reader has open, by name, so they stay open when the graph switches. */
  open: Set<string>
  /** The global graph's filters as the reader last set them, kept from one draw to the next. */
  filters?: FilterState
}

/** The panel's state, from the settings both graphs' containers carry. */
export function debugStateOf(local: ContainerConfig, global: ContainerConfig): DebugState {
  return {
    mode: "global",
    configs: { local: spelledOut(local), global: spelledOut(global) },
    open: new Set([GROUPS[0][0]]),
  }
}

// How long a slider rests before the graph is drawn again: each draw lays the graph out afresh.
const SETTLE_MS = 150

/**
 * The panel, added to `dialog` beside the graph. It draws the graph once as it opens, and again,
 * through `draw`, after every change: `fresh` as it opens and when it switches graphs, when the graph
 * drawn is laid out anew; otherwise from the graph drawn last, which the change resettles. Returns its
 * removal.
 */
export function debugPanel(
  dialog: HTMLDialogElement,
  state: DebugState,
  draw: (cfg: ContainerConfig, fresh: boolean) => void,
): () => void {
  const panel = element("aside", "cgc-graph__debug")
  panel.setAttribute("aria-label", "Graph settings")

  const modes = element("fieldset", "cgc-graph__debug-modes")
  modes.append(element("legend", "cgc-graph__debug-legend", "Graph"))
  for (const mode of ["global", "local"] as const) {
    const label = element("label", "cgc-graph__debug-mode")
    const radio = element("input", "cgc-graph__debug-radio")
    Object.assign(radio, { type: "radio", name: "cgc-graph-debug-mode", value: mode })
    radio.checked = state.mode === mode
    radio.addEventListener("change", () => {
      state.mode = mode
      renderControls()
      drawNow(true)
    })
    label.append(
      radio,
      element("span", "cgc-graph__debug-mode-name", mode === "global" ? "Global" : "Local"),
    )
    modes.append(label)
  }

  const controls = element("div", "cgc-graph__debug-controls")
  const yaml = element("textarea", "cgc-graph__debug-yaml")
  yaml.readOnly = true
  yaml.rows = 8
  yaml.setAttribute("aria-label", "Settings as YAML")
  const copy = element("button", "cgc-graph__debug-copy", "Copy as YAML")
  copy.type = "button"
  const status = element("span", "cgc-graph__debug-status")
  status.setAttribute("role", "status")
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(yaml.value)
      status.textContent = "Copied"
    } catch {
      // No clipboard, as over plain http: the YAML is selected, to copy by hand.
      yaml.select()
      status.textContent = "Select and copy the YAML below"
    }
  })
  const output = element("div", "cgc-graph__debug-output")
  output.append(copy, status, yaml)

  panel.append(element("h2", "cgc-graph__debug-title", "Graph settings"), modes, controls, output)
  dialog.append(panel)

  const config = () => state.configs[state.mode]
  const drawNow = (fresh = false) => {
    yaml.value = yamlOf(state.configs)
    status.textContent = ""
    draw(config() as ContainerConfig, fresh)
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  const drawSoon = () => {
    clearTimeout(timer)
    timer = setTimeout(() => drawNow(), SETTLE_MS)
  }

  function control({ path, control }: Field): HTMLElement {
    const name = path.join(".")
    const row = element("label", "cgc-graph__debug-field")
    row.append(element("span", "cgc-graph__debug-name", name))
    const value = getIn(config(), path)
    const set = (v: unknown) => setIn(config(), path, v)

    if (control.kind === "boolean") {
      const box = element("input", "cgc-graph__debug-input")
      box.type = "checkbox"
      box.checked = Boolean(value)
      box.addEventListener("change", () => (set(box.checked), drawNow()))
      row.append(box)
    } else if (control.kind === "word") {
      const select = element("select", "cgc-graph__debug-input cgc-graph__debug-text")
      for (const word of control.words) select.append(new Option(word, word))
      select.value = String(value)
      select.addEventListener("change", () => (set(select.value), drawNow()))
      row.append(select)
    } else if (control.kind === "tags" || control.kind === "colour") {
      // Tags as the graph index writes them, `writing/essays`, one after another with commas; a
      // colour as the site config writes one, or nothing, for the graph's own.
      const text = element("input", "cgc-graph__debug-input cgc-graph__debug-text")
      text.type = "text"
      text.value =
        control.kind === "tags" ? ((value ?? []) as string[]).join(", ") : String(value ?? "")
      text.placeholder = control.kind === "tags" ? "tag, tag/subtag" : "none"
      text.addEventListener("change", () => {
        if (control.kind === "tags") {
          set(
            text.value
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          )
        } else {
          const colour = text.value.trim()
          // A colour CSS can't read would paint nothing: it is left as it was.
          if (colour !== "" && !CSS.supports("color", colour)) {
            text.setAttribute("aria-invalid", "true")
            text.classList.add("cgc-graph__debug-input--invalid")
            return
          }
          text.removeAttribute("aria-invalid")
          text.classList.remove("cgc-graph__debug-input--invalid")
          set(colour === "" ? undefined : colour)
        }
        drawNow()
      })
      row.append(text)
    } else {
      const current = Number(value)
      const slider = element("input", "cgc-graph__debug-slider")
      Object.assign(slider, {
        type: "range",
        min: String(Math.min(control.min, current)),
        max: String(Math.max(control.max, current)),
        step: String(control.step),
      })
      slider.value = String(current)
      slider.setAttribute("aria-label", `${name} slider`)
      const box = element("input", "cgc-graph__debug-input cgc-graph__debug-number")
      Object.assign(box, { type: "number", step: String(control.step) })
      box.value = String(current)
      // The row's label names the slider, its first input, so the box is named as well.
      box.setAttribute("aria-label", name)
      const take = (from: HTMLInputElement, to: HTMLInputElement) => {
        const v = Number(from.value)
        if (from.value === "" || Number.isNaN(v)) return
        to.value = String(v)
        set(tidy(v))
        drawSoon()
      }
      slider.addEventListener("input", () => take(slider, box))
      box.addEventListener("input", () => take(box, slider))
      row.append(slider, box)
    }
    return row
  }

  function renderControls() {
    controls.replaceChildren(
      ...GROUPS.map(([name, fields]) => {
        const group = element("details", "cgc-graph__debug-group")
        group.open = state.open.has(name)
        group.addEventListener("toggle", () =>
          group.open ? state.open.add(name) : state.open.delete(name),
        )
        group.append(element("summary", "cgc-graph__debug-summary", name), ...fields.map(control))
        return group
      }),
    )
  }

  renderControls()
  drawNow(true)
  return () => {
    clearTimeout(timer)
    panel.remove()
  }
}
