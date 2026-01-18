#!/usr/bin/env node

import { readFile, writeFile, access } from 'fs/promises';
import { resolve } from 'path';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

const sitemapPath = resolve(process.cwd(), 'dist/public/sitemap.xml');
const outputPath = resolve(process.cwd(), 'utils/lighthouse/lighthouserc.cjs');

// Configuration
const MAX_URLS = parseInt(process.env.LHCI_MAX_URLS || '10', 10);
const BASE_URL = process.env.LHCI_BASE_URL || 'http://localhost:8080';
const NUMBER_OF_RUNS = parseInt(process.env.LHCI_RUNS || '1', 10);

// URL filtering patterns (exclude pages you don't want to test)
const EXCLUDE_PATTERNS = [
  '/tags/',                  // Tag index pages
  '/assets/',                // Asset files
  '/static/',                // Static files
];

/**
 * Maps a URL path to potential source markdown files
 * e.g., /content/articles/hello-blog -> content/public/content/articles/hello-blog.md
 */
function urlToMarkdownPaths(urlPath) {
  // Remove leading slash
  const path = urlPath.replace(/^\//, '');

  // Try both public and private directories
  return [
    resolve(process.cwd(), `content/public/${path}.md`),
    resolve(process.cwd(), `content/private/${path}.md`),
  ];
}

/**
 * Extracts tags from markdown frontmatter
 */
function extractTags(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return [];

  const frontmatter = frontmatterMatch[1];
  const tagsMatch = frontmatter.match(/tags:\s*\n((?:  - .+\n)+)/);

  if (!tagsMatch) {
    // Try inline format: tags: [tag1, tag2]
    const inlineMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
    if (inlineMatch) {
      return inlineMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
    }
    return [];
  }

  // Parse YAML list format
  return tagsMatch[1]
    .split('\n')
    .filter(line => line.trim().startsWith('- '))
    .map(line => line.trim().substring(2).trim());
}

/**
 * Checks if a URL should be included based on frontmatter tags
 */
async function shouldIncludeUrl(url) {
  // Extract path from URL
  const urlObj = new URL(url);
  const urlPath = urlObj.pathname;

  // Check exclude patterns first
  if (EXCLUDE_PATTERNS.some(pattern => urlPath.includes(pattern))) {
    return false;
  }

  // Root pages (/, /about, etc.) - always include
  if (urlPath === '/' || !urlPath.includes('/content/')) {
    return true;
  }

  // Content pages - check for private tag
  const possiblePaths = urlToMarkdownPaths(urlPath);

  for (const filePath of possiblePaths) {
    try {
      await access(filePath);
      const content = await readFile(filePath, 'utf-8');
      const tags = extractTags(content);

      // Exclude if any tag contains "private"
      if (tags.some(tag => tag.includes('private'))) {
        return false;
      }

      return true;
    } catch (err) {
      // File doesn't exist at this path, try next
      continue;
    }
  }

  // If we can't find the source file, include it (better safe than sorry)
  console.warn(`⚠️  Could not find source file for ${urlPath}, including by default`);
  return true;
}

async function generateConfig() {
  console.log('📖 Reading sitemap from dist/public/sitemap.xml...');
  const sitemapXML = await readFile(sitemapPath, 'utf-8');

  console.log('🔍 Parsing sitemap XML...');
  const sitemap = await parseXML(sitemapXML);

  const urls = sitemap.urlset.url.map(entry => {
    const loc = entry.loc[0];
    // Convert production URLs to localhost
    return loc.replace(/https?:\/\/[^/]+/, BASE_URL);
  });

  console.log(`📊 Found ${urls.length} URLs in sitemap`);

  // Filter URLs based on patterns and frontmatter
  const filterPromises = urls.map(async (url) => {
    const include = await shouldIncludeUrl(url);
    return { url, include };
  });

  const filterResults = await Promise.all(filterPromises);
  const filteredUrls = filterResults.filter(r => r.include).map(r => r.url);

  console.log(`🔍 Filtered to ${filteredUrls.length} URLs (excluded: ${urls.length - filteredUrls.length})`);

  // Limit URLs for reasonable CI time
  const selectedUrls = filteredUrls.slice(0, MAX_URLS);
  console.log(`✂️  Limited to ${selectedUrls.length} URLs (max: ${MAX_URLS})`);

  // Generate lighthouserc.js configuration
  const config = `module.exports = {
  ci: {
    collect: {
      url: ${JSON.stringify(selectedUrls, null, 6)},
      numberOfRuns: ${NUMBER_OF_RUNS},
    },
    upload: {
      target: 'filesystem',
      outputDir: './utils/lighthouse/raw/lhci',
    },
    storageDir: './utils/lighthouse/.lighthouseci',
  },
};
`;

  await writeFile(outputPath, config);
  console.log(`✅ Generated utils/lighthouse/lighthouserc.cjs with ${selectedUrls.length} URLs`);
  console.log(`📁 Reports will be saved to utils/lighthouse/raw/lhci/`);
}

generateConfig().catch((error) => {
  console.error('❌ Error generating Lighthouse CI config:', error);
  process.exit(1);
});
