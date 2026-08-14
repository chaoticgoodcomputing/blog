/**
 * Client-side script for Page Assets widget.
 * 
 * Measures page asset sizes and renders a D3 visualization.
 */

import { select, scaleLinear } from "d3"

interface AssetData {
  category: string
  bytes: number
  color: string
}

// === Widget Script Helper (inlined to avoid import issues) ===
interface WidgetScriptConfig {
  selector: string
  initialize: (element: HTMLElement) => (() => void) | void
}

function createWidgetScript(config: WidgetScriptConfig) {
  const cleanupHandlers = new WeakMap<HTMLElement, () => void>()
  
  function cleanupInstance(element: HTMLElement): void {
    const cleanup = cleanupHandlers.get(element)
    if (cleanup) {
      cleanup()
      cleanupHandlers.delete(element)
    }
  }
  
  function initializeAll(): void {
    const elements = document.querySelectorAll<HTMLElement>(config.selector)
    elements.forEach((element) => {
      cleanupInstance(element)
      const cleanup = config.initialize(element)
      if (cleanup) cleanupHandlers.set(element, cleanup)
    })
  }
  
  return {
    start() {
      document.addEventListener("nav", initializeAll)
      window.addEventListener("load", initializeAll)
      window.addCleanup(() => {
        document.removeEventListener("nav", initializeAll)
        window.removeEventListener("load", initializeAll)
      })
      initializeAll()
    }
  }
}
// === End Widget Script Helper ===

/**
 * Measure the size of different page assets
 */
function measureAssets(): AssetData[] {
  const assets: AssetData[] = []
  
  // 1. Article content (main article body)
  const article = document.querySelector("article")
  const articleBytes = article ? new Blob([article.innerHTML]).size : 0
  
  // 2. Total HTML
  const totalHtmlBytes = new Blob([document.documentElement.outerHTML]).size
  const otherHtmlBytes = totalHtmlBytes - articleBytes
  
  // 3. Script and resource sizes from Performance API
  const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[]
  const currentOrigin = window.location.origin
  
  let postscriptBytes = 0
  let cssBytes = 0
  let widgetScriptBytes = 0
  let externalJsBytes = 0
  let otherJsBytes = 0
  
  resources.forEach((resource) => {
    const size = resource.transferSize || resource.encodedBodySize || 0
    const url = resource.name
    
    // Skip browser extension resources
    if (url.includes("-extension://")) {
      return
    }
    
    if (url.endsWith("/postscript.js")) {
      postscriptBytes = size
    } else if (url.includes(".css")) {
      cssBytes += size
    } else if (url.includes("/static/widgets/") && url.endsWith(".js")) {
      widgetScriptBytes += size
    } else if (url.includes(".js")) {
      // Check if external (different origin)
      const isExternal = url.startsWith("http") && !url.startsWith(currentOrigin)
      if (isExternal) {
        externalJsBytes += size
      } else {
        otherJsBytes += size
      }
    }
  })
  
  assets.push(
    { category: "Article", bytes: articleBytes, color: "#4A90E2" },
    { category: "Other HTML", bytes: otherHtmlBytes, color: "#7B68EE" },
    { category: "postscript.js", bytes: postscriptBytes, color: "#FFB347" },
    { category: "CSS", bytes: cssBytes, color: "#E94B3C" },
    { category: "Widget Scripts", bytes: widgetScriptBytes, color: "#9B59B6" },
    { category: "External JS", bytes: externalJsBytes, color: "#FF6B6B" },
    { category: "Other JS", bytes: otherJsBytes, color: "#B0B0B0" }
  )
  
  return assets.filter(a => a.bytes > 0)
}

/**
 * Render the asset breakdown chart using D3
 */
function renderChart(container: HTMLElement, data: AssetData[]): void {
  const svg = select(container).select<SVGSVGElement>("svg.asset-chart")
  const legendDiv = select(container).select<HTMLDivElement>(".asset-legend")
  const titleElement = container.querySelector<HTMLElement>(".asset-title")
  
  // Clear previous content
  svg.selectAll("*").remove()
  legendDiv.selectAll("*").remove()
  
  // Get dimensions from the widget container
  const containerWidth = container.offsetWidth
  const width = containerWidth - 32 // Account for widget padding (1rem * 2)
  const height = 60
  const margin = { top: 10, right: 10, bottom: 10, left: 10 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom
  
  // Calculate total and percentages
  const total = data.reduce((sum, d) => sum + d.bytes, 0)
  const totalKB = (total / 1024).toFixed(1)
  
  // Update title with total
  if (titleElement) {
    titleElement.textContent = `This Webpage: ${totalKB} kilobytes`
  }
  
  const dataWithPercent = data.map(d => ({
    ...d,
    percent: (d.bytes / total) * 100,
    kb: (d.bytes / 1024).toFixed(1)
  })).sort((a, b) => b.bytes - a.bytes) // Sort by bytes descending
  
  // Create scales
  const xScale = scaleLinear()
    .domain([0, 100])
    .range([0, chartWidth])
  
  // Create chart group
  const g = svg
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
  
  // Draw stacked bars
  let xOffset = 0
  dataWithPercent.forEach((d) => {
    const barWidth = xScale(d.percent)
    
    g.append("rect")
      .attr("x", xOffset)
      .attr("y", 0)
      .attr("width", barWidth)
      .attr("height", chartHeight)
      .attr("fill", d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
    
    // Add percentage text if wide enough
    if (d.percent > 8) {
      g.append("text")
        .attr("x", xOffset + barWidth / 2)
        .attr("y", chartHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(`${d.percent.toFixed(0)}%`)
    }
    
    xOffset += barWidth
  })
  
  // Create legend
  const legendItems = legendDiv
    .append("div")
    .attr("class", "asset-legend-items")
    .selectAll(".legend-item")
    .data(dataWithPercent)
    .enter()
    .append("div")
    .attr("class", "legend-item")
  
  legendItems
    .append("span")
    .attr("class", "legend-color")
    .style("background-color", d => d.color)
  
  legendItems
    .append("span")
    .attr("class", "legend-label")
    .text(d => `${d.category}: ${d.kb} KB (${d.percent.toFixed(1)}%)`)
}

const pageAssetsWidget = createWidgetScript({
  selector: ".widget-page-assets",
  initialize: (element) => {
    // Show initializing state
    const statusDiv = element.querySelector<HTMLElement>(".asset-status")
    const chartContainer = element.querySelector<HTMLElement>(".asset-chart-container")
    
    if (statusDiv) {
      statusDiv.style.display = "flex"
    }
    if (chartContainer) {
      chartContainer.style.display = "none"
    }
    
    // Wait for resources to fully load (10 seconds)
    const timeoutId = setTimeout(() => {
      const data = measureAssets()
      renderChart(element, data)
      
      // Hide status, show chart
      if (statusDiv) {
        statusDiv.style.display = "none"
      }
      if (chartContainer) {
        chartContainer.style.display = "block"
      }
    }, 10000)
    
    // Return cleanup function
    return () => {
      clearTimeout(timeoutId)
    }
  }
})

pageAssetsWidget.start()
