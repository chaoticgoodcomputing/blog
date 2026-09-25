// Dice expressions and the probability distributions they roll: the maths behind the
// ProbabilityConvolutions widget, with no DOM, so it runs at build time as well as in the browser.
//
// Ported unchanged from v4's script.inline.ts beside this file, which Quartz 4 reads until cutover.

// === Probability Distribution ===

/**
 * Represents a discrete probability distribution.
 * Maps outcome values to their probabilities.
 */
export class Distribution {
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

/** The distribution an expression such as `2d6`, `adv(d20) + 3` or `max(d6, d8)` rolls. */
export function parseExpression(expr: string): Distribution {
  const parser = new Parser(expr)
  return parser.parse()
}
