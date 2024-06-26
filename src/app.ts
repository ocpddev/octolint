import { App } from 'octokit';
import { createNodeMiddleware } from '@octokit/webhooks';
import http from 'http';
import config from './config.js';

import { register } from './mod.js';
import commit from './commit/index.js';

const app = new App({
  appId: config.appId,
  privateKey: config.privateKey,
  webhooks: {
    secret: config.webhookSecret,
  },
});

const appInfo = (await app.octokit.request('GET /app')).data;
console.log(`Authenticated as '${appInfo.name}'`);

register(app, commit);

// we only need webhook middleware in this app
// by default, octokit will also register OAuth handlers,
// which we don't need, and it requires additional setup
const middleware = createNodeMiddleware(app.webhooks);
http.createServer(middleware).listen(config.port, () => {
  console.log(`Listening on http://0.0.0.0:${config.port}`);
});
