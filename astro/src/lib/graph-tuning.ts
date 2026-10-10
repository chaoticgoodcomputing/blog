// Tuning a graph's settings by hand, for the settings panel the global graph has on the dev server
// (src/components/global-graph/settings-panel.ts): each number in the settings, by its path, and the
// settings with one of them changed. Pure; the panel draws a field for each number.

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/** Each number in `settings`, however deep, by its path of keys joined with `.`, in the order written. */
export function numbersIn(settings: object, prefix = ""): { path: string; value: number }[] {
  return Object.entries(settings).flatMap(([key, value]) => {
    const path = prefix + key
    if (typeof value === "number") return [{ path, value }]
    return isObject(value) ? numbersIn(value, `${path}.`) : []
  })
}

/** `settings` with the number at `path` changed to `value`, and nothing else; `settings` stays as it was. */
export function withNumber<T extends object>(settings: T, path: string, value: number): T {
  const [key, ...rest] = path.split(".")
  const inner = (settings as Record<string, unknown>)[key!]
  return { ...settings, [key!]: rest.length === 0 || !isObject(inner) ? value : withNumber(inner, rest.join("."), value) }
}
