import {execFile} from 'child_process';
import {promisify} from 'util';

const execFileAsync = promisify(execFile);
const GIT_DIFF_TIMEOUT_MS = 10_000;

export async function getGitDiff(workingDirectory: string): Promise<string | null> {
  try {
    const {stdout} = await execFileAsync('git', ['diff', 'HEAD'], {
      cwd: workingDirectory,
      timeout: GIT_DIFF_TIMEOUT_MS,
    });
    const diff = stdout.trim();
    return diff.length > 0 ? diff : null;
  } catch {
    return null;
  }
}
