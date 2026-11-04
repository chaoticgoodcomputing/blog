// Who mentions whom among a few webmention-compatible blogs, as a cgc-mdx island: a network of
// blogs, each pair one way a link, coloured by its direction from a seed's point of view: out of a
// seed, into one, or mutual, where the pair mention each other both ways.
//
// The graph comes from mention-graph.json, which packages/indieweb-graph's ExportGraph step writes,
// laid out already: every node has its place and its label's, so the picture is the same on every
// load, and the same as the step's SVG. The widget only draws it, as SVG, so it renders whole when
// the site builds. Once hydrated, pointing at or focusing a blog picks out its links and says how
// much it mentions and is mentioned; pointing at a link picks it out and lists the post mentions it
// stands for, and a click holds that list open, so its posts can be followed.
import { useEffect, useId, useMemo, useState } from "preact/hooks"
import graph from "./mention-graph.json"
import "./widget.css"

type Direction = "out" | "in" | "mutual"

interface GraphNode {
  id: string
  label: string
  seed: boolean
  x: number
  y: number
  r: number
  outgoing: number
  incoming: number
  seeds_linked: number
  /** A canonical utility, such as the IndieWeb's wiki, from a hand-kept list: drawn as a star. */
  utility?: boolean
  /** What a utility is. */
  note?: string | null
  labelled: boolean
  label_x?: number
  label_y?: number
  label_anchor?: "start" | "middle" | "end"
}

/** One post's mention of another: a link in a crawled post, a webmention a seed received, or both. */
interface PostMention {
  source: string
  target: string
  kind: string
  seen_as: "outgoing" | "incoming" | "both"
}

interface GraphLink {
  source: string
  target: string
  count: number
  kinds: Record<string, number>
  direction: Direction
  mentions: PostMention[]
}

const NODES = graph.nodes as unknown as GraphNode[]
const LINKS = graph.links as unknown as GraphLink[]
const BY_ID = new Map(NODES.map((node) => [node.id, node]))
const DIRECTIONS: [Direction, string][] = [
  ["out", "outgoing mention"],
  ["in", "incoming mention"],
  ["mutual", "mutual mention"],
]
/** How many of a link's post mentions its card lists while pointed at; the rest are counted. Held open, it lists them all. */
const LISTED = 8
const SEEN_AS: Record<PostMention["seen_as"], string> = {
  outgoing: "linked",
  incoming: "webmention",
  both: "linked, and a webmention",
}

const linkKey = (link: GraphLink) => `${link.source} ${link.target}`

/**
 * A link's path, as the step draws it: a slight bend, ending at the edge of the target's circle.
 * With the curve's middle, where its card is placed.
 */
function curve(a: GraphNode, b: GraphNode): { d: string; mid: [number, number] } {
  const [dx, dy] = [b.x - a.x, b.y - a.y]
  const [mx, my] = [(a.x + b.x) / 2 - dy * 0.12, (a.y + b.y) / 2 + dx * 0.12]
  const [tx, ty] = [b.x - mx, b.y - my]
  const length = Math.hypot(tx, ty) || 1
  const shrink = b.r + 2
  const [ex, ey] = [b.x - (tx / length) * shrink, b.y - (ty / length) * shrink]
  return {
    d: `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`,
    mid: [0.25 * a.x + 0.5 * mx + 0.25 * ex, 0.25 * a.y + 0.5 * my + 0.25 * ey],
  }
}

/** A star's corners, as ExportGraph draws one: a little wider than a circle of radius `r`, for the eye. */
function starPoints(x: number, y: number, r: number, points = 5): string {
  const [outer, inner] = [r * 1.35, r * 0.6]
  return Array.from({ length: points * 2 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner
    const angle = -Math.PI / 2 + (i * Math.PI) / points
    return `${(x + radius * Math.cos(angle)).toFixed(1)},${(y + radius * Math.sin(angle)).toFixed(1)}`
  }).join(" ")
}

/** A post's address within its blog: its path and query, or `/` for the home page. */
function pathOf(url: string): string {
  const { pathname, search } = new URL(url)
  return `${pathname}${search}` || "/"
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`

/**
 * Where a card goes: by a place on the graph, to its left past `flip` of the graph's width, so it
 * stays inside it. A link's card is wider than a blog's, so it flips sooner.
 */
const cardPlace = (x: number, y: number, flip = 0.6) => ({
  side: x > graph.width * flip ? "indieweb-graph__card indieweb-graph__card--left" : "indieweb-graph__card",
  style: { left: `${(x / graph.width) * 100}%`, top: `${(y / graph.height) * 100}%` },
})

export interface IndiewebGraphProps {
  /** A caption under the graph. */
  caption?: string
  /** Grow into the margins beside the text, as the site's wide blocks do (note-body.css). */
  wide?: boolean
}

export function IndiewebGraph({ caption, wide = true }: IndiewebGraphProps) {
  const id = useId()
  const [active, setActive] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)

  const paths = useMemo(
    () =>
      [...LINKS]
        .sort((a, b) => a.count - b.count)
        .map((link) => ({
          ...link,
          key: linkKey(link),
          ...curve(BY_ID.get(link.source)!, BY_ID.get(link.target)!),
          width: 0.6 + 0.5 * Math.sqrt(link.count),
        })),
    [],
  )

  // A held link's card closes on Escape.
  useEffect(() => {
    if (!pinned) return
    const close = (event: KeyboardEvent) => event.key === "Escape" && setPinned(null)
    document.addEventListener("keydown", close)
    return () => document.removeEventListener("keydown", close)
  }, [pinned])

  // What is picked out: a held link first, then a blog pointed at or focused, then a link pointed at.
  const linkShown = pinned ?? (active ? null : hovered)
  const link = linkShown ? paths.find((path) => path.key === linkShown) : undefined
  const node = !link && active ? BY_ID.get(active) : undefined

  // The blogs that stay lit, and are named: a link's two, or a blog and what it is linked to.
  const near = useMemo(() => {
    if (link) return new Set([link.source, link.target])
    if (!node) return null
    const ids = new Set([node.id])
    for (const each of LINKS) {
      if (each.source === node.id) ids.add(each.target)
      if (each.target === node.id) ids.add(each.source)
    }
    return ids
  }, [link, node])
  const lit = (each: { key: string; source: string; target: string }) =>
    link ? each.key === link.key : node ? each.source === node.id || each.target === node.id : undefined

  const blogsOut = node ? LINKS.filter((each) => each.source === node.id).length : 0
  const blogsIn = node ? LINKS.filter((each) => each.target === node.id).length : 0

  return (
    // Its links to the blogs it charts send no webmentions (astro/src/lib/mention-excerpts.ts): the
    // note doesn't mention them in its words.
    <figure class={wide ? "indieweb-graph wide" : "indieweb-graph"} data-no-webmention>
      {/* Two rows: the blogs, then the links. */}
      <div class="indieweb-graph__legend">
        <ul aria-label="Blogs">
          <li>
            <span class="indieweb-graph__dot indieweb-graph__dot--seed" aria-hidden="true" />
            seed
          </li>
          <li>
            <span class="indieweb-graph__dot" aria-hidden="true" />
            unexplored
          </li>
          <li>
            <svg class="indieweb-graph__star" viewBox="-8 -8 16 16" aria-hidden="true">
              <polygon points={starPoints(0, 0, 5)} />
            </svg>
            utility
          </li>
        </ul>
        <ul aria-label="Links">
          {DIRECTIONS.map(([direction, label]) => (
            <li>
              <span class={`indieweb-graph__swatch indieweb-graph__swatch--${direction}`} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div class="indieweb-graph__plot">
        <svg
          viewBox={`0 0 ${graph.width} ${graph.height}`}
          role="img"
          aria-label={`A network of ${NODES.length} blogs and ${LINKS.length} links between them, as seen from the seed blogs`}
          class={near ? "is-focused" : undefined}
          onPointerLeave={() => {
            setActive(null)
            setHovered(null)
          }}
          // A click on the graph's ground lets a held link go.
          onClick={(event) => event.target === event.currentTarget && setPinned(null)}
        >
          <defs>
            {DIRECTIONS.map(([direction]) => (
              <marker
                id={`${id}-arrow-${direction}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path class={`indieweb-graph__arrow--${direction}`} d="M0,0 L10,5 L0,10 z" />
              </marker>
            ))}
          </defs>

          <g>
            {paths.map((path) => (
              <path
                class={`indieweb-graph__link indieweb-graph__link--${path.direction}`}
                data-lit={lit(path)}
                d={path.d}
                stroke-width={path.width}
                marker-end={`url(#${id}-arrow-${path.direction})`}
              />
            ))}
          </g>

          {/* Each link's hit target: wider than the link, unseen. Pointed at, it is picked out; clicked,
              its card is held open. Not focusable: a keyboard reaches the blogs, whose names say their
              counts. */}
          <g>
            {paths.map((path) => (
              <path
                class="indieweb-graph__link-hit"
                d={path.d}
                onPointerEnter={() => setHovered(path.key)}
                onPointerLeave={() => setHovered(null)}
                onClick={() => setPinned((held) => (held === path.key ? null : path.key))}
              />
            ))}
          </g>

          <g>
            {[...NODES]
              .sort((a, b) => Number(a.seed) + Number(!!a.utility) - Number(b.seed) - Number(!!b.utility))
              .map((blog) => (
                <a
                  href={`https://${blog.id}/`}
                  target="_blank"
                  rel="noopener"
                  aria-label={`${blog.label}: mentions ${plural(blog.outgoing, "time")}, mentioned ${plural(blog.incoming, "time")}`}
                  onPointerEnter={() => setActive(blog.id)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(blog.id)}
                  onBlur={() => setActive(null)}
                >
                  {/* A hit target bigger than the mark, for a small node. */}
                  <circle class="indieweb-graph__hit" cx={blog.x} cy={blog.y} r={Math.max(blog.r, 10)} />
                  {blog.utility ? (
                    <polygon
                      class="indieweb-graph__node indieweb-graph__node--utility"
                      data-lit={near ? near.has(blog.id) : undefined}
                      points={starPoints(blog.x, blog.y, blog.r)}
                    />
                  ) : (
                    <circle
                      class={blog.seed ? "indieweb-graph__node indieweb-graph__node--seed" : "indieweb-graph__node"}
                      data-lit={near ? near.has(blog.id) : undefined}
                      cx={blog.x}
                      cy={blog.y}
                      r={blog.r}
                    />
                  )}
                </a>
              ))}
          </g>

          <g aria-hidden="true">
            {NODES.map((blog) => {
              const named = blog.labelled && blog.label_x !== undefined
              // While a blog or a link is picked out, the blogs it touches are named too.
              const shown = near ? near.has(blog.id) : named
              if (!shown) return null
              const [x, y, anchor] = named
                ? [blog.label_x!, blog.label_y!, blog.label_anchor!]
                : [blog.x, blog.y - blog.r - 4, "middle" as const]
              return (
                <text
                  class={
                    blog.seed
                      ? "indieweb-graph__label indieweb-graph__label--seed"
                      : blog.utility
                        ? "indieweb-graph__label indieweb-graph__label--utility"
                        : "indieweb-graph__label"
                  }
                  x={x}
                  y={y}
                  text-anchor={anchor}
                >
                  {blog.label}
                </text>
              )
            })}
          </g>
        </svg>

        {node &&
          (() => {
            const place = cardPlace(node.x, node.y)
            return (
              <div class={place.side} style={place.style} aria-hidden="true">
                <strong>{node.label}</strong>
                {node.label !== node.id && <span class="indieweb-graph__host">{node.id}</span>}
                {node.note && <span class="indieweb-graph__note">{node.note}</span>}
                <span>
                  mentions {plural(blogsOut, "blog")} ({plural(node.outgoing, "time")})
                </span>
                <span>
                  mentioned by {plural(blogsIn, "blog")} ({plural(node.incoming, "time")})
                </span>
              </div>
            )
          })()}

        {link &&
          (() => {
            const place = cardPlace(link.mid[0], link.mid[1], 0.45)
            // Its kinds, where they say more than its count: not where every one is a plain mention.
            const kinds = Object.entries(link.kinds)
            const breakdown =
              kinds.length > 1 || kinds[0]?.[0] !== "mention"
                ? `: ${kinds.map(([kind, n]) => `${n} ${kind}${n === 1 ? "" : "s"}`).join(", ")}`
                : ""
            const held = pinned === link.key
            const [from, to] = [BY_ID.get(link.source)!, BY_ID.get(link.target)!]
            return (
              <div
                class={`${place.side} indieweb-graph__card--link${held ? " is-held" : ""}`}
                style={place.style}
                role={held ? "dialog" : undefined}
                aria-label={held ? `${from.label} to ${to.label}` : undefined}
                aria-hidden={held ? undefined : "true"}
              >
                <strong>
                  {from.label} → {to.label}
                </strong>
                <span>
                  {plural(link.count, "mention")}
                  {breakdown}
                </span>
                <ol class="indieweb-graph__mentions">
                  {(held ? link.mentions : link.mentions.slice(0, LISTED)).map((mention) => (
                    <li>
                      <span class="indieweb-graph__kind">{mention.kind}</span>{" "}
                      {held ? (
                        <a href={mention.source} target="_blank" rel="noopener">
                          {pathOf(mention.source)}
                        </a>
                      ) : (
                        <span>{pathOf(mention.source)}</span>
                      )}
                      {" → "}
                      {held ? (
                        <a href={mention.target} target="_blank" rel="noopener">
                          {pathOf(mention.target)}
                        </a>
                      ) : (
                        <span>{pathOf(mention.target)}</span>
                      )}
                      <span class="indieweb-graph__seen">{SEEN_AS[mention.seen_as]}</span>
                    </li>
                  ))}
                </ol>
                {!held && link.mentions.length > LISTED && (
                  <span class="indieweb-graph__more">and {link.mentions.length - LISTED} more</span>
                )}
                {held && (
                  <button type="button" class="indieweb-graph__close" onClick={() => setPinned(null)} aria-label="Close">
                    ×
                  </button>
                )}
              </div>
            )
          })()}
      </div>

      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
