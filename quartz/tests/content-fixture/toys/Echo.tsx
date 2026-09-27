// Renders its props back as JSON, so a spec can read exactly what the static evaluator produced.
// Has a click counter so hydration is observable.
import { useState } from "preact/hooks"

export default function Echo(props: Record<string, unknown>) {
  const [clicks, setClicks] = useState(0)
  return (
    <div class="echo">
      <pre class="echo__props">{JSON.stringify(props)}</pre>
      <button class="echo__button" onClick={() => setClicks(clicks + 1)}>
        clicked {clicks}
      </button>
    </div>
  )
}
