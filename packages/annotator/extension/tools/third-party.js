#!/usr/bin/env node

/**
 * The notices of the other people's packages the extension's bundles hold, which their licenses ask
 * a copy to carry (NOTICE.md). The packages are read from the bundles' source maps, so a bundle is
 * never shipped holding a package whose notice is missing.
 *
 *   third-party.js update   Run by hand, with the network, after the client or a dependency
 *                           changes: writes licenses/, one folder per package, holding the license
 *                           files its own published package carries, and licenses/packages.json.
 *   third-party.js check    Run by the build, offline: fails if a bundle holds a package licenses/
 *                           lacks, then copies licenses/ into build/licenses/.
 *
 * The client's bundles come built, from the `hypothesis` npm package, which doesn't say which
 * versions of its dependencies it bundled: `update` takes them from the client's own lockfile, at
 * the tag of the installed client's version. The extension's own bundle is built here, so its
 * packages are the installed ones.
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const root = process.cwd();
const licensesDir = path.join(root, 'licenses');
const recordFile = path.join(licensesDir, 'packages.json');

/** The built bundles, by their source maps, and whose packages they hold. */
const BUNDLES = [
  { map: 'build/extension.bundle.js.map', from: 'installed' },
  { map: 'build/client/build/scripts/annotator.bundle.js.map', from: 'client' },
  { map: 'build/client/build/scripts/sidebar.bundle.js.map', from: 'client' },
  { map: 'build/client/build/scripts/ui-playground.bundle.js.map', from: 'client' },
];

/** Packages that are the work the extension's own LICENSE already covers. */
const OURS = new Set(['hypothesis']);

/**
 * Hypothesis's own packages, which publish no license file of their own: they are under the client's
 * license, by the same holder, so they carry its LICENSE.
 */
const HYPOTHESIS = /^@hypothesis\//;

/** Licenses that ask a copy to carry no notice: a package under one needs no license file. */
const NO_NOTICE = new Set(['Unlicense', 'CC0-1.0', '0BSD']);

/** A license file, as packages name them. */
const LICENSE_FILE = /^(licen[cs]e|copying|notice|authors)(\b|[-._])/i;

/**
 * The packages a source map's sources come from, the name after the last `node_modules/`, each with
 * its folder on disk, where the bundle was built here.
 */
function packagesOf(mapFile) {
  const map = JSON.parse(fs.readFileSync(path.join(root, mapFile), 'utf8'));
  const sourceRoot = path.resolve(path.dirname(path.join(root, mapFile)), map.sourceRoot ?? '');
  const packages = new Map();
  for (const source of map.sources) {
    const at = source.lastIndexOf('node_modules/');
    if (at < 0) continue;
    const parts = source.slice(at + 'node_modules/'.length).split('/');
    const name = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
    const dir = path.resolve(sourceRoot, source.slice(0, at + 'node_modules/'.length) + name);
    if (!OURS.has(name)) packages.set(name, dir);
  }
  return packages;
}

/** Every bundled package, by name, with the bundles that hold it and where its version comes from. */
function bundled() {
  const packages = new Map();
  for (const { map, from } of BUNDLES) {
    if (!fs.existsSync(path.join(root, map))) {
      throw new Error(`No ${map}: build the extension first.`);
    }
    for (const [name, dir] of packagesOf(map)) {
      const entry = packages.get(name) ?? { name, from, dir, bundles: [] };
      entry.bundles.push(path.basename(map, '.map'));
      packages.set(name, entry);
    }
  }
  return [...packages.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** A folder name for a package's version: `@scope/name` as `@scope+name`. */
const folderOf = (name, version) => `${name.replace('/', '+')}@${version}`;

function check() {
  const record = fs.existsSync(recordFile)
    ? JSON.parse(fs.readFileSync(recordFile, 'utf8'))
    : { packages: [] };
  const recorded = new Set(record.packages.map(p => p.name));
  const missing = bundled().filter(p => !recorded.has(p.name));
  if (missing.length) {
    throw new Error(
      `The bundles hold packages with no notice in licenses/: ${missing.map(p => p.name).join(', ')}.\n` +
        'Run `node tools/third-party.js update`, with the network, and commit licenses/.',
    );
  }
  const out = path.join(root, 'build/licenses');
  fs.rmSync(out, { recursive: true, force: true });
  fs.cpSync(licensesDir, out, { recursive: true });
}

/** The client's lockfile, at the installed client's version: each package's versions, by name. */
async function clientVersions() {
  const { version } = JSON.parse(
    fs.readFileSync(path.join(root, 'node_modules/hypothesis/package.json'), 'utf8'),
  );
  const url = `https://raw.githubusercontent.com/hypothesis/client/v${version}/yarn.lock`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const lock = await response.text();
  const versions = new Map();
  // An entry: `"name@npm:^1.0.0, name@npm:^1.2.0":` then `  version: 1.2.3`.
  for (const [, key, version] of lock.matchAll(/^"?((?:@[^@\s/]+\/)?[^@\s"]+)@[^\n]*:\n {2}version: ([^\s]+)/gm)) {
    versions.set(key, [...new Set([...(versions.get(key) ?? []), version])]);
  }
  return { client: version, versions };
}

/** The installed version of a package the extension's own bundle holds, from where it was bundled from. */
function installedVersion({ name, dir }) {
  const file = path.join(dir, 'package.json');
  if (!fs.existsSync(file)) throw new Error(`${name}: no ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8')).version;
}

/** A published package's license files and its package.json, from its npm tarball. */
async function fromRegistry(name, version) {
  const metaUrl = `https://registry.npmjs.org/${name.replace('/', '%2F')}/${version}`;
  const meta = await (await fetch(metaUrl)).json();
  if (!meta.dist?.tarball) throw new Error(`${metaUrl}: no tarball`);
  const tarball = Buffer.from(await (await fetch(meta.dist.tarball)).arrayBuffer());
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'third-party-'));
  try {
    fs.writeFileSync(path.join(dir, 'package.tgz'), tarball);
    execFileSync('tar', ['-xzf', 'package.tgz'], { cwd: dir });
    // npm tarballs hold one folder, `package/` for most.
    const [top] = fs.readdirSync(dir).filter(f => f !== 'package.tgz');
    const base = path.join(dir, top);
    const files = fs
      .readdirSync(base)
      .filter(f => LICENSE_FILE.test(f) && fs.statSync(path.join(base, f)).isFile())
      .map(f => ({ name: f, text: fs.readFileSync(path.join(base, f), 'utf8') }));
    // Older packages name theirs as `{ type, url }`, or as a list of them.
    const named = meta.license ?? meta.licenses;
    const license = [named].flat().map(l => (typeof l === 'string' ? l : l?.type)).join(' OR ');
    return { license, author: meta.author, files };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function update() {
  const { client, versions } = await clientVersions();
  const packages = [];
  const unlicensed = [];
  fs.rmSync(licensesDir, { recursive: true, force: true });
  fs.mkdirSync(licensesDir, { recursive: true });

  for (const entry of bundled()) {
    const found =
      entry.from === 'client' ? versions.get(entry.name) : [installedVersion(entry)];
    if (!found?.length) throw new Error(`${entry.name}: not in the client's lockfile`);
    // A name with two versions in the lockfile: the source maps can't say which was bundled, so
    // both notices are kept.
    for (const version of found) {
      const { license, author, files } = await fromRegistry(entry.name, version);
      if (!files.length && HYPOTHESIS.test(entry.name)) {
        const text = fs.readFileSync(path.join(root, 'node_modules/hypothesis/LICENSE'), 'utf8');
        files.push({ name: 'LICENSE', text });
      }
      if (!files.length && NO_NOTICE.has(license)) {
        const text = `${entry.name}@${version} is under ${license}, which asks a copy to carry no notice, and publishes no license file.\n`;
        files.push({ name: 'NOTICE', text });
      }
      if (!files.length) {
        unlicensed.push(`${entry.name}@${version} (${license})`);
        continue;
      }
      const folder = folderOf(entry.name, version);
      fs.mkdirSync(path.join(licensesDir, folder));
      for (const file of files) fs.writeFileSync(path.join(licensesDir, folder, file.name), file.text);
      packages.push({
        name: entry.name,
        version,
        license,
        author: typeof author === 'string' ? author : author?.name,
        bundles: entry.bundles,
        notice: files.map(f => `${folder}/${f.name}`),
      });
      console.log(`${entry.name}@${version}: ${license}`);
    }
  }

  if (unlicensed.length) {
    throw new Error(`These publish no license file; give them a notice by hand: ${unlicensed.join(', ')}`);
  }
  fs.writeFileSync(recordFile, JSON.stringify({ client, packages }, null, 2) + '\n');
  fs.writeFileSync(path.join(licensesDir, 'README.md'), readme(client, packages));
}

function readme(client, packages) {
  const rows = packages.map(
    p =>
      `| ${p.name} | ${p.version} | ${p.license ?? '?'} | ${p.bundles.join(', ')} | ${p.notice.map(n => `[${n.split('/')[1]}](./${encodeURI(n)})`).join(', ')} |`,
  );
  return `# Third-party notices

The packages the extension's bundles hold, besides the Hypothesis client and the extension
themselves (\`../LICENSE\`), each with the license files its published package carries. Written by
\`tools/third-party.js update\`, from the bundles' source maps, for client ${client}; the build
checks the bundles hold no others, and copies this folder in as \`licenses/\`.

PDF.js, which the extension carries whole, not bundled, keeps its own notices in \`pdfjs/\`.

| Package | Version | License | In | Notice |
| --- | --- | --- | --- | --- |
${rows.join('\n')}
`;
}

const command = process.argv[2];
if (command === 'check') check();
else if (command === 'update') await update();
else {
  console.error(`Usage: ${path.basename(process.argv[1])} update|check`);
  process.exit(1);
}
