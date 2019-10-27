/**
 * This script reads the version from package.json and writes it into
 * the sonar-project.properties file's sonar.projectVersion field.
 *
 * Runs automatically on `npm version`.
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const sonarVersionRegex = /(sonar\.projectVersion=)[^\s]*/;

const currentDir = dirname(fileURLToPath(import.meta.url));

const packageJsonPath = join(currentDir, '..', 'package.json');
const packageJsonContents = readFileSync(packageJsonPath, { encoding: 'utf-8' });
const packageJson = JSON.parse(packageJsonContents);

const sonarPropsPath = join(currentDir, '..', 'sonar-project.properties');
let sonarProps = readFileSync(sonarPropsPath, { encoding: 'utf-8' });
sonarProps = sonarProps.replace(sonarVersionRegex, `$1${packageJson.version}`);
writeFileSync(sonarPropsPath, sonarProps, { encoding: 'utf-8' });
