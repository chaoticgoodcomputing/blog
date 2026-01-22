// Fetch and render GitHub contributions
async function initGitHubWidgets() {
  const containers = document.querySelectorAll(".github-contrib-container")

  for (const container of containers) {
    const username = container.getAttribute("data-username")
    const theme = container.getAttribute("data-theme") || "default"
    const showHeader = container.getAttribute("data-show-header") !== "false"
    const showProfile = container.getAttribute("data-show-profile") !== "false"

    if (!username) {
      container.innerHTML = '<div class="error-state"><p>No username specified</p></div>'
      continue
    }

    try {
      // Fetch user profile data if needed
      let profileData = null
      
      if (showProfile) {
        const profileResponse = await fetch(`https://api.github.com/users/${username}`)
        
        if (profileResponse.ok) {
          profileData = await profileResponse.json()
        }
      }

      // Fetch GitHub contribution data from API
      const apiUrl = "https://github-contributions-api.jogruber.de/v4/"
      const response = await fetch(`${apiUrl}${username}?y=last`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch (status: ${response.status})`)
      }

      const data = await response.json()
      const contributions = data.contributions
      const totalContributions = data.total.lastYear

      // Group contributions by weeks
      const weeks: Array<
        Array<{ date: string; count: number; level: number; weekday: number }>
      > = []
      let currentWeek: Array<{ date: string; count: number; level: number; weekday: number }> = []

      contributions.forEach((day: { date: string; count: number; level: number }) => {
        // Add 1 day to fix timezone offset
        const date = new Date(day.date)
        date.setDate(date.getDate() + 1)
        const dayOfWeek = date.getDay()

        // Start new week on Sunday
        if (dayOfWeek === 0 && currentWeek.length > 0) {
          weeks.push(currentWeek)
          currentWeek = []
        }

        currentWeek.push({
          date: date.toISOString().split("T")[0],
          count: day.count,
          level: day.level,
          weekday: dayOfWeek,
        })
      })

      if (currentWeek.length > 0) {
        weeks.push(currentWeek)
      }

      // Calculate responsive sizing
      const containerWidth = (container as HTMLElement).offsetWidth
      const weekWidth = 12
      const padding = 50 // Space for day labels
      const maxWeeks = Math.floor((containerWidth - padding) / weekWidth)
      const displayWeeks = weeks.slice(-Math.min(maxWeeks, weeks.length))

      // Build output HTML
      let output = '<div class="gh-content">'

      // Render profile section
      if (showProfile && profileData) {
        output += '<div class="gh-profile">'
        output += `<img class="gh-avatar" src="${profileData.avatar_url}" alt="${username}" />`
        output += '<div class="gh-profile-info">'
        output += `<a class="gh-name" href="https://github.com/${username}" target="_blank" rel="noopener noreferrer">`
        output += profileData.name || username
        output += '</a>'
        output += `<p class="gh-username">@${username}</p>`
        if (profileData.bio) {
          output += `<p class="gh-bio">${profileData.bio}</p>`
        }
        output += '</div>'
        output += '</div>'
      }

      if (showHeader) {
        output += `
          <div class="gh-header">
            <span>${totalContributions} contributions in the last year</span>
          </div>
        `
      }

      output += '<div class="gh-graph"><table class="gh-table"><tbody>'

      // Create 7 rows (one for each day of week), starting with Sunday
      const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        output += "<tr>"

        // Day label (only show Mon, Wed, Fri)
        if ([1, 3, 5].includes(dayOfWeek)) {
          output += `<td class="gh-day-label">${dayLabels[dayOfWeek]}</td>`
        } else {
          output += '<td class="gh-day-label"></td>'
        }

        // Contribution cells for this day of week across all weeks
        displayWeeks.forEach((week) => {
          const day = week.find((d) => d.weekday === dayOfWeek)
          if (day) {
            const color = getColor(day.level, theme)
            const dateObj = new Date(day.date)
            const dateStr = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            const countStr =
              day.count === 0
                ? "No contributions"
                : `${day.count} contribution${day.count !== 1 ? "s" : ""}`
            output += `<td class="gh-day" style="background-color: ${color}" title="${countStr} on ${dateStr}"></td>`
          } else {
            output += '<td class="gh-day-empty"></td>'
          }
        })
        output += "</tr>"
      }

      output += "</tbody></table></div>"
      output += "</div>" // Close gh-content

      container.innerHTML = output
    } catch (error) {
      console.error("Error loading GitHub contributions:", error)
      container.innerHTML = `<div class="error-state"><p>Failed to load contributions</p><p class="error-details">${(error as Error).message}</p></div>`
    }
  }
}

function getColor(level: number, theme: string): string {
  const themes: Record<string, string[]> = {
    default: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
    midnight: ["#0f111a", "#1a1f3a", "#2d3561", "#4a5899", "#6b7fd7"],
    void: ["#0a0a0a", "#1a1a1a", "#2d2d2d", "#424242", "#5c5c5c"],
    slate: ["#1e293b", "#334155", "#475569", "#64748b", "#94a3b8"],
    glacier: ["#f0f9ff", "#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8"],
    cyber: ["#001a00", "#003300", "#00ff00", "#00ff66", "#66ffaa"],
  }
  return (themes[theme] || themes.default)[level]
}

// Initialize on load
initGitHubWidgets()

// Re-initialize on SPA navigation
document.addEventListener("nav", () => {
  initGitHubWidgets()
})
