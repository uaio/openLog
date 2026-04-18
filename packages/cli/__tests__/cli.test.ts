import { describe, it, expect } from 'vitest';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '..', 'bin', 'openlog.js');

function run(...args: string[]) {
  return execFileAsync('node', [CLI_PATH, ...args]);
}

function runExpectFail(...args: string[]) {
  return execFileAsync('node', [CLI_PATH, ...args]).catch((err) => err);
}

describe('CLI --help', () => {
  it('--help prints usage info and exits 0', async () => {
    const { stdout } = await run('--help');
    expect(stdout).toContain('openLog');
    expect(stdout).toContain('用法');
    expect(stdout).toContain('--port');
    expect(stdout).toContain('--help');
    expect(stdout).toContain('--version');
  });

  it('-h is alias for --help', async () => {
    const { stdout } = await run('-h');
    expect(stdout).toContain('openLog');
    expect(stdout).toContain('用法');
  });

  it('--help and -h produce identical output', async () => {
    const long = await run('--help');
    const short = await run('-h');
    expect(long.stdout).toBe(short.stdout);
  });
});

describe('CLI --version', () => {
  it('--version prints a semver string', async () => {
    const { stdout } = await run('--version');
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('-v is alias for --version', async () => {
    const { stdout } = await run('-v');
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('--version and -v produce identical output', async () => {
    const long = await run('--version');
    const short = await run('-v');
    expect(long.stdout).toBe(short.stdout);
  });
});

describe('CLI port validation', () => {
  it('rejects non-numeric port', async () => {
    const err = await runExpectFail('-p', 'abc');
    expect(err.code).not.toBe(0);
    expect(err.stderr).toContain('端口号必须是数字');
  });

  it('rejects port 0', async () => {
    const err = await runExpectFail('-p', '0');
    expect(err.code).not.toBe(0);
    expect(err.stderr).toContain('1-65535');
  });

  it('rejects port above 65535', async () => {
    const err = await runExpectFail('-p', '70000');
    expect(err.code).not.toBe(0);
    expect(err.stderr).toContain('1-65535');
  });

  it('rejects negative port', async () => {
    const err = await runExpectFail('--port=-1');
    expect(err.code).not.toBe(0);
    expect(err.stderr).toContain('1-65535');
  });
});

describe('CLI unknown option', () => {
  it('rejects unknown flags', async () => {
    const err = await runExpectFail('--unknown-flag');
    expect(err.code).not.toBe(0);
  });
});
