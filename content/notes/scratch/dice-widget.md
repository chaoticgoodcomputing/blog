# Dice Roll Distribution Widget

> Discover the probability distributions of different dice roll combinations

- Page: https://blog.chaoticgood.computer/content/notes/scratch/dice-widget
- Author: Spencer Elkington
- Published: 2026-01-19
- Updated: 2026-09-25
- Tags: projects/games, engineering/data, writing/fragments

---

Expression:

**Mean:** 21.32•**Median:** 22

Less than22:46.5%

22 or more:53.5%

## Available Operations

-   **Basic Dice**: `dX` or `NdX` - Roll a single die or multiple dice
    -   Examples: `d20`, `2d6`, `3d8`
-   **Advantage**: `adv(expr)` - Roll with advantage (take maximum of two rolls)
    -   Examples: `adv(d20)`, `adv(2d6)`
-   **Disadvantage**: `dis(expr)` - Roll with disadvantage (take minimum of two rolls)
    -   Examples: `dis(d20)`, `dis(2d6)`
-   **Maximum**: `max(expr1, expr2, ...)` - Take the maximum value across multiple expressions
    -   Examples: `max(d6, d8)`, `max(2d6, 1d12)`
-   **Minimum**: `min(expr1, expr2, ...)` - Take the minimum value across multiple expressions
    -   Examples: `min(d6, d8)`, `min(2d6, 1d12)`
-   **Arithmetic**: `+`, `-`, `*`, `/` - Combine expressions with arithmetic operations
    -   Examples: `2d6 + 3`, `d20 - 2`, `d6 * 2`
-   **Constants**: Use plain numbers in expressions
    -   Examples: `5`, `10 + d6`

> [!note] Note
>
> If you’d like to learn more about probability distribution convolutions, the [full post](https://blog.chaoticgood.computer/content/notes/roll-advantage) is pretty neat!
