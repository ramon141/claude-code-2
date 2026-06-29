import {execFile} from 'child_process';
import {promisify} from 'util';

const execFileAsync = promisify(execFile);
const GIT_DIFF_TIMEOUT_MS = 10_000;

export async function snapshotWorkingTree(workingDirectory: string): Promise<string | null> {
  try {
    const {stdout: stashOut} = await execFileAsync('git', ['stash', 'create'], {
      cwd: workingDirectory,
      timeout: GIT_DIFF_TIMEOUT_MS,
    });
    const stashHash = stashOut.trim();
    if (stashHash) return stashHash;

    const {stdout: headOut} = await execFileAsync('git', ['rev-parse', 'HEAD'], {
      cwd: workingDirectory,
      timeout: GIT_DIFF_TIMEOUT_MS,
    });
    return headOut.trim() || null;
  } catch {
    return null;
  }
}

export async function restoreWorkingTree(workingDirectory: string, baseRef: string): Promise<void> {
  await execFileAsync('git', ['checkout', baseRef, '--', '.'], {
    cwd: workingDirectory,
    timeout: GIT_DIFF_TIMEOUT_MS,
  });
}

export async function getGitDiff(workingDirectory: string, baseRef: string | null): Promise<string | null> {
  try {
    const ref = baseRef ?? 'HEAD';
    const {stdout} = await execFileAsync('git', ['diff', ref], {
      cwd: workingDirectory,
      timeout: GIT_DIFF_TIMEOUT_MS,
    });
    const diff = stdout.trim();
    return diff.length > 0 ? diff : null;
  } catch {
    return null;
  }
}
