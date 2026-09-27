// Conway's Game of Life as a quartz-mdx island: plain Preact on both sides, no Quartz events.
// Ported from content/public/widgets/game-of-life, which split the same logic across a build-time
// component and an imperative `.inline.ts` script that found its element by selector.
import { useEffect, useRef } from "preact/hooks"
import "./life.css"

type Grid = number[][]

export interface GameOfLifeProps {
  /** Rows of 0/1 cells, centred horizontally. Defaults to a pulsar. */
  initialState?: Grid
  /** Blank rows above and below the initial state. */
  verticalPadding?: number
  /** Canvas height in pixels. */
  height?: number
  /** Seconds between generations. */
  secondsPerFrame?: number
}

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

const blank = (rows: number, cols: number): Grid => Array.from({ length: rows }, () => new Array(cols).fill(0))

function seed(pattern: Grid, rows: number, cols: number, padding: number): Grid {
  const grid = blank(rows, cols)
  const left = Math.floor((cols - pattern[0].length) / 2)
  pattern.forEach((row, i) =>
    row.forEach((cell, j) => {
      if (grid[padding + i] && left + j >= 0 && left + j < cols) grid[padding + i][left + j] = cell
    }),
  )
  return grid
}

function step(grid: Grid): Grid {
  return grid.map((row, i) =>
    row.map((cell, j) => {
      let n = 0
      for (let di = -1; di <= 1; di++)
        for (let dj = -1; dj <= 1; dj++) if ((di || dj) && grid[i + di]?.[j + dj]) n++
      return (cell ? n === 2 || n === 3 : n === 3) ? 1 : 0
    }),
  )
}

export function GameOfLife({ initialState = PULSAR, verticalPadding = 5, height = 300, secondsPerFrame = 0.1 }: GameOfLifeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resetRef = useRef<() => void>(() => {})

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const rows = initialState.length + 2 * verticalPadding
    const cell = height / rows
    let cols = 0
    let grid: Grid = []

    // Skin comes from custom properties (ADR-0003), read at draw time so a theme switch applies.
    const draw = () => {
      const style = getComputedStyle(canvas)
      ctx.fillStyle = style.getPropertyValue("--life-dead").trim() || "#fff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = style.getPropertyValue("--life-live").trim() || "#000"
      grid.forEach((row, i) => row.forEach((alive, j) => alive && ctx.fillRect(j * cell + 1, i * cell + 1, cell - 2, cell - 2)))
    }
    const resize = () => {
      const next = Math.ceil((canvas.parentElement?.clientWidth ?? 0) / cell)
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

    const observer = new ResizeObserver(resize)
    if (canvas.parentElement) observer.observe(canvas.parentElement)
    resize()
    canvas.addEventListener("click", toggle)
    const timer = setInterval(() => {
      grid = step(grid)
      draw()
    }, secondsPerFrame * 1000)

    return () => {
      clearInterval(timer)
      observer.disconnect()
      canvas.removeEventListener("click", toggle)
    }
  }, [])

  return (
    <div class="life">
      <button class="life__reset" title="Reset to initial state" onClick={() => resetRef.current()}>
        ↻
      </button>
      <canvas class="life__canvas" ref={canvasRef} height={height} />
    </div>
  )
}
