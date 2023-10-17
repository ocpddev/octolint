import './env.js';
import config from './config.js';
import { App } from 'octokit';
import { createNodeMiddleware } from '@octokit/webhooks';
import http from 'http';
import on_pr from './pr.js';

const app = new App({
  appId: config.appId,
  privateKey: config.privateKey,
  webhooks: {
    secret: config.webhookSecret,
  },
});

const appInfo = (await app.octokit.request('GET /app')).data;
console.log(`Authenticated as '${appInfo.name}'`);

on_pr(app);

const middleware = createNodeMiddleware(app.webhooks, { path: '/' });
http.createServer(middleware).listen(config.port, () => {
  console.log(`Listening on http://0.0.0.0:${config.port}`);
});
