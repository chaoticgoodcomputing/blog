import { JSX } from "preact"

/**
 * Page Assets widget - displays the size breakdown of page resources.
 * 
 * Shows a horizontal stacked bar chart with asset categories:
 * - Article content
 * - Other HTML
 * - postscript.js
 * - CSS
 * - Widget Scripts
 * - Other JS
 * 
 * @example
 * ```mdx
 * import { PageAssets } from '@content/widgets/page-assets'
 * 
 * <PageAssets />
 * ```
 */
export function PageAssets(): JSX.Element {
  return (
    <div class="widget-page-assets" data-widget="page-assets">
      <h3 class="asset-title">This Webpage: calculating...</h3>
      <div class="asset-status initializing">
        <span class="status-icon">⏳</span>
        <span class="status-text">Waiting for page resources to load...</span>
      </div>
      <div class="asset-chart-container" style="display: none;">
        <svg class="asset-chart" width="100%" height="60"></svg>
      </div>
      <div class="asset-legend"></div>
    </div>
  )
}
