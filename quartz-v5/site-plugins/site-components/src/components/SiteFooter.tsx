import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "@quartz-community/types"
import { i18n } from "../i18n"

export interface SiteFooterOptions {
  /** The footer's links, text to URL, in order. */
  links?: Record<string, string>
  /**
   * Who the copyright line names, name to URL, in order: "Copyright <a> & <b> © <year>". No line
   * when unset.
   */
  copyright?: Record<string, string>
}

// v4's Footer (FORK-LEDGER `components/Footer.tsx`): the links first, then the copyright line, then
// the Quartz credit without stock's version number. Stock `footer` takes only `links`, so the
// copyright line needs this component. `site-footer` is v4's class; the site styles it (site-styles,
// components tier).
export default ((opts?: SiteFooterOptions) => {
  const links = Object.entries(opts?.links ?? {})
  const holders = Object.entries(opts?.copyright ?? {})

  const SiteFooter: QuartzComponent = ({ cfg, displayClass }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    return (
      <footer class={["site-footer", displayClass].filter(Boolean).join(" ")}>
        <ul>
          {links.map(([text, href]) => (
            <li>
              <a href={href}>{text}</a>
            </li>
          ))}
        </ul>
        {holders.length > 0 && (
          <p>
            Copyright{" "}
            {holders.map(([name, href], i) => (
              <>
                {i > 0 && " & "}
                <a href={href}>{name}</a>
              </>
            ))}{" "}
            © {year}
          </p>
        )}
        <p>
          {i18n(cfg?.locale).createdWith} <a href="https://quartz.jzhao.xyz/">Quartz</a> © {year}
        </p>
      </footer>
    )
  }

  return SiteFooter
}) satisfies QuartzComponentConstructor<SiteFooterOptions>
