<%*
// Configuration
const SEASONS_FOLDER = "public/tags/horticulture/seasons";
const WEEKLY_NOTES_FOLDER = "private/content/notes/periodic/weekly";

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

// Calculate week number within season
const daysSinceSeason = latestSeason 
  ? moment().diff(moment(latestSeason.createdAt), 'days', true)
  : 0;
const weekNumber = Math.ceil(daysSinceSeason / 7);

// Build title with capitalized season name
const seasonTitle = seasonName.charAt(0).toUpperCase() + seasonName.slice(1);
const title = latestSeason ? `${seasonTitle}: Week ${weekNumber}` : tp.date.now("YYYY-MM-DD");

// Calculate previous week's date range (Monday-Sunday)
// Find the most recent Sunday (0 = Sunday in moment.js day())
const now = moment();
const dayOfWeek = now.day();
const lastSunday = dayOfWeek === 0 ? now.clone() : now.clone().subtract(dayOfWeek, 'days');
const previousMonday = lastSunday.clone().subtract(6, 'days');

const weekStart = previousMonday.format("YYYY-MM-DD");
const weekEnd = lastSunday.format("YYYY-MM-DD");

// Find most recent weekly note before today
const today = tp.date.now("YYYY-MM-DD");
const previousNote = app.vault.getMarkdownFiles()
  .filter(file => {
    if (!file.path.startsWith(WEEKLY_NOTES_FOLDER)) return false;
    // Get the note's date from frontmatter
    const noteDate = app.metadataCache.getFileCache(file)?.frontmatter?.date;
    return noteDate && noteDate < today;
  })
  .sort((a, b) => {
    const dateA = app.metadataCache.getFileCache(a)?.frontmatter?.date || '';
    const dateB = app.metadataCache.getFileCache(b)?.frontmatter?.date || '';
    return dateB.localeCompare(dateA);
  })[0];

// Build previous note link using title from frontmatter
const previousPath = previousNote?.path.replace(/\.md$/, '');
const previousBasename = previousNote 
  ? (app.metadataCache.getFileCache(previousNote)?.frontmatter?.title || previousNote.basename)
  : null;

// Find all private notes from last week
const privateNotes = app.vault.getMarkdownFiles()
  .filter(file => {
    if (!file.path.startsWith('private/')) return false;
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontmatter?.date) return false;
    const noteDate = frontmatter.date;
    return noteDate >= weekStart && noteDate <= weekEnd;
  })
  .map(file => {
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
    const title = frontmatter?.title || file.basename;
    const path = file.path.replace(/\.md$/, '');
    return { path, title, date: frontmatter?.date };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

// Find all public notes from last week (excluding private-tagged)
const publicNotes = app.vault.getMarkdownFiles()
  .filter(file => {
    if (!file.path.startsWith('public/')) return false;
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontmatter?.date) return false;
    
    // Exclude notes with private tag
    const tags = Array.isArray(frontmatter.tags)
      ? frontmatter.tags
      : frontmatter.tags ? [frontmatter.tags] : [];
    if (tags.includes('private')) return false;
    
    const noteDate = frontmatter.date;
    return noteDate >= weekStart && noteDate <= weekEnd;
  })
  .map(file => {
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
    const title = frontmatter?.title || file.basename;
    const path = file.path.replace(/\.md$/, '');
    return { path, title, date: frontmatter?.date };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

-%>---
title: "<% title %>"
date: <% tp.date.now() %>
tags:
  - <% seasonTag %>
---
⇐ [[<% previousPath %>|<% previousBasename %>]]

## Past Week

### Writing

#### Private Notes

<%* if (privateNotes.length > 0) { -%>
<%* for (const note of privateNotes) { -%>
- [[<% note.path %>|<% note.title %>]]
<%* } -%>
<%* } else { -%>
*No private notes from the past week.*
<%* } -%>

#### Public Notes

<%* if (publicNotes.length > 0) { -%>
<%* for (const note of publicNotes) { -%>
- [[<% note.path %>|<% note.title %>]]
<%* } -%>
<%* } else { -%>
*No public notes from the past week.*
<%* } -%>

### Tasks

---
```dataview
TASK
WHERE contains(path, "private/")
  AND completed
  AND typeof(completion) = "date"
  AND completion >= date("<% weekStart %>")
  AND completion <= date("<% weekEnd %>")
SORT completion DESC
```
---

### Retrospective

#### Personal

⋯

#### Work

⋯

#### Projects

⋯

## This Week

⋯
