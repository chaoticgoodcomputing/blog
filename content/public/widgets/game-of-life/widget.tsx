// Conway's Game of Life, as a cgc-mdx island: drawn at build time, run in the browser.
//
// Ported from v4's component.tsx and script.inline.ts beside this file, which Quartz 4 reads until
// cutover. The simulation is the same; the canvas takes its colours from the theme (widget.css).
import { useEffect, useRef } from "preact/hooks"
import { onSchemeChange, skin } from "../scheme"
import "./widget.css"

type Grid = number[][]

export interface GameOfLifeProps {
  /** Rows of 0 (dead) and 1 (live) cells, centred horizontally. Defaults to a pulsar. */
  initialState?: Grid
  /** Blank rows above and below the initial state. */
  verticalPadding?: number
  /** Canvas height in pixels. */
  height?: number
  /** Seconds between generations. */
  secondsPerFrame?: number
}

// A pulsar: a period-3 oscillator.
const PULSAR: Grid = [
  [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
]

/** The pattern centred in a blank grid of `rows` × `cols`, `padding` rows down. */
function seed(pattern: Grid, rows: number, cols: number, padding: number): Grid {
  const grid = Array.from({ length: rows }, () => new Array<number>(cols).fill(0))
  const left = Math.floor((cols - pattern[0].length) / 2)
  pattern.forEach((row, i) =>
    row.forEach((cell, j) => {
      if (grid[padding + i] && left + j >= 0 && left + j < cols) grid[padding + i][left + j] = cell
    }),
  )
  return grid
}

/** One generation: a live cell with two or three neighbours lives, a dead one with three is born. */
function step(grid: Grid): Grid {
  return grid.map((row, i) =>
    row.map((cell, j) => {
      let n = 0
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) if ((di || dj) && grid[i + di]?.[j + dj]) n++
      return (cell ? n === 2 || n === 3 : n === 3) ? 1 : 0
    }),
  )
}

export function GameOfLife({ initialState = PULSAR, verticalPadding = 5, height = 300, secondsPerFrame = 0.1 }: GameOfLifeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resetRef = useRef(() => {})

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const rows = initialState.length + 2 * verticalPadding
    const cell = height / rows
    let cols = 0
    let grid: Grid = []
    let colours = { paper: "", grid: "", live: "" }
    const root = canvas.parentElement!
    const readColours = () => {
      colours = { paper: skin(root, "--game-of-life-paper"), grid: skin(root, "--game-of-life-grid"), live: skin(root, "--game-of-life-live") }
    }

    const draw = () => {
      ctx.fillStyle = colours.paper
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = colours.grid
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let j = 0; j <= cols; j++) {
        ctx.moveTo(j * cell, 0)
        ctx.lineTo(j * cell, canvas.height)
      }
      for (let i = 0; i <= rows; i++) {
        ctx.moveTo(0, i * cell)
        ctx.lineTo(canvas.width, i * cell)
      }
      ctx.stroke()
      ctx.fillStyle = colours.live
      grid.forEach((row, i) => row.forEach((alive, j) => alive && ctx.fillRect(j * cell + 1, i * cell + 1, cell - 2, cell - 2)))
    }
    // As wide as the column, keeping what is alive when the column changes width.
    const resize = () => {
      const next = Math.ceil(root.clientWidth / cell)
      if (Math.abs(next - cols) > 1) {
        grid = cols ? grid.map((row) => Array.from({ length: next }, (_, j) => row[j] ?? 0)) : seed(initialState, rows, next, verticalPadding)
        cols = next
      }
      canvas.width = cols * cell
      canvas.height = rows * cell
      draw()
    }
    const toggle = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const [i, j] = [Math.floor((e.clientY - rect.top) / cell), Math.floor((e.clientX - rect.left) / cell)]
      if (grid[i]?.[j] !== undefined) grid[i][j] ^= 1
      draw()
    }
    resetRef.current = () => {
      grid = seed(initialState, rows, cols, verticalPadding)
      draw()
    }

    readColours()
    const observer = new ResizeObserver(resize)
    observer.observe(root)
    resize()
    canvas.addEventListener("click", toggle)
    const timer = setInterval(() => {
      grid = step(grid)
      draw()
    }, secondsPerFrame * 1000)
    const stopWatching = onSchemeChange(() => {
      readColours()
      draw()
    })

    return () => {
      clearInterval(timer)
      observer.disconnect()
      canvas.removeEventListener("click", toggle)
      stopWatching()
    }
  }, [])

  return (
    <div class="game-of-life">
      <button class="game-of-life__reset" type="button" title="Reset to initial state" onClick={() => resetRef.current()}>
        ↻
      </button>
      <canvas class="game-of-life__canvas" ref={canvasRef} height={height} />
    </div>
  )
}
