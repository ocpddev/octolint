import * as fs from 'fs';

const portStr = process.env.PORT;
const port = portStr ? parseInt(portStr) : 3000;

const appId = process.env.APP_ID;
if (!appId) throw new Error('APP ID is not configured');

const privateKeyPath = process.env.PRIVATE_KEY;
if (!privateKeyPath) throw new Error('Private key is not configured');

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

const webhookSecret = process.env.WEBHOOK_SECRET;
if (!webhookSecret) throw new Error('Webhook secret is not configured');

export default {
  port,
  appId,
  privateKey,
  webhookSecret,
};
