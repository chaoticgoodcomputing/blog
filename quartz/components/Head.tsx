import { i18n } from "../i18n"
import { FullSlug, getFileExtension, isAbsoluteURL, joinSegments, pathToRoot, simplifySlug } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage"
import type { SchemaOrgArticleType, StructuredDataMapping } from "../cfg"

/**
 * Get structured data type and section for a file based on its tags
 */
function getStructuredDataForFile(
  tags: string[] | undefined,
  mappings: StructuredDataMapping[],
  defaultType: SchemaOrgArticleType,
): { type: SchemaOrgArticleType; section: string | null } {
  if (!tags || tags.length === 0) {
    return { type: defaultType, section: null }
  }

  // Iterate through mappings in priority order (first match wins)
  for (const mapping of mappings) {
    if (tags.includes(mapping.tag)) {
      return { type: mapping.type, section: mapping.section }
    }
  }

  return { type: defaultType, section: null }
}

export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // Url of current page - use simplifySlug to remove trailing /index for canonical URLs
    const socialUrl =
      fileData.slug === "404"
        ? url.toString()
        : joinSegments(url.toString(), simplifySlug(fileData.slug!))

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {/* Set base URL for 404 page to ensure links resolve from root, not relative to error path */}
        {fileData.slug === "404" && <base href="/" />}
        {cfg.theme.fontOrigin === "googleFonts" && cfg.theme.cdnCaching && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        {cfg.theme.fontOrigin === "local" && (
          <link rel="stylesheet" href="/static/fonts/fonts.css" />
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath)?.slice(1) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        <link rel="canonical" href={socialUrl} />
        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {/* Structured Data (JSON-LD) */}
        {cfg.structuredData && fileData.slug !== "404" && fileData.slug?.startsWith("content/") && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                (() => {
                const sdConfig = cfg.structuredData
                const { type, section } = getStructuredDataForFile(
                  fileData.frontmatter?.tags,
                  sdConfig.mappings ?? [],
                  sdConfig.defaultType ?? "Article",
                )

                const author = sdConfig.author ?? {
                  type: "Organization",
                  name: cfg.pageTitle,
                }

                const publisher = sdConfig.publisher ?? author

                // Determine OG image path (same logic as ogImage.tsx)
                const userDefinedOgImagePath = fileData.frontmatter?.socialImage
                const generatedOgImagePath = usesCustomOgImage
                  ? `https://${cfg.baseUrl}/${fileData.slug}-og-image.webp`
                  : undefined
                const ogImagePath = userDefinedOgImagePath
                  ? (isAbsoluteURL(userDefinedOgImagePath)
                    ? userDefinedOgImagePath
                    : `https://${cfg.baseUrl}/static/${userDefinedOgImagePath}`)
                  : (generatedOgImagePath ?? ogImageDefaultPath)

                const jsonLd: any = {
                  "@context": "https://schema.org",
                  "@type": type,
                  headline: fileData.frontmatter?.title,
                  url: socialUrl,
                  image: ogImagePath,
                  inLanguage: cfg.locale,
                  mainEntityOfPage: {
                    "@type": "WebPage",
                    "@id": socialUrl,
                  },
                  author: {
                    "@type": author.type,
                    name: author.name,
                    ...(author.url && { url: author.url }),
                  },
                  publisher: {
                    "@type": publisher.type,
                    name: publisher.name,
                    ...(publisher.url && { url: publisher.url }),
                    ...(publisher.type === "Organization" && {
                      logo: {
                        "@type": "ImageObject",
                        url: `https://${cfg.baseUrl}/static/icon.png`,
                        width: 184,
                        height: 184,
                      },
                    }),
                  },
                }

                // Add description if available
                if (description) {
                  jsonLd.description = description
                }

                // Add dates if available
                if (fileData.dates?.published) {
                  jsonLd.datePublished = fileData.dates.published.toISOString()
                }
                if (fileData.dates?.modified) {
                  jsonLd.dateModified = fileData.dates.modified.toISOString()
                }

                // Add section if available
                if (section) {
                  jsonLd.articleSection = section
                }

                // Add keywords from all tags
                if (fileData.frontmatter?.tags && fileData.frontmatter.tags.length > 0) {
                  jsonLd.keywords = fileData.frontmatter.tags.join(", ")
                }

                return jsonLd
              })(),
            ),
            }}
          />
        )}

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
