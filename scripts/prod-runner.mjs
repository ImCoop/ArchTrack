import { spawn } from 'node:child_process';
import process from 'node:process';

const args = new Set(process.argv.slice(2));
const updaterEnabled = args.has('-prod');
const pollIntervalMs = Number(process.env.PROD_UPDATE_INTERVAL_MS ?? 120000);
const repoRemote = process.env.PROD_UPDATE_REMOTE ?? 'origin';
const repoBranch = process.env.PROD_UPDATE_BRANCH;
const rootDir = process.cwd();

let backendProcess;
let frontendProcess;
let pollTimer;
let shuttingDown = false;
let updateInProgress = false;

const timestamp = () => new Date().toISOString();
const log = (message) => console.log(`[prod-runner ${timestamp()}] ${message}`);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function spawnCommand(command, commandArgs, options = {}) {
  return spawn(command, commandArgs, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, NODE_ENV: 'production' },
    ...options,
  });
}

function runCommand(command, commandArgs, label) {
  return new Promise((resolve, reject) => {
    log(`${label}...`);
    const child = spawnCommand(command, commandArgs);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code ?? 'unknown'}.`));
    });
    child.on('error', reject);
  });
}

function currentBranch() {
  return new Promise((resolve, reject) => {
    let output = '';
    const child = spawn('git', ['branch', '--show-current'], {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'inherit'],
      shell: process.platform === 'win32',
    });

    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(output.trim() || 'main');
        return;
      }

      reject(new Error('Unable to determine current git branch.'));
    });
    child.on('error', reject);
  });
}

function gitOutput(gitArgs) {
  return new Promise((resolve, reject) => {
    let output = '';
    const child = spawn('git', gitArgs, {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'inherit'],
      shell: process.platform === 'win32',
    });

    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(output.trim());
        return;
      }

      reject(new Error(`git ${gitArgs.join(' ')} failed.`));
    });
    child.on('error', reject);
  });
}

async function ensureCleanWorktree() {
  const status = await gitOutput(['status', '--porcelain']);
  if (status) {
    throw new Error('Updater refused to run because the production worktree has uncommitted changes.');
  }
}

async function ensureBuilt() {
  await runCommand('npm.cmd', ['run', 'build'], 'Building application');
}

async function startServices() {
  if (backendProcess || frontendProcess) {
    return;
  }

  log('Starting production services.');
  backendProcess = spawnCommand('npm.cmd', ['run', 'start', '--workspace', '@archtrack/backend']);
  frontendProcess = spawnCommand('npm.cmd', ['run', 'preview', '--workspace', '@archtrack/frontend']);

  backendProcess.on('exit', (code) => {
    log(`Backend exited with code ${code ?? 'unknown'}.`);
    backendProcess = undefined;
    if (!shuttingDown && !updateInProgress) {
      void shutdown(code ?? 1);
    }
  });

  frontendProcess.on('exit', (code) => {
    log(`Frontend exited with code ${code ?? 'unknown'}.`);
    frontendProcess = undefined;
    if (!shuttingDown && !updateInProgress) {
      void shutdown(code ?? 1);
    }
  });
}

async function stopServices() {
  const children = [backendProcess, frontendProcess].filter(Boolean);
  backendProcess = undefined;
  frontendProcess = undefined;

  if (!children.length) {
    return;
  }

  log('Stopping production services.');
  await Promise.all(
    children.map(
      (child) =>
        new Promise((resolve) => {
          child.once('exit', () => resolve());
          child.kill('SIGTERM');
          setTimeout(() => {
            if (!child.killed) {
              child.kill('SIGKILL');
            }
          }, 10000).unref();
        }),
    ),
  );
}

async function applyUpdate(branch) {
  await ensureCleanWorktree();
  await runCommand('git', ['fetch', repoRemote, branch], `Fetching ${repoRemote}/${branch}`);

  const localHead = await gitOutput(['rev-parse', 'HEAD']);
  const remoteHead = await gitOutput(['rev-parse', `${repoRemote}/${branch}`]);

  if (localHead === remoteHead) {
    log('No remote changes detected.');
    return false;
  }

  log(`New commit detected on ${repoRemote}/${branch}. Updating.`);
  await stopServices();

  try {
    await runCommand('git', ['pull', '--ff-only', repoRemote, branch], 'Pulling latest code');
    await runCommand('npm.cmd', ['install'], 'Installing dependencies');
    await ensureBuilt();
  } finally {
    await startServices();
  }

  log('Update applied and services restarted.');
  return true;
}

async function pollForUpdates() {
  if (!updaterEnabled || updateInProgress || shuttingDown) {
    return;
  }

  updateInProgress = true;

  try {
    const branch = repoBranch || (await currentBranch());
    await applyUpdate(branch);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown update failure.';
    log(message);
    if (!backendProcess || !frontendProcess) {
      await startServices();
    }
  } finally {
    updateInProgress = false;
  }
}

async function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  if (pollTimer) {
    clearInterval(pollTimer);
  }
  await stopServices();
  process.exit(code);
}

async function main() {
  log(`Production runner starting${updaterEnabled ? ' with updater enabled (-prod).' : '.'}`);
  await ensureBuilt();
  await startServices();

  if (updaterEnabled) {
    log(`Updater polling every ${Math.round(pollIntervalMs / 1000)} seconds.`);
    pollTimer = setInterval(() => {
      void pollForUpdates();
    }, pollIntervalMs);
    pollTimer.unref();
    await wait(5000);
    void pollForUpdates();
  }
}

process.on('SIGINT', () => {
  void shutdown(0);
});
process.on('SIGTERM', () => {
  void shutdown(0);
});

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Production runner failed to start.';
  log(message);
  process.exit(1);
});
