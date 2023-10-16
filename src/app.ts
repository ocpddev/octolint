import './env.js';
import config from './config.js';
import { App } from 'octokit';
import { createNodeMiddleware } from '@octokit/webhooks';
import http from 'http';
import lint from './lint.js';

const app = new App({
  appId: config.appId,
  privateKey: config.privateKey,
  webhooks: {
    secret: config.webhookSecret,
  },
});

const appInfo = (await app.octokit.request('GET /app')).data;
console.log(`Authenticated as '${appInfo.name}'`);

app.webhooks.on(['check_suite.requested', 'check_suite.rerequested'], async ({ octokit, payload }) => {
  payload.check_suite.pull_requests;
  const { check_suite, repository } = payload;
  console.log(`Received a check suite request: ${check_suite.url}`);
  const checkRunResp = await octokit.request('POST /repos/{owner}/{repo}/check-runs', {
    owner: repository.owner.login,
    repo: repository.name,
    name: 'Commit Lint',
    head_sha: check_suite.head_sha,
    status: 'in_progress',
  });
  const checkRunId = checkRunResp.data.id;

  const result = await lint(check_suite.head_commit.message);
  await octokit.request('PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}', {
    owner: repository.owner.login,
    repo: repository.name,
    check_run_id: checkRunId,
    conclusion: result.valid ? 'success' : 'failure',
    output: {
      title: result.valid ? 'Commit message is valid' : 'Commit message is invalid',
      summary:
        `${result.valid ? '✅' : '❌'} ${result.valid ? 'Valid' : 'Invalid'} commit message` +
        `${result.valid ? '' : `\n${result.errors.map((e) => `* ${e.message}`).join('\n')}`}`,
    },
  });
});

const middleware = createNodeMiddleware(app.webhooks, { path: '/' });
http.createServer(middleware).listen(config.port, () => {
  console.log(`Listening on http://0.0.0.0:${config.port}`);
});
