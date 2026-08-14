/**
 * Client-side script for Game of Life widget.
 * 
 * Implements Conway's Game of Life simulation on a canvas element.
 */

// === Widget Script Helper (inlined to avoid import issues) ===
interface WidgetScriptConfig {
  selector: string
  initialize: (element: HTMLElement) => (() => void) | void
}

function createWidgetScript(config: WidgetScriptConfig) {
  const cleanupHandlers = new WeakMap<HTMLElement, () => void>()
  
  function cleanupInstance(element: HTMLElement): void {
    const cleanup = cleanupHandlers.get(element)
    if (cleanup) {
      cleanup()
      cleanupHandlers.delete(element)
    }
  }
  
  function initializeAll(): void {
    const elements = document.querySelectorAll<HTMLElement>(config.selector)
    elements.forEach((element) => {
      cleanupInstance(element)
      const cleanup = config.initialize(element)
      if (cleanup) cleanupHandlers.set(element, cleanup)
    })
  }
  
  return {
    start() {
      document.addEventListener("nav", initializeAll)
      window.addEventListener("load", initializeAll)
      window.addCleanup(() => {
        document.removeEventListener("nav", initializeAll)
        window.removeEventListener("load", initializeAll)
      })
      initializeAll()
    }
  }
}
// === End Widget Script Helper ===

interface GameOfLifeConfig {
  initialState: number[][]
  verticalPadding: number
  height: number
  secondsPerFrame: number
}

type Grid = number[][]

/**
 * Game of Life simulation class
 */
class GameOfLife {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private grid: Grid
  private initialGrid: Grid = [] // Store initial state for reset
  private rows: number
  private cols: number
  private cellSize: number
  private intervalId: number | null = null
  private config: GameOfLifeConfig
  private resizeObserver: ResizeObserver | null = null

  constructor(canvas: HTMLCanvasElement, config: GameOfLifeConfig) {
    this.canvas = canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not get 2D context")
    this.ctx = ctx
    this.config = config
    
    // Calculate dimensions
    const initialStateHeight = config.initialState.length
    const totalHeight = initialStateHeight + 2 * config.verticalPadding
    this.cellSize = config.height / totalHeight
    
    // Initialize with parent width
    this.cols = 0
    this.rows = totalHeight
    this.grid = []
    
    // Setup resize observer
    this.setupResizeObserver()
    
    // Initial setup
    this.updateDimensions()
    this.initializeGrid()
    this.saveInitialState()
    this.draw()
    this.start()
    
    // Setup click handler
    this.setupClickHandler()
  }
  
  private saveInitialState(): void {
    this.initialGrid = this.grid.map(row => [...row])
  }
  
  public reset(): void {
    this.stop()
    this.grid = this.initialGrid.map(row => [...row])
    this.draw()
    this.start()
  }
  
  private setupClickHandler(): void {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const col = Math.floor(x / this.cellSize)
      const row = Math.floor(y / this.cellSize)
      
      if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
        this.grid[row][col] = this.grid[row][col] === 1 ? 0 : 1
        this.draw()
      }
    })
  }
  
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.updateDimensions()
      this.draw()
    })
    
    if (this.canvas.parentElement) {
      this.resizeObserver.observe(this.canvas.parentElement)
    }
  }
  
  private updateDimensions(): void {
    const parent = this.canvas.parentElement
    if (!parent) return
    
    const parentWidth = parent.clientWidth
    const newCols = Math.ceil(parentWidth / this.cellSize)
    
    // Only reinitialize if columns changed significantly
    if (Math.abs(newCols - this.cols) > 1) {
      const oldGrid = this.grid
      this.cols = newCols
      
      // Preserve grid state if resizing
      if (oldGrid.length > 0) {
        this.preserveGridState(oldGrid)
      } else {
        this.initializeGrid()
      }
    }
    
    // Update canvas dimensions
    this.canvas.width = this.cols * this.cellSize
    this.canvas.height = this.rows * this.cellSize
  }
  
  private preserveGridState(oldGrid: Grid): void {
    const newGrid: Grid = []
    for (let i = 0; i < this.rows; i++) {
      newGrid[i] = []
      for (let j = 0; j < this.cols; j++) {
        // Copy old state if within bounds, otherwise dead cell
        newGrid[i][j] = (oldGrid[i] && oldGrid[i][j]) || 0
      }
    }
    this.grid = newGrid
  }
  
  private initializeGrid(): void {
    // Create empty grid
    this.grid = []
    for (let i = 0; i < this.rows; i++) {
      this.grid[i] = []
      for (let j = 0; j < this.cols; j++) {
        this.grid[i][j] = 0
      }
    }
    
    // Place initial state in the center
    const initialState = this.config.initialState
    const startRow = this.config.verticalPadding
    const startCol = Math.floor((this.cols - initialState[0].length) / 2)
    
    for (let i = 0; i < initialState.length; i++) {
      for (let j = 0; j < initialState[i].length; j++) {
        const row = startRow + i
        const col = startCol + j
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
          this.grid[row][col] = initialState[i][j]
        }
      }
    }
  }
  
  private countNeighbors(row: number, col: number): number {
    let count = 0
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue
        
        const newRow = row + i
        const newCol = col + j
        
        // Check bounds
        if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
          count += this.grid[newRow][newCol]
        }
      }
    }
    return count
  }
  
  private update(): void {
    const newGrid: Grid = []
    
    for (let i = 0; i < this.rows; i++) {
      newGrid[i] = []
      for (let j = 0; j < this.cols; j++) {
        const neighbors = this.countNeighbors(i, j)
        const cell = this.grid[i][j]
        
        // Conway's Game of Life rules
        if (cell === 1) {
          // Live cell
          newGrid[i][j] = (neighbors === 2 || neighbors === 3) ? 1 : 0
        } else {
          // Dead cell
          newGrid[i][j] = (neighbors === 3) ? 1 : 0
        }
      }
    }
    
    this.grid = newGrid
  }
  
  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = "#ffffff"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Draw grid lines
    this.ctx.strokeStyle = "#e0e0e0"
    this.ctx.lineWidth = 1
    
    // Vertical lines
    for (let i = 0; i <= this.cols; i++) {
      const x = i * this.cellSize
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.canvas.height)
      this.ctx.stroke()
    }
    
    // Horizontal lines
    for (let i = 0; i <= this.rows; i++) {
      const y = i * this.cellSize
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.canvas.width, y)
      this.ctx.stroke()
    }
    
    // Draw cells
    this.ctx.fillStyle = "#000000"
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (this.grid[i][j] === 1) {
          this.ctx.fillRect(
            j * this.cellSize + 1,
            i * this.cellSize + 1,
            this.cellSize - 2,
            this.cellSize - 2
          )
        }
      }
    }
  }
  
  private start(): void {
    const intervalMs = this.config.secondsPerFrame * 1000
    this.intervalId = window.setInterval(() => {
      this.update()
      this.draw()
    }, intervalMs)
  }
  
  public stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  }
}

const gameOfLifeWidget = createWidgetScript({
  selector: ".widget-game-of-life",
  initialize: (element) => {
    const canvas = element.querySelector<HTMLCanvasElement>(".game-of-life-canvas")
    if (!canvas) return
    
    const configStr = element.getAttribute("data-config")
    if (!configStr) return
    
    let config: GameOfLifeConfig
    try {
      config = JSON.parse(configStr)
    } catch (e) {
      console.error("Failed to parse game-of-life config:", e)
      return
    }
    
    const game = new GameOfLife(canvas, config)
    
    // Setup refresh button
    const refreshBtn = element.querySelector<HTMLButtonElement>(".game-of-life-refresh")
    if (refreshBtn) {
      const handleRefresh = () => game.reset()
      refreshBtn.addEventListener('click', handleRefresh)
      
      return () => {
        game.stop()
        refreshBtn.removeEventListener('click', handleRefresh)
      }
    }
    
    return () => {
      game.stop()
    }
  }
})

gameOfLifeWidget.start()
