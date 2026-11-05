#!/usr/bin/env node

/**
 * Outputs a JSON object representing the extension settings based on a settings
 * file and the package environment.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import gitDescribe from 'git-describe';
const { gitDescribeSync } = gitDescribe;

// Suppress (expected) EPIPE errors on STDOUT
process.stdout.on('error', err => {
  if (err.code === 'EPIPE') {
    process.exit();
  }
});

/**
 * getVersion gives the extension's version, applying the following rules:
 *
 * - If buildType is 'production' and the git state is not clean, throw an error
 * - Set the version number to package.json's version.
 * - If the buildType is 'production', set the version name to "Official Build",
 *   otherwise set it to a string of the form "gXXXXXXX[.dirty]" to reflect the
 *   exact commit and state of the repository.
 */
function getVersion(buildType) {
  // The fork's version is its package.json's: in this repository, `git describe` finds the
  // repository's own tags, not the extension's.
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')));
  const gitInfo = gitDescribeSync({ match: 'no-such-tag-*' });

  if (buildType === 'production' && gitInfo.dirty) {
    throw new Error('cannot create production build with dirty git state!');
  }

  const version = pkg.version;
  let versionName = 'Official Build';

  if (buildType !== 'production') {
    versionName = `${gitInfo.hash}${gitInfo.dirty ? '.dirty' : ''}`;
  }

  return { version, versionName };
}

if (process.argv.length !== 3) {
  console.error('Usage: %s <settings.json>', path.basename(process.argv[1]));
  process.exit(1);
}

const settings = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), process.argv[2])),
);
const settingsOut = {
  ...settings,
  ...getVersion(settings.buildType),
};

if (settingsOut.sentryPublicDSN) {
  settingsOut.raven = {
    dsn: settingsOut.sentryPublicDSN,
    release: settingsOut.version,
  };
}

console.log(JSON.stringify(settingsOut));
