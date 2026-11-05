import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const args = process.argv.slice(2).filter((arg) => !['--runInBand', '--run-in-band'].includes(arg));
const envFile = process.env.E2E_ENV_FILE ?? '.env.e2e.local';

if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^(?:export\s+)?([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;

    const value = match[2].trim();
    process.env[match[1]] =
      value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
        ? value.slice(1, -1)
        : value;
  }
}

const unittestArgs = args.length > 0
  ? ['-m', 'unittest', ...args]
  : ['-m', 'unittest', 'discover', '-s', 'selenium_tests', '-t', '.', '-v'];
const result = spawnSync('python3', unittestArgs, {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
