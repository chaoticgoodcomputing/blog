#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');

// Configuration
const CHAPTERS_FILE = join(projectRoot, 'docs', 'scratch', 'apl-chapters.md');
const OUTPUT_DIR = join(projectRoot, 'content', 'private', 'content', 'annotations', 'a-pattern-language');
const CURRENT_DATE = '2026-01-31';

/**
 * Convert a pattern name to a snake-case filename slug
 */
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/'/g, '') // Remove apostrophes
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}

/**
 * Parse the chapters list file
 */
function parseChapters() {
  const content = readFileSync(CHAPTERS_FILE, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const patterns = [];
  const lineRegex = /^(\d+)\.\s+(.+)$/;
  
  for (const line of lines) {
    const match = line.match(lineRegex);
    if (match) {
      const number = parseInt(match[1], 10);
      const name = match[2].trim();
      const slug = toSlug(name);
      const filename = `${number.toString().padStart(2, '0')}-${slug}.md`;
      
      patterns.push({ number, name, slug, filename });
    }
  }
  
  return patterns;
}

/**
 * Generate markdown content for a pattern
 */
function generateMarkdown(pattern, prevPattern, nextPattern) {
  const title = `APL: Pattern ${pattern.number}; ${pattern.name}`;
  const prevLink = prevPattern 
    ? `[[${prevPattern.filename.replace('.md', '')}|${prevPattern.name}]]`
    : '';
  const nextLink = nextPattern
    ? `[[${nextPattern.filename.replace('.md', '')}|${nextPattern.name}]]`
    : '';
  
  return `---
title: "${title}"
date: ${CURRENT_DATE}
tags:
  - writing/annotations/pattern-language
  - projects/games/neighborhood
---

**Previous Pattern:** ${prevLink}
**Next Pattern:** ${nextLink}

## Notes

-
`;
}

/**
 * Main execution
 */
function main() {
  console.log('Parsing chapters...');
  const patterns = parseChapters();
  console.log(`Found ${patterns.length} patterns`);
  
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  let created = 0;
  let skipped = 0;
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    
    // Circular linking: wrap around at edges
    const prevPattern = patterns[(i - 1 + patterns.length) % patterns.length];
    const nextPattern = patterns[(i + 1) % patterns.length];
    
    const filepath = join(OUTPUT_DIR, pattern.filename);
    
    if (existsSync(filepath)) {
      console.log(`⏭️  Skipping ${pattern.filename} (already exists)`);
      skipped++;
      continue;
    }
    
    const content = generateMarkdown(pattern, prevPattern, nextPattern);
    writeFileSync(filepath, content, 'utf-8');
    console.log(`✅ Created ${pattern.filename}`);
    created++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`Complete! Created ${created} files, skipped ${skipped} existing files.`);
}

main();
