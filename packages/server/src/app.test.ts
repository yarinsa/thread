import { describe, expect, it } from 'vitest';
import { createApp } from './app.ts';
import { Store } from './store.ts';

const anchor = { selector: '[data-testid="save"]', route: '/settings', offsetX: 0.5, offsetY: 0.5 };
const threadInput = { project: 'portal', branch: 'feat-x', author: 'yarin', body: 'Button label is off', anchor };

function setup() {
  const app = createApp({ store: new Store() });
  const json = (method: string, path: string, body?: unknown) =>
    app.request(path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { app, json };
}

describe('threads', () => {
  it('creates a thread with its first comment and lists it by scope', async () => {
    const { json } = setup();
    const created = await (await json('POST', '/threads', threadInput)).json();
    expect(created.comments).toHaveLength(1);
    expect(created.resolved).toBe(false);

    const list = await (await json('GET', '/threads?project=portal&branch=feat-x&route=/settings')).json();
    expect(list.map((t: { id: string }) => t.id)).toEqual([created.id]);
  });

  it('scopes listing by project and branch', async () => {
    const { json } = setup();
    await json('POST', '/threads', threadInput);
    await json('POST', '/threads', { ...threadInput, branch: 'main' });
    const list = await (await json('GET', '/threads?project=portal&branch=main')).json();
    expect(list).toHaveLength(1);
    const other = await (await json('GET', '/threads?project=other&branch=main')).json();
    expect(other).toHaveLength(0);
  });

  it('rejects invalid payloads', async () => {
    const { json } = setup();
    expect((await json('POST', '/threads', { project: 'portal' })).status).toBe(400);
    expect((await json('GET', '/threads')).status).toBe(400);
  });

  it('appends comments, resolves and deletes', async () => {
    const { json } = setup();
    const created = await (await json('POST', '/threads', threadInput)).json();
    const reply = await json('POST', `/threads/${created.id}/comments`, { author: 'dana', body: 'Fixed' });
    expect(reply.status).toBe(201);
    const resolved = await (await json('PATCH', `/threads/${created.id}`, { resolved: true })).json();
    expect(resolved.resolved).toBe(true);
    expect(resolved.comments).toHaveLength(2);
    expect((await json('DELETE', `/threads/${created.id}`)).status).toBe(204);
    expect((await json('GET', `/threads/${created.id}`)).status).toBe(404);
  });

  it('returns 404 for unknown threads', async () => {
    const { json } = setup();
    expect((await json('POST', '/threads/nope/comments', { author: 'a', body: 'b' })).status).toBe(404);
    expect((await json('PATCH', '/threads/nope', { resolved: true })).status).toBe(404);
  });
});
