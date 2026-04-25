#!/usr/bin/env node

/**
 * 统一更新所有包的版本号，并可选地创建 git tag。
 *
 * 用法：
 *   node scripts/bump-version.mjs <version> [--tag]
 *
 * 示例：
 *   node scripts/bump-version.mjs 0.2.1          # 只更新版本号
 *   node scripts/bump-version.mjs 0.2.1 --tag    # 更新版本号 + commit + tag
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const version = process.argv[2];
const shouldTag = process.argv.includes('--tag');

if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error('Usage: node scripts/bump-version.mjs <version> [--tag]');
  console.error('Example: node scripts/bump-version.mjs 0.2.1 --tag');
  process.exit(1);
}

const packages = [
  '', // root package.json
  'packages/types',
  'packages/sdk',
  'packages/server',
  'packages/web',
  'packages/mcp',
  'packages/cli',
  'packages/eruda',
  'packages/demo',
];

let changed = 0;

for (const pkg of packages) {
  const path = resolve(root, pkg, 'package.json');
  let json;
  try {
    json = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    continue;
  }

  if (json.version === version) {
    console.log(`  skip ${pkg || 'root'} (already ${version})`);
    continue;
  }

  json.version = version;
  writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
  console.log(`  updated ${pkg || 'root'}: ${json.version}`);
  changed++;
}

if (changed === 0) {
  console.log('All packages already at version', version);
  process.exit(0);
}

console.log(`\nUpdated ${changed} package(s) to v${version}`);

if (shouldTag) {
  execSync('git add **/package.json package.json', { stdio: 'inherit', cwd: root });
  execSync(`git commit -m "chore: bump version to v${version}"`, { stdio: 'inherit', cwd: root });
  execSync(`git tag v${version}`, { stdio: 'inherit', cwd: root });
  console.log(`\nCommitted and tagged v${version}. Push with:`);
  console.log(`  git push origin main v${version}`);
} else {
  console.log('\nTo commit and tag manually:');
  console.log(`  git add -A && git commit -m "chore: bump version to v${version}" && git tag v${version}`);
}
