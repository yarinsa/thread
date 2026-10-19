import type { Thread } from './store.ts';

export function slackNotifier(webhookUrl: string, publicBaseUrl?: string) {
  return async (thread: Thread) => {
    const first = thread.comments[0];
    const link = publicBaseUrl ? `${publicBaseUrl}${thread.anchor.route}?rc=${thread.id}` : thread.anchor.route;
    const text = `*${thread.author}* commented on \`${thread.project}@${thread.branch}\` at ${link}\n> ${first?.body ?? ''}`;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error(`slack webhook responded ${response.status}`);
  };
}
