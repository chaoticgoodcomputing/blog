// The card: stock og-image's default card (`defaultImage`, which the package doesn't export),
// ported from our v4 `quartz/util/og.tsx` onto stock's scheme-aware palette. It differs from stock
// in three places only: each tag chip shows the tag's last segment (`#articles`, not
// `#writing/articles`), the icon is the site's own when one is configured, and the title leaves off
// the site's title suffix.
//
// Satori lays this out, not a browser: every element needs an explicit `display: flex`, and colours
// have to be literal values. They come from the site's theme, never from this file.
import { formatDate } from "@quartz-community/utils/date"
import readingTime from "reading-time"
import type { SocialImageOptions } from "@quartz-community/og-image"

type FontSpecification = string | { name: string }
type Palette = Record<"light" | "lightgray" | "gray" | "darkgray" | "dark" | "secondary" | "highlight", string>
interface Theme {
  typography: { header: FontSpecification; body: FontSpecification }
  colors: Record<"lightMode" | "darkMode", Palette>
}

export type CardOptions = Parameters<SocialImageOptions["imageStructure"]>[0]

const fontName = (spec: FontSpecification) => (typeof spec === "string" ? spec : spec.name)

/** v4's chip text: `writing/articles` is drawn as `#articles`. */
export const chipText = (tag: string) => `#${tag.split("/").pop() ?? tag}`

/**
 * The card's title: the page's own. Stock og-image hands the card the page's `<title>`, which ends
 * with the site's `pageTitleSuffix`. v4's card never carried it, and it would take a third of the line.
 */
export function cardTitle(title: string, suffix: string | undefined) {
  return suffix && title.endsWith(suffix) ? title.slice(0, -suffix.length) : title
}

export function card(icon: string | undefined) {
  return function Card({ cfg, userOpts, title: pageTitle, description, fileData, iconBase64 }: CardOptions) {
    const theme = cfg.theme as Theme
    const colors = theme.colors[userOpts.colorScheme]
    const bodyFont = fontName(theme.typography.body)
    const headerFont = fontName(theme.typography.header)
    const title = cardTitle(pageTitle, cfg.pageTitleSuffix)
    const useSmallerFont = title.length > 32

    const dateType = (fileData as { defaultDateType?: string }).defaultDateType
    const rawDate = dateType ? fileData.dates?.[dateType] : undefined
    const date = rawDate ? formatDate(rawDate, cfg.locale) : null
    const { minutes } = readingTime(fileData.text ?? "")
    const readingTimeText = (userOpts.readingTimeText ?? ((time: number) => `${time} min read`))(Math.ceil(minutes))
    const tags = fileData.frontmatter?.tags ?? []
    const iconSrc = icon ?? iconBase64

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          backgroundColor: colors.light,
          padding: "2.5rem",
          fontFamily: bodyFont,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
          {iconSrc && <img src={iconSrc} alt="" width={56} height={56} style={{ borderRadius: "50%" }} />}
          <div style={{ display: "flex", fontSize: 32, color: colors.gray, fontFamily: bodyFont }}>{cfg.baseUrl}</div>
        </div>

        <div style={{ display: "flex", marginTop: "1rem", marginBottom: "1.5rem" }}>
          <h1
            style={{
              margin: 0,
              fontSize: useSmallerFont ? 64 : 72,
              fontFamily: headerFont,
              fontWeight: 700,
              color: colors.dark,
              lineHeight: 1.2,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </h1>
        </div>

        <div style={{ display: "flex", flex: 1, fontSize: 36, color: colors.darkgray, lineHeight: 1.4 }}>
          <p
            style={{
              margin: 0,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 5,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {description}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: `1px solid ${colors.lightgray}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", color: colors.gray, fontSize: 28 }}>
            {date && (
              <div style={{ display: "flex", alignItems: "center" }}>
                <svg
                  style={{ marginRight: "0.5rem" }}
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  role="img"
                  aria-label="Date"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {date}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center" }}>
              <svg
                style={{ marginRight: "0.5rem" }}
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                role="img"
                aria-label="Reading time"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {readingTimeText}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "60%" }}>
            {tags.slice(0, 3).map((tag) => (
              <div
                style={{
                  display: "flex",
                  padding: "0.5rem 1rem",
                  backgroundColor: colors.highlight,
                  color: colors.secondary,
                  borderRadius: "10px",
                  fontSize: 24,
                }}
              >
                {chipText(tag)}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
}
