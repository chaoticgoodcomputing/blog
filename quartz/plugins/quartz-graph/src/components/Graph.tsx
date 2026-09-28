import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types"
import { slugTag } from "@quartz-community/utils/path"
import runtime from "cgc-graph:runtime"
import { DEFAULT_TITLE, containerConfigs, type GraphOptions } from "../options"

// The graph's markup, which the runtime draws into: v4's Graph (components/Graph.tsx) as one BEM
// block. The local graph's container sits in a square box with the button that opens the global
// graph; the global graph's sits in a dialog, which opens in the page's top layer, above every
// stacking context, where v4 moved its modal to the end of <body> (docs/adr/0003). Each container
// carries its graph's settings in `data-cfg`, as v4's and stock's do. With `debugPanel`, the dialog
// is marked for the runtime to add the debug panel beside the global graph: always, or with `serve`,
// only when the site is served (`quartz build --serve`), never in a build to publish.

// Quartz's build context, as a component's props carry it (Quartz Core's own component props type it
// as `BuildCtx`; `@quartz-community/types` leaves it `unknown`): only whether the site is served.
type ServedCtx = { argv?: { serve?: boolean } } | undefined

export default ((userOpts?: GraphOptions) => {
  // Quartz merges no defaults into a component's options, so the component does.
  const { local, global } = containerConfigs(userOpts, slugTag)
  const title = userOpts?.title ?? DEFAULT_TITLE
  // The private colour, for the global graph's private toggle as for private nodes. Checked as a
  // colour value by the emitter, so it can't break out of the declaration.
  const privateColour = global.nodeColors?.private ?? local.nodeColors?.private

  const debugPanel = userOpts?.debugPanel ?? false

  const Graph: QuartzComponent = ({ displayClass, ctx }: QuartzComponentProps) => {
    const debug =
      debugPanel === "serve" ? (ctx as ServedCtx)?.argv?.serve === true : debugPanel === true
    return (
      <div
        class={["cgc-graph", displayClass].filter(Boolean).join(" ")}
        style={privateColour ? `--cgc-graph-private: ${privateColour}` : undefined}
      >
        <h3 class="cgc-graph__title">{title}</h3>
        <div class="cgc-graph__outer">
          <div class="cgc-graph__local" data-cfg={JSON.stringify(local)}></div>
          <button type="button" class="cgc-graph__open" aria-haspopup="dialog">
            View Global Graph
          </button>
        </div>
        <dialog
          class={["cgc-graph__dialog", debug && "cgc-graph__dialog--debug"]
            .filter(Boolean)
            .join(" ")}
          aria-label="Global graph"
        >
          <div class="cgc-graph__global" data-cfg={JSON.stringify(global)}></div>
        </dialog>
      </div>
    )
  }

  Graph.afterDOMLoaded = runtime
  return Graph
}) satisfies QuartzComponentConstructor<GraphOptions>
