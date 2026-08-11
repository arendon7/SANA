#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const runtimeRequired = args.has('--runtime');
const buildsRequested = args.has('--build');
const results = [];

function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function commandExists(command) {
  const r = spawnSync(command, ['--version'], { cwd: root, stdio: 'ignore', shell: process.platform === 'win32' });
  return r.status === 0;
}
function run(name, command, commandArgs, { required = true, env = process.env } = {}) {
  const r = spawnSync(command, commandArgs, { cwd: root, stdio: 'inherit', env, shell: process.platform === 'win32' });
  const status = r.status === 0 ? 'PASS' : (required ? 'FAIL' : 'PENDING');
  results.push({ name, status, exitCode: r.status });
  if (status === 'FAIL') throw new Error(`${name} failed`);
  return status;
}
function pending(name, reason, required = false) {
  const status = required ? 'FAIL' : 'PENDING';
  results.push({ name, status, reason });
  if (required) throw new Error(`${name}: ${reason}`);
}

try {
  for (const v of ['v017','v018','v019','v020','v0201']) {
    const guard = `scripts/guardrail-${v}.mjs`;
    const validate = `scripts/validate-${v}.mjs`;
    if (!exists(guard)) pending(`guardrail:${v}`, `${guard} missing`, true);
    else run(`guardrail:${v}`, process.execPath, [guard]);
    if (!exists(validate)) pending(`validate:${v}`, `${validate} missing`, true);
    else run(`validate:${v}`, process.execPath, [validate]);
  }

  const tsc = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');
  if (fs.existsSync(tsc)) run('workspace-tsc-build', tsc, ['-b', '--pretty', 'false']);
  else pending('workspace-tsc-build', 'node_modules/.bin/tsc unavailable; run npm ci', runtimeRequired);

  const vitest = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vitest.cmd' : 'vitest');
  if (fs.existsSync(vitest)) run('vitest', vitest, ['run']);
  else pending('vitest', 'node_modules/.bin/vitest unavailable; run npm ci', runtimeRequired);

  if (process.env.DATABASE_URL && commandExists('psql')) {
    run('postgres-postgis-rls', 'bash', ['infra/postgres/tests/run-v0201-db-tests.sh']);
  } else {
    pending('postgres-postgis-rls', 'DATABASE_URL and/or psql unavailable', runtimeRequired);
  }

  if (buildsRequested) {
    if (!exists('package.json')) pending('workspace-builds', 'root package.json missing', runtimeRequired);
    else {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
      const scripts = pkg.scripts || {};
      const commands = [];
      for (const name of ['build','build:web','build:mobile','build:expo','build:vite']) {
        if (scripts[name]) commands.push(name);
      }
      for (const name of Object.keys(scripts).filter((x) => /graphify/i.test(x))) {
        if (!commands.includes(name)) commands.push(name);
      }
      if (!commands.length) pending('workspace-builds', 'no root build/Graphify scripts detected', false);
      for (const name of commands) run(`npm:${name}`, 'npm', ['run', name]);
      run('workspace-build-if-present', 'npm', ['run', '--workspaces', '--if-present', 'build'], { required: runtimeRequired });
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
}

const failed = results.some((r) => r.status === 'FAIL');
const pendingCount = results.filter((r) => r.status === 'PENDING').length;
console.log(JSON.stringify({
  status: failed ? 'FAIL' : (pendingCount ? 'PASS_WITH_PENDING' : 'PASS'),
  runtimeRequired,
  results
}, null, 2));
process.exit(failed ? 1 : 0);
