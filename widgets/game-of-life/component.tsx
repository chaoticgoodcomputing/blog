import { JSX } from "preact"

/**
 * Props for the Game of Life widget.
 */
export interface GameOfLifeProps {
  /**
   * 2D array of integers (0 or 1) representing the initial state.
   * 1 = live cell, 0 = dead cell.
   */
  initialState?: number[][]

  /**
   * Number of blank rows to add above and below the initial state.
   * @default 5
   */
  verticalPadding?: number

  /**
   * Height of the simulation canvas in pixels.
   * @default 300
   */
  height?: number

  /**
   * Time between simulation updates, in seconds.
   * @default 0.1
   */
  secondsPerFrame?: number
}

/**
 * Game of Life widget - displays Conway's Game of Life simulation.
 * 
 * Implements a simple version of Conway's Game of Life that starts with
 * a specified pattern and evolves according to the classic rules:
 * - Any live cell with 2-3 neighbors survives
 * - Any dead cell with exactly 3 neighbors becomes alive
 * - All other cells die or stay dead
 * 
 * @example
 * ```mdx
 * import { GameOfLife } from '@content/widgets/game-of-life'
 * 
 * <GameOfLife 
 *   initialState={[[0,1,0], [0,0,1], [1,1,1]]}
 *   verticalPadding={5}
 *   height={300}
 *   secondsPerFrame={0.1}
 * />
 * ```
 */
export function GameOfLife(props: GameOfLifeProps): JSX.Element {
  // Default: Pulsar - a beautiful period-3 oscillator
  const pulsarPattern = [
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

  const {
    initialState = pulsarPattern,
    verticalPadding = 5,
    height = 300,
    secondsPerFrame = 0.1,
  } = props

  // Serialize the initial state for the client script
  const config = {
    initialState,
    verticalPadding,
    height,
    secondsPerFrame,
  }

  return (
    <div
      class="widget-game-of-life"
      data-widget="game-of-life"
      data-config={JSON.stringify(config)}
    >
      <div class="game-of-life-controls">
        <button class="game-of-life-refresh" title="Reset to initial state">↻</button>
      </div>
      <canvas class="game-of-life-canvas"></canvas>
    </div>
  )
}
