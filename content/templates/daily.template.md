<%*
// Configuration
const SEASONS_FOLDER = "public/tags/horticulture/seasons";
const DAILY_NOTES_FOLDER = "private/content/notes/periodic/daily";

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

-%>---
title: "<% title %>"
date: <% tp.date.now() %>
tags:
  - <% seasonTag %>
---
⇐ [[<% previousPath %>|<% previousBasename %>]]

## Up Front

Today:

### Thoughts

- 

### Tasks

Tasks for the day:

#### Leftovers

---
```dataview
TASK
WHERE contains(path, "private/")
  AND (
    (!completed AND file.day < date("<% tp.date.now("YYYY-MM-DD") %>"))
    OR (completed 
        AND typeof(created) = "date" 
        AND created < date("<% tp.date.now("YYYY-MM-DD") %>") 
        AND typeof(completion) = "date" 
        AND completion = date("<% tp.date.now("YYYY-MM-DD") %>"))
  )
SORT created DESC
```
---
#### Fresh

- 

## In Review

In review:

- 
