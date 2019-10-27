/**
 * This script reads the version field from package.json
 * and checks if the current git HEAD has a matching tag.
 *
 * E.g. if the current version is '1.0.0', the matching tag is 'v1.0.0'.
 *
 * Runs automatically on `npm publish`.
 */

import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { stdout } = spawnSync('git', ['describe', '--tags', '--exact-match'], { encoding: 'utf-8' });
const tag = stdout.trim();

const currentDir = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(currentDir, '..', 'package.json');
const packageJsonContents = readFileSync(packageJsonPath, { encoding: 'utf-8' });
const packageJson = JSON.parse(packageJsonContents);
const packageVersion = packageJson.version;

if (tag !== `v${packageVersion}`) {
    if (tag) {
        console.log(
            `Current tag (${tag}) does not match package version (${packageVersion}). Publishing from wrong branch?`,
        );
    } else {
        console.log(`Current commit has no tag. Publishing from wrong branch?`);
    }
    process.exit(1);
}
