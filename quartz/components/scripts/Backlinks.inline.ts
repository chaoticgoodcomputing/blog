import { IconService } from "../../util/iconService"

document.addEventListener("nav", async () => {
  const backlinksContainers = document.querySelectorAll(".backlinks")
  
  for (const container of backlinksContainers) {
    const links = container.querySelectorAll("a.file-link")
    
    for (const link of links) {
      const iconSpan = link.querySelector(".file-icon") as HTMLElement
      if (!iconSpan) continue
      
      // Check if this link has private tag
      const isPrivate = link.classList.contains("private")
      
      if (isPrivate) {
        // Add lock icon for private posts
        const iconData = await IconService.getIcon("mdi:lock")
        if (iconData) {
          iconSpan.innerHTML = iconData.svgContent
          const svg = iconSpan.querySelector("svg") as SVGElement
          if (svg) {
            svg.setAttribute("width", "12")
            svg.setAttribute("height", "12")
          }
        }
      }
      // Public posts will show bullet via CSS (::before on empty .file-icon)
    }
  }
  
  // Preload the lock icon
  await IconService.preloadIcons(["mdi:lock"])
})
