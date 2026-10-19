import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { slackNotifier } from './slack.ts';
import { Store } from './store.ts';

const port = Number(process.env.PORT ?? 4747);
const store = new Store(process.env.DB_PATH ?? './review-overlay.db');
const webhook = process.env.SLACK_WEBHOOK_URL;
const notify = webhook ? slackNotifier(webhook, process.env.PUBLIC_APP_URL) : undefined;

serve({ fetch: createApp({ store, notify }).fetch, port }, () => {
  console.log(`review-overlay server listening on :${port}`);
});
