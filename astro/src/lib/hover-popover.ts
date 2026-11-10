// What the site's hover popovers share: a popover opened by the pointer resting on something, and
// closed when it leaves both that and the popover. A link's preview is one (LinkPopovers.astro); a
// highlight's annotation is another (src/components/annotation-viewer). This is when one opens, how
// long it stays, and where it goes. What it shows, and what a click on it does, is each one's own.
//
// Only a pointer that can rest on something without following it opens one, as a mouse can. A finger
// can't: on a touch screen there is no popover. A screen that has both, a laptop's, hovers with its
// mouse, and a touch on it is still a finger's.

/** What a hover popover is for, from the element the pointer is on. */
export interface Hovered<K> {
  /** What the popover is put beside: the element the pointer rests on. */
  anchor: Element
  /**
   * What the popover shows. Anchors with the same key show the same thing, so the pointer moving
   * from one to the next, as from one line of a highlight to the next, keeps it open.
   */
  key: K
}

export interface HoverPopoverOptions<K> {
  /** The popover, `popover="manual"`, which the script puts where it goes. */
  popover: HTMLElement
  /** What the pointer is on opens the popover, if it is for something. */
  find(target: Element): Hovered<K> | undefined
  /** Fills the popover with what it shows for `key`: false where there is nothing to show. */
  fill(key: K, anchor: Element): Promise<boolean> | boolean
  /** Called once the popover is open and in its place. */
  opened?(key: K): void
}

// How long the pointer rests on an anchor before its popover opens, so that one passing over a
// paragraph of links on its way elsewhere opens none; and how long a popover stays once the pointer
// is off both it and its anchor, so that one crossing the gap between them keeps it.
const OPENING = 300
const CLOSING = 150

// How far the popover is from its anchor, and from the edges of the window.
const GAP = 4
const MARGIN = 8

/** A popover that opens while the pointer rests on what it is for. */
export class HoverPopover<K> {
  readonly #options: HoverPopoverOptions<K>
  readonly #hovering = matchMedia("(hover: hover) and (pointer: fine)")
  /** What a popover is wanted for, so that one filled too late for it is not shown. */
  #wanted: Hovered<K> | undefined
  #opening: ReturnType<typeof setTimeout> | undefined
  #closing: ReturnType<typeof setTimeout> | undefined

  constructor(options: HoverPopoverOptions<K>) {
    this.#options = options
  }

  /** What the popover is open for, or about to open for. */
  get wanted(): Hovered<K> | undefined {
    return this.#wanted
  }

  /** Listens for the pointer over the whole page; returns what stops it. */
  connect(): () => void {
    document.addEventListener("pointerover", this.#over)
    document.addEventListener("pointerout", this.#out)
    document.addEventListener("keydown", this.#key)
    return () => {
      document.removeEventListener("pointerover", this.#over)
      document.removeEventListener("pointerout", this.#out)
      document.removeEventListener("keydown", this.#key)
      this.close()
    }
  }

  close() {
    clearTimeout(this.#opening)
    clearTimeout(this.#closing)
    this.#wanted = undefined
    if (this.#options.popover.matches(":popover-open")) this.#options.popover.hidePopover()
  }

  // Whether `node` is the popover, or an anchor of what it is open for.
  #keeps(node: Node | null): boolean {
    if (!node || !this.#wanted) return false
    if (this.#options.popover.contains(node) || this.#wanted.anchor.contains(node)) return true
    const element = node instanceof Element ? node : node.parentElement
    return element !== null && this.#options.find(element)?.key === this.#wanted.key
  }

  #over = (event: PointerEvent) => {
    if (!this.#hovering.matches || event.pointerType === "touch") return
    const target = event.target as Element
    if (this.#keeps(target)) {
      clearTimeout(this.#closing)
      return
    }
    const hovered = this.#options.find(target)
    if (!hovered) return
    clearTimeout(this.#closing)
    clearTimeout(this.#opening)
    this.#wanted = hovered
    this.#opening = setTimeout(() => void this.#open(hovered), OPENING)
  }

  // The popover closes when the pointer is on neither an anchor of it nor the popover.
  #out = (event: PointerEvent) => {
    if (!this.#wanted || this.#keeps(event.relatedTarget as Node | null)) return
    clearTimeout(this.#closing)
    this.#closing = setTimeout(() => this.close(), CLOSING)
  }

  #key = (event: KeyboardEvent) => {
    if (event.key === "Escape") this.close()
  }

  async #open(hovered: Hovered<K>) {
    const filled = await this.#options.fill(hovered.key, hovered.anchor)
    if (!filled || this.#wanted !== hovered) return
    this.#options.popover.showPopover()
    this.#place(hovered.anchor)
    this.#options.opened?.(hovered.key)
  }

  /** Puts the popover under its anchor, or over it where there is more room there. */
  #place(anchor: Element) {
    const popover = this.#options.popover
    const around = anchor.getBoundingClientRect()
    const { width, height } = popover.getBoundingClientRect()
    const below = innerHeight - around.bottom
    const top = below >= height + GAP + MARGIN || below >= around.top ? around.bottom + GAP : around.top - GAP - height
    const left = Math.max(MARGIN, Math.min(around.left, innerWidth - width - MARGIN))
    Object.assign(popover.style, { top: `${top}px`, left: `${left}px` })
  }
}
