import { App } from 'octokit';
import { EmitterWebhookEvent } from '@octokit/webhooks';
import { lint, LintResult } from './lint.js';

type Repository = EmitterWebhookEvent<'pull_request'>['payload']['repository'];
type PullRequest = EmitterWebhookEvent<'pull_request'>['payload']['pull_request'];

async function lintPullRequest(octokit: App['octokit'], repo: Repository, pr: PullRequest): Promise<LintResult> {
  console.log(`Linting PR ${pr.url}`);
  const commits = await octokit.paginate('GET /repos/{owner}/{repo}/pulls/{pull_number}/commits', {
    owner: repo.owner.login,
    repo: repo.name,
    pull_number: pr.number,
    per_page: 100,
  });
  const commitMessages = commits.map((c) => c.commit.message);
  return lint([pr.title, ...commitMessages]);
}

async function withinCheckRun(
  octokit: App['octokit'],
  repo: Repository,
  head_sha: string,
  fn: () => Promise<LintResult>,
) {
  const run = await octokit.request('POST /repos/{owner}/{repo}/check-runs', {
    owner: repo.owner.login,
    repo: repo.name,
    name: 'Commit Lint',
    head_sha,
    status: 'in_progress',
  });
  const result = await fn();
  await octokit.request('PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}', {
    owner: repo.owner.login,
    repo: repo.name,
    check_run_id: run.data.id,
    conclusion: result.valid ? 'success' : 'failure',
    output: {
      title: result.title,
      summary: result.summary,
    },
  });
}

export default function register(app: App) {
  app.webhooks.on(
    ['pull_request.opened', 'pull_request.reopened', 'pull_request.synchronize'],
    ({ octokit, payload }) =>
      withinCheckRun(octokit, payload.repository, payload.pull_request.head.sha, () =>
        lintPullRequest(octokit, payload.repository, payload.pull_request),
      ),
  );
  app.webhooks.on(['check_suite.requested', 'check_suite.rerequested'], ({ octokit, payload }) => {
    // Pull requests have a different linting process
    if (payload.check_suite.pull_requests.length) return Promise.resolve();
    return withinCheckRun(octokit, payload.repository, payload.check_suite.head_sha, () =>
      // we only lint the current commit message if it is not in a pull request
      lint([payload.check_suite.head_commit.message]),
    );
  });
}
