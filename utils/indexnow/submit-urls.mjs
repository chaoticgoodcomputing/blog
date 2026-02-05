#!/usr/bin/env node

/**
 * IndexNow URL Submission Utility
 * 
 * Submits URLs to IndexNow API for instant indexing by Bing, Yandex, and other search engines.
 * Parses sitemap.xml to extract URLs and submits them in batches.
 * 
 * Usage:
 *   node submit-urls.mjs <sitemap-path>
 *   
 * Environment:
 *   INDEXNOW_DRY_RUN - Set to 'true' to skip actual API submission
 *   INDEXNOW_BATCH_SIZE - Number of URLs per request (default: 10000, max per spec)
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';

const INDEXNOW_API_KEY = 'a6e41ab6-6753-4d94-9b54-b4405d806883';
const SITE_HOST = 'blog.chaoticgood.computer';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const BATCH_SIZE = parseInt(process.env.INDEXNOW_BATCH_SIZE || '10000', 10);
const DRY_RUN = process.env.INDEXNOW_DRY_RUN === 'true';

/**
 * Parse sitemap XML and extract all URLs
 */
function parseSitemapUrls(sitemapXml) {
  const urlMatches = sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g);
  return Array.from(urlMatches, match => match[1]);
}

/**
 * Submit URLs to IndexNow API
 */
async function submitToIndexNow(urls) {
  if (urls.length === 0) {
    console.log('⚠️  No URLs to submit');
    return;
  }

  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_API_KEY,
    keyLocation: `https://${SITE_HOST}/${INDEXNOW_API_KEY}.txt`,
    urlList: urls
  };

  if (DRY_RUN) {
    console.log('🏃 DRY RUN - Would submit:', JSON.stringify(payload, null, 2));
    return;
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`✅ Successfully submitted ${urls.length} URLs to IndexNow`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
    } else {
      const errorText = await response.text();
      console.error(`❌ IndexNow API error: ${response.status} ${response.statusText}`);
      console.error(`   Response: ${errorText}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Failed to submit to IndexNow:`, error.message);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  const sitemapPath = process.argv[2];

  if (!sitemapPath) {
    console.error('Usage: node submit-urls.mjs <sitemap-path>');
    process.exit(1);
  }

  console.log('🔍 IndexNow URL Submission');
  console.log(`   Sitemap: ${sitemapPath}`);
  console.log(`   Host: ${SITE_HOST}`);
  console.log(`   Key: ${INDEXNOW_API_KEY}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  if (DRY_RUN) console.log('   Mode: DRY RUN');
  console.log();

  try {
    const resolvedPath = resolve(sitemapPath);
    const sitemapXml = await readFile(resolvedPath, 'utf-8');

    console.log('📖 Parsing sitemap...');
    const urls = parseSitemapUrls(sitemapXml);
    console.log(`   Found ${urls.length} URLs`);
    console.log();

    // Submit in batches
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(urls.length / BATCH_SIZE);

      console.log(`📤 Submitting batch ${batchNum}/${totalBatches} (${batch.length} URLs)...`);
      await submitToIndexNow(batch);

      // Rate limiting: wait 1 second between batches
      if (i + BATCH_SIZE < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log();
    console.log('✨ All URLs submitted successfully!');
    console.log();
    console.log('📊 Search engines notified:');
    console.log('   • Bing');
    console.log('   • Yandex');
    console.log('   • Seznam.cz');
    console.log('   • Naver');
    console.log();
    console.log('ℹ️  Note: Google does not support IndexNow. Submit your sitemap manually');
    console.log('   at https://search.google.com/search-console');

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
