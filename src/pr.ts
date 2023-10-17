import { App } from 'octokit';
import lint from './lint.js';
import { PullRequest, Repository } from '@octokit/webhooks-types';

export default function (app: App) {
  app.webhooks.on(
    ['pull_request.opened', 'pull_request.reopened', 'pull_request.synchronize'],
    ({ octokit, payload }) => lintCommits(octokit, payload.repository, payload.pull_request),
  );
}

async function lintCommits(octokit: App['octokit'], repo: Repository, pr: PullRequest) {
  console.log(`Linting commits for PR ${pr.url}`);
  const run = await octokit.request('POST /repos/{owner}/{repo}/check-runs', {
    owner: repo.owner.login,
    repo: repo.name,
    name: 'Commit Lint',
    head_sha: pr.head.sha,
    status: 'in_progress',
  });
  const commits = await octokit.paginate('GET /repos/{owner}/{repo}/pulls/{pull_number}/commits', {
    owner: repo.owner.login,
    repo: repo.name,
    pull_number: pr.number,
    per_page: 100,
  });

  const messages = commits.map((c) => c.commit.message);
  const result = await lint(messages);
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
