<%*
// Configuration
const SEASONS_FOLDER = "public/tags/horticulture/seasons";
const DAILY_NOTES_FOLDER = "private/content/notes/periodic/daily";
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

// Find the most recent season by date
const latestSeason = app.vault.getMarkdownFiles()
  .filter(file => file.path.startsWith(SEASONS_FOLDER))
  .reduce((latest, file) => {
    const createdAt = app.metadataCache.getFileCache(file)?.frontmatter?.date;
    if (!createdAt) return latest;
    
    if (!latest || new Date(createdAt) > new Date(latest.createdAt)) {
      return { file, createdAt };
    }
    return latest;
  }, null);

// Extract season info with fallback if no season found
const seasonName = latestSeason?.file.path.split('/').slice(-2)[0] ?? 'daily';
const seasonTag = `horticulture/seasons/${seasonName}`;

// Calculate day number within season
const daysSinceSeason = latestSeason 
  ? moment().diff(moment(latestSeason.createdAt), 'days', true)
  : 0;
const dayNumber = Math.ceil(daysSinceSeason);

// Build title with capitalized season name
const seasonTitle = seasonName.charAt(0).toUpperCase() + seasonName.slice(1);
const title = latestSeason ? `${seasonTitle}: Day ${dayNumber}` : tp.date.now("YYYY-MM-DD");

// Find most recent daily note before today
const today = tp.date.now("YYYY-MM-DD");
const previousNote = app.vault.getMarkdownFiles()
  .filter(file => {
    if (!file.path.startsWith(DAILY_NOTES_FOLDER)) return false;
    // Match YYYY-MM-DD pattern and ensure it's before today
    return file.basename.match(/^\d{4}-\d{2}-\d{2}$/) && file.basename < today;
  })
  .sort((a, b) => b.basename.localeCompare(a.basename))[0];

// Build previous note link with nested year/month structure
const previousPath = previousNote 
  ? previousNote.path.replace(/\.md$/, '')
  : (() => {
      const yesterday = tp.date.now("YYYY-MM-DD", -1);
      const [year, month] = yesterday.split('-');
      return `${DAILY_NOTES_FOLDER}/${year}/${month}/${yesterday}`;
    })();
const previousBasename = previousNote ? previousNote.basename : tp.date.now("YYYY-MM-DD", -1);

// Execute Dataview query to get leftover tasks from previous note only
const DataviewAPI = app.plugins.plugins.dataview?.api;
let leftoverTasks = "No tasks found.";

if (DataviewAPI && previousNote) {
  const query = `
TASK
WHERE file.path = "${previousNote.path}"
  AND !completed
SORT created ASC
  `.trim();
  
  const result = await DataviewAPI.queryMarkdown(query);
  if (result.successful && result.value) {
    leftoverTasks = result.value;
  } else if (!result.successful) {
    leftoverTasks = `Error executing query: ${result.error}`;
  }
} else if (!previousNote) {
  leftoverTasks = "No previous daily note found.";
}

-%>---
title: "<% title %>"
date: <% tp.date.now() %>
tags:
  - <% seasonTag %>
---
⇐ [[<% previousPath %>|<% previousBasename %>]]

## <% WEEKDAYS[moment().day()] %>: Up Front

What is my day going to look like?

### Tasks

Tasks for the day:

#### Leftovers

<% leftoverTasks %>
#### Fresh

- [x] #tasks/site Start <% tp.date.now("YYYY-MM-DD") %> daily note [created:: <% tp.date.now("YYYY-MM-DD") %>] [completion:: <% tp.date.now("YYYY-MM-DD") %>]
- 

### Thoughts

- 

### Plans

> [!ASSISTANT]
> 
> #### Morning Block
> 
> - 
> 
> #### Afternoon Block
> 
> - 
> 
> #### Evening Block
> 
> - 

## In Review

In review:

- 
