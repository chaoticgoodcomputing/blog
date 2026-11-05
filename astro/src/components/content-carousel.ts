// The `<content-carousel>` element: the site's carousels (src/components/Carousel.astro), and a
// note's runs of images, which the Markdown pipeline makes the same element (src/lib/image-carousels.ts).
// Carousel.astro and Base.astro both import it; a module runs once, so it is defined once.

/**
 * The carousel's buttons: the arrows step to the slide before or after the one in view, wrapping
 * round, and each dot goes to its slide. Whichever way the reader gets to a slide, its dot is
 * marked.
 */
class ContentCarousel extends HTMLElement {
  connectedCallback() {
    const track = this.querySelector<HTMLElement>(":scope > .track")!
    const slides = [...track.children] as HTMLElement[]
    if (slides.length < 2) return
    const dots = [...this.querySelectorAll<HTMLButtonElement>(":scope > .controls .dot")]
    const current = () => Math.min(slides.length - 1, Math.max(0, Math.round(track.scrollLeft / track.clientWidth)))
    const go = (index: number) => {
      const to = (index + slides.length) % slides.length
      track.scrollTo({ left: to * track.clientWidth })
    }
    const update = () => {
      const index = current()
      dots.forEach((dot, at) => dot.setAttribute("aria-current", String(at === index)))
    }

    this.querySelectorAll<HTMLButtonElement>(":scope > .controls [data-step]").forEach((button) =>
      button.addEventListener("click", () => go(current() + Number(button.dataset.step))),
    )
    dots.forEach((dot, index) => dot.addEventListener("click", () => go(index)))
    let frame = 0
    track.addEventListener("scroll", () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    })
    update()
  }
}

customElements.define("content-carousel", ContentCarousel)
