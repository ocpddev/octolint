const portEnv = process.env.PORT;
const port = portEnv ? parseInt(portEnv) : 3000;

const appId = process.env.APP_ID;
if (!appId) throw new Error('APP ID is not configured');

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) throw new Error('Private key is not configured');

const webhookSecret = process.env.WEBHOOK_SECRET;
if (!webhookSecret) throw new Error('Webhook secret is not configured');

export default {
  port,
  appId,
  privateKey,
  webhookSecret,
};
