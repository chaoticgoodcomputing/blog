/**
 * Client-side script for Probability Convolutions widget.
 * 
 * Implements:
 * - Dice notation parser (d20, 2d6, adv(d20), etc.)
 * - Probability distribution calculations
 * - Plotly.js integration for visualization
 * - Real-time input updates
 */

// @ts-ignore - Plotly types may not be available at build time
import Plotly from "plotly.js-dist-min"

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

interface WidgetConfig {
  expression: string
  height: number
  asPercentage: boolean
  title?: string
  showThreshold?: boolean
  initialThreshold?: number
}

// === Probability Distribution ===

/**
 * Represents a discrete probability distribution.
 * Maps outcome values to their probabilities.
 */
class Distribution {
  private probs: Map<number, number>

  constructor(probs: Map<number, number> = new Map()) {
    this.probs = new Map(probs)
    this.normalize()
  }

  private normalize(): void {
    const total = Array.from(this.probs.values()).reduce((sum, p) => sum + p, 0)
    if (total > 0 && Math.abs(total - 1) > 1e-10) {
      for (const [k, v] of this.probs.entries()) {
        this.probs.set(k, v / total)
      }
    }
  }

  get(value: number): number {
    return this.probs.get(value) || 0
  }

  set(value: number, prob: number): void {
    if (prob > 0) {
      this.probs.set(value, prob)
    } else {
      this.probs.delete(value)
    }
  }

  values(): number[] {
    return Array.from(this.probs.keys()).sort((a, b) => a - b)
  }

  entries(): [number, number][] {
    return Array.from(this.probs.entries()).sort((a, b) => a[0] - b[0])
  }

  /** Calculate the mean (expected value) */
  mean(): number {
    let sum = 0
    for (const [value, prob] of this.probs.entries()) {
      sum += value * prob
    }
    return sum
  }

  /** Calculate the median */
  median(): number {
    const sorted = this.entries()
    let cumulative = 0
    for (const [value, prob] of sorted) {
      cumulative += prob
      if (cumulative >= 0.5) {
        return value
      }
    }
    return sorted[sorted.length - 1]?.[0] || 0
  }

  /** Calculate cumulative probability P(X <= threshold) */
  cdf(threshold: number): number {
    let cumulative = 0
    for (const [value, prob] of this.probs.entries()) {
      if (value <= threshold) {
        cumulative += prob
      }
    }
    return cumulative
  }

  /** Create a uniform distribution over [min, max] */
  static uniform(min: number, max: number): Distribution {
    const dist = new Distribution()
    const prob = 1 / (max - min + 1)
    for (let i = min; i <= max; i++) {
      dist.set(i, prob)
    }
    return dist
  }

  /** Shift all values by a constant */
  shift(amount: number): Distribution {
    const result = new Distribution()
    for (const [value, prob] of this.probs.entries()) {
      result.set(value + amount, prob)
    }
    return result
  }

  /** Scale all values by a constant */
  scale(factor: number): Distribution {
    const result = new Distribution()
    for (const [value, prob] of this.probs.entries()) {
      result.set(value * factor, prob)
    }
    return result
  }

  /** Convolve two distributions (sum of independent random variables) */
  static convolve(a: Distribution, b: Distribution): Distribution {
    const result = new Distribution()
    for (const [aVal, aProb] of a.entries()) {
      for (const [bVal, bProb] of b.entries()) {
        const sum = aVal + bVal
        result.set(sum, result.get(sum) + aProb * bProb)
      }
    }
    return result
  }

  /** Maximum of two distributions */
  static max(a: Distribution, b: Distribution): Distribution {
    const result = new Distribution()
    const allValues = new Set([...a.values(), ...b.values()])
    
    for (const k of allValues) {
      // P(max(A,B) = k) = P(A = k) * P(B <= k) + P(B = k) * P(A < k)
      const pA_eq_k = a.get(k)
      const pB_eq_k = b.get(k)
      
      const pB_le_k = b.values().filter(v => v <= k).reduce((sum, v) => sum + b.get(v), 0)
      const pA_lt_k = a.values().filter(v => v < k).reduce((sum, v) => sum + a.get(v), 0)
      
      const prob = pA_eq_k * pB_le_k + pB_eq_k * pA_lt_k
      if (prob > 0) {
        result.set(k, prob)
      }
    }
    
    return result
  }

  /** Minimum of two distributions */
  static min(a: Distribution, b: Distribution): Distribution {
    const result = new Distribution()
    const allValues = new Set([...a.values(), ...b.values()])
    
    for (const k of allValues) {
      // P(min(A,B) = k) = P(A = k) * P(B >= k) + P(B = k) * P(A > k)
      const pA_eq_k = a.get(k)
      const pB_eq_k = b.get(k)
      
      const pB_ge_k = b.values().filter(v => v >= k).reduce((sum, v) => sum + b.get(v), 0)
      const pA_gt_k = a.values().filter(v => v > k).reduce((sum, v) => sum + a.get(v), 0)
      
      const prob = pA_eq_k * pB_ge_k + pB_eq_k * pA_gt_k
      if (prob > 0) {
        result.set(k, prob)
      }
    }
    
    return result
  }
}

// === Parser ===

enum TokenType {
  NUMBER,
  DICE,        // 'd'
  PLUS,
  MINUS,
  MULTIPLY,
  LPAREN,
  RPAREN,
  COMMA,
  IDENTIFIER,  // for functions like 'adv', 'dis', 'max', 'min'
  EOF,
}

interface Token {
  type: TokenType
  value: string | number
}

class Lexer {
  private input: string
  private pos: number = 0

  constructor(input: string) {
    this.input = input.toLowerCase().replace(/\s+/g, '')
  }

  private peek(): string | null {
    return this.pos < this.input.length ? this.input[this.pos] : null
  }

  private advance(): string | null {
    return this.pos < this.input.length ? this.input[this.pos++] : null
  }

  nextToken(): Token {
    const ch = this.peek()
    
    if (ch === null) {
      return { type: TokenType.EOF, value: '' }
    }

    // Numbers
    if (ch >= '0' && ch <= '9') {
      let num = ''
      while (this.peek() && this.peek()! >= '0' && this.peek()! <= '9') {
        num += this.advance()
      }
      return { type: TokenType.NUMBER, value: parseInt(num) }
    }

    // Identifiers (function names)
    if (ch >= 'a' && ch <= 'z') {
      let ident = ''
      while (this.peek() && this.peek()! >= 'a' && this.peek()! <= 'z') {
        ident += this.advance()
      }
      
      if (ident === 'd') {
        return { type: TokenType.DICE, value: 'd' }
      }
      
      return { type: TokenType.IDENTIFIER, value: ident }
    }

    // Single-character tokens
    this.advance()
    switch (ch) {
      case '+': return { type: TokenType.PLUS, value: '+' }
      case '-': return { type: TokenType.MINUS, value: '-' }
      case '*': return { type: TokenType.MULTIPLY, value: '*' }
      case '(': return { type: TokenType.LPAREN, value: '(' }
      case ')': return { type: TokenType.RPAREN, value: ')' }
      case ',': return { type: TokenType.COMMA, value: ',' }
      default: throw new Error(`Unexpected character: ${ch}`)
    }
  }
}

class Parser {
  private lexer: Lexer
  private currentToken: Token

  constructor(input: string) {
    this.lexer = new Lexer(input)
    this.currentToken = this.lexer.nextToken()
  }

  private eat(type: TokenType): void {
    if (this.currentToken.type === type) {
      this.currentToken = this.lexer.nextToken()
    } else {
      throw new Error(`Expected ${TokenType[type]}, got ${TokenType[this.currentToken.type]}`)
    }
  }

  parse(): Distribution {
    const result = this.expr()
    if (this.currentToken.type !== TokenType.EOF) {
      throw new Error('Unexpected tokens after expression')
    }
    return result
  }

  private expr(): Distribution {
    let result = this.term()

    while (this.currentToken.type === TokenType.PLUS || this.currentToken.type === TokenType.MINUS) {
      const op = this.currentToken.type
      this.eat(op)
      const right = this.term()
      
      if (op === TokenType.PLUS) {
        result = Distribution.convolve(result, right)
      } else {
        // Subtraction: add negative
        result = Distribution.convolve(result, right.scale(-1))
      }
    }

    return result
  }

  private term(): Distribution {
    let result = this.factor()

    while (this.currentToken.type === TokenType.MULTIPLY) {
      this.eat(TokenType.MULTIPLY)
      const right = this.factor()
      
      // Multiply by constant only
      if (right.values().length === 1) {
        const constant = right.values()[0]
        result = result.scale(constant)
      } else {
        throw new Error('Cannot multiply two random variables')
      }
    }

    return result
  }

  private factor(): Distribution {
    const token = this.currentToken

    // Number
    if (token.type === TokenType.NUMBER) {
      const value = token.value as number
      this.eat(TokenType.NUMBER)
      
      // Check for dice notation: NdX
      if (this.currentToken.type === TokenType.DICE) {
        this.eat(TokenType.DICE)
        
        // After eating DICE, we expect a number
        if (typeof this.currentToken.value !== 'number') {
          throw new Error('Expected number after "d"')
        }
        
        const sides = this.currentToken.value
        this.eat(TokenType.NUMBER)
        
        // Roll N dice and sum them
        let result = Distribution.uniform(1, sides)
        for (let i = 1; i < value; i++) {
          result = Distribution.convolve(result, Distribution.uniform(1, sides))
        }
        return result
      }
      
      // Just a constant
      const dist = new Distribution()
      dist.set(value, 1)
      return dist
    }

    // Single die: dX
    if (token.type === TokenType.DICE) {
      this.eat(TokenType.DICE)
      
      // After eating DICE, we expect a number
      if (typeof this.currentToken.value !== 'number') {
        throw new Error('Expected number after "d"')
      }
      
      const sides = this.currentToken.value
      this.eat(TokenType.NUMBER)
      
      return Distribution.uniform(1, sides)
    }

    // Function call
    if (token.type === TokenType.IDENTIFIER) {
      const funcName = token.value as string
      this.eat(TokenType.IDENTIFIER)
      this.eat(TokenType.LPAREN)
      
      const args: Distribution[] = []
      args.push(this.expr())
      
      while (this.currentToken.type === TokenType.COMMA) {
        this.eat(TokenType.COMMA)
        args.push(this.expr())
      }
      
      this.eat(TokenType.RPAREN)
      
      switch (funcName) {
        case 'adv':
        case 'advantage':
          if (args.length !== 1) throw new Error('adv() takes 1 argument')
          return Distribution.max(args[0], args[0])
        
        case 'dis':
        case 'disadvantage':
          if (args.length !== 1) throw new Error('dis() takes 1 argument')
          return Distribution.min(args[0], args[0])
        
        case 'max':
          if (args.length < 2) throw new Error('max() requires at least 2 arguments')
          return args.reduce((acc, curr) => Distribution.max(acc, curr))
        
        case 'min':
          if (args.length < 2) throw new Error('min() requires at least 2 arguments')
          return args.reduce((acc, curr) => Distribution.min(acc, curr))
        
        default:
          throw new Error(`Unknown function: ${funcName}`)
      }
    }

    // Parenthesized expression
    if (token.type === TokenType.LPAREN) {
      this.eat(TokenType.LPAREN)
      const result = this.expr()
      this.eat(TokenType.RPAREN)
      return result
    }

    throw new Error(`Unexpected token: ${TokenType[token.type]}`)
  }
}

function parseExpression(expr: string): Distribution {
  const parser = new Parser(expr)
  return parser.parse()
}

// === Widget Implementation ===

class ProbabilityConvolutionsWidget {
  private config: WidgetConfig
  private inputElement: HTMLInputElement
  private chartContainer: HTMLElement
  private meanElement: HTMLElement
  private medianElement: HTMLElement
  private errorElement: HTMLElement
  private thresholdValueElements: NodeListOf<HTMLElement> | null = null
  private thresholdBelowElement: HTMLElement | null = null
  private thresholdAboveElement: HTMLElement | null = null
  private resizeObserver: ResizeObserver | null = null
  private currentDistribution: Distribution | null = null
  private currentThreshold: number | null = null

  constructor(container: HTMLElement, config: WidgetConfig) {
    this.config = config
    
    this.inputElement = container.querySelector('.prob-conv-expression-input')!
    this.chartContainer = container.querySelector('.prob-conv-chart-container')!
    this.meanElement = container.querySelector('.prob-conv-mean')!
    this.medianElement = container.querySelector('.prob-conv-median')!
    this.errorElement = container.querySelector('.prob-conv-error')!
    
    if (this.config.showThreshold) {
      this.thresholdValueElements = container.querySelectorAll('.prob-conv-threshold-value')
      this.thresholdBelowElement = container.querySelector('.prob-conv-threshold-below')
      this.thresholdAboveElement = container.querySelector('.prob-conv-threshold-above')
    }
    
    this.setupEventListeners()
    this.setupResizeObserver()
    this.update(this.config.expression)
  }

  private setupEventListeners(): void {
    this.inputElement.addEventListener('input', () => {
      this.update(this.inputElement.value)
    })
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      Plotly.Plots.resize(this.chartContainer)
    })
    
    this.resizeObserver.observe(this.chartContainer)
  }

  private update(expression: string): void {
    try {
      this.errorElement.style.display = 'none'
      
      // Reset threshold when expression changes
      if (this.config.showThreshold) {
        this.currentThreshold = null
      }
      
      const dist = parseExpression(expression)
      this.currentDistribution = dist
      const entries = dist.entries()
      
      if (entries.length === 0) {
        throw new Error('Empty distribution')
      }
      
      const xValues = entries.map(([v]) => v)
      const yValues = entries.map(([, p]) => this.config.asPercentage ? p * 100 : p)
      
      const mean = dist.mean()
      const median = dist.median()
      
      this.meanElement.textContent = mean.toFixed(2)
      this.medianElement.textContent = median.toString()
      
      // Initialize threshold: use provided initialThreshold or default to median - 0.5
      if (this.config.showThreshold && this.currentThreshold === null) {
        if (this.config.initialThreshold !== undefined) {
          this.currentThreshold = this.config.initialThreshold - 0.5
        } else {
          this.currentThreshold = median - 0.5
        }
      }
      
      // Determine bar colors based on threshold
      let barColors: string | string[] = '#1f77b4'
      if (this.config.showThreshold && this.currentThreshold !== null) {
        const thresholdValue = Math.floor(this.currentThreshold)
        barColors = xValues.map(val => val <= thresholdValue ? '#9e9e9e' : '#4caf50')
      }
      
      const barTrace = {
        x: xValues,
        y: yValues,
        type: 'bar' as const,
        name: 'Probability',
        width: 0.8,
        marker: {
          color: barColors,
        },
      }
      
      // Calculate CDF for line trace
      // For threshold at N-0.5, we want to show P(X < N) = P(X <= N-1) = CDF(N-1)
      // So we calculate CDF(x-1) and plot at x-0.5
      const cdfValues = xValues.map(x => {
        const cdf = this.currentDistribution!.cdf(x - 1)
        return this.config.asPercentage ? cdf * 100 : cdf
      })
      
      // Add a final point to show 100%
      const maxValue = xValues[xValues.length - 1]
      cdfValues.push(this.config.asPercentage ? 100 : 1)
      
      // Plot at x-0.5 so CDF(x-1) appears at the threshold between x-1 and x
      const cdfXValues = xValues.map(x => x - 0.5)
      cdfXValues.push(maxValue + 0.5)
      
      const cdfTrace = {
        x: cdfXValues,
        y: cdfValues,
        type: 'scatter' as const,
        mode: 'lines+markers' as const,
        name: 'Cumulative',
        line: {
          color: '#d62728',
          width: 2,
        },
        marker: {
          size: 4,
        },
      }
      
      const shapes: any[] = []
      if (this.config.showThreshold && this.currentThreshold !== null) {
        shapes.push({
          type: 'line',
          x0: this.currentThreshold,
          x1: this.currentThreshold,
          y0: 0,
          y1: 1,
          yref: 'paper',
          line: {
            color: '#ff7f0e',
            width: 3,
            dash: 'dash',
          },
          editable: true,
          xanchor: this.currentThreshold,
        })
        
        this.updateThresholdStats(this.currentThreshold)
      }
      
      const layout: any = {
        title: this.config.title || undefined,
        xaxis: {
          dtick: 1,
          type: 'linear',
          range: [xValues[0] - 0.5, xValues[xValues.length - 1] + 0.5],
        },
        yaxis: {
          tickmode: 'array',
          tickvals: this.config.asPercentage ? [0, 25, 50, 75, 100] : [0, 0.25, 0.5, 0.75, 1],
          ticktext: this.config.asPercentage ? ['0%', '25%', '50%', '75%', '100%'] : ['0', '0.25', '0.5', '0.75', '1'],
        },
        height: this.config.height,
        margin: { t: this.config.title ? 40 : 20, r: 20, b: 40, l: 50 },
        shapes: shapes,
        dragmode: false,
        showlegend: true,
        legend: {
          x: 0.02,
          y: 0.98,
          xanchor: 'left',
          yanchor: 'top',
        },
        bargap: 0.2,
      }
      
      const plotConfig = {
        responsive: true,
        displayModeBar: false,
        editable: this.config.showThreshold,
        edits: {
          titleText: false,
          axisTitleText: false,
        },
      }
      
      Plotly.newPlot(this.chartContainer, [barTrace, cdfTrace], layout, plotConfig)
      
      // Setup drag listener for threshold
      if (this.config.showThreshold) {
        this.setupThresholdDrag()
      }
    } catch (error) {
      this.errorElement.textContent = `Error: ${(error as Error).message}`
      this.errorElement.style.display = 'block'
      this.meanElement.textContent = '—'
      this.medianElement.textContent = '—'
      if (this.config.showThreshold && this.thresholdBelowElement && this.thresholdAboveElement) {
        this.thresholdBelowElement.textContent = '—'
        this.thresholdAboveElement.textContent = '—'
      }
    }
  }

  private setupThresholdDrag(): void {
    // Listen for Plotly relayout events (triggered when shapes are dragged)
    const plotlyDiv = this.chartContainer as any
    plotlyDiv.on('plotly_relayout', (eventData: any) => {
      if (!this.currentDistribution) return
      
      // Check if a shape was moved
      if (eventData['shapes[0].x0'] !== undefined) {
        const newX = eventData['shapes[0].x0']
        
        // Snap down within each bar's interval
        // Bar for N spans [N-0.5, N+0.5), so shift, floor, then shift back
        const threshold = Math.floor(newX - 0.5) + 0.5
        
        // Validate threshold is within distribution range
        const values = this.currentDistribution.values()
        const minThreshold = values[0] - 0.5
        const maxThreshold = values[values.length - 1] + 0.5
        
        if (threshold >= minThreshold && threshold <= maxThreshold) {
          this.currentThreshold = threshold
          this.updateThresholdStats(threshold)
          this.updateBarColors(threshold)
          
          // Snap the line to the half-interval value
          if (Math.abs(threshold - newX) > 0.01) {
            this.updateThresholdLine(threshold)
          }
        }
      }
    })
  }

  private updateThresholdLine(threshold: number): void {
    const update = {
      shapes: [{
        type: 'line',
        x0: threshold,
        x1: threshold,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: {
          color: '#ff7f0e',
          width: 3,
          dash: 'dash',
        },
      }],
    }
    
    Plotly.relayout(this.chartContainer, update)
  }

  private updateBarColors(threshold: number): void {
    if (!this.currentDistribution) return
    
    const thresholdValue = Math.floor(threshold)
    const xValues = this.currentDistribution.values()
    const barColors = xValues.map(val => val <= thresholdValue ? '#9e9e9e' : '#4caf50')
    
    Plotly.restyle(this.chartContainer, { 'marker.color': [barColors] }, [0])
  }

  private updateThresholdStats(threshold: number): void {
    if (!this.currentDistribution || !this.thresholdValueElements || 
        !this.thresholdBelowElement || !this.thresholdAboveElement) {
      return
    }
    
    // Threshold is at N.5, we display N+1 and calculate < N+1 and >= N+1
    const thresholdValue = Math.floor(threshold) + 1
    
    // P(X < N+1) = P(X <= N) = CDF(N)
    const probBelow = this.currentDistribution.cdf(thresholdValue - 1)
    const probAbove = 1 - probBelow
    
    const formatProb = (p: number) => 
      this.config.asPercentage ? `${(p * 100).toFixed(1)}%` : p.toFixed(3)
    
    this.thresholdValueElements.forEach(el => {
      el.textContent = thresholdValue.toString()
    })
    this.thresholdBelowElement.textContent = formatProb(probBelow)
    this.thresholdAboveElement.textContent = formatProb(probAbove)
  }

  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    Plotly.purge(this.chartContainer)
  }
}

// === Widget Script Export ===

const script = createWidgetScript({
  selector: '.widget-probability-convolutions',
  initialize: (element: HTMLElement) => {
    const configAttr = element.getAttribute('data-config')
    if (!configAttr) {
      console.error('Missing data-config attribute')
      return
    }
    
    const config: WidgetConfig = JSON.parse(configAttr)
    const widget = new ProbabilityConvolutionsWidget(element, config)
    
    return () => widget.destroy()
  },
})

script.start()
