import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Store, Thread } from './store.ts';
import { addCommentSchema, createThreadSchema, listQuerySchema, updateThreadSchema } from './schema.ts';

export interface AppOptions {
  store: Store;
  notify?: (thread: Thread) => Promise<void>;
}

export function createApp({ store, notify }: AppOptions) {
  const app = new Hono();
  app.use('*', cors());

  app.get('/health', (c) => c.json({ ok: true }));

  app.get('/threads', (c) => {
    const query = listQuerySchema.safeParse(c.req.query());
    if (!query.success) return c.json({ error: query.error.issues }, 400);
    const { host, project, branch, route } = query.data;
    return c.json(store.list(host, project, branch, route));
  });

  app.post('/threads', async (c) => {
    const body = createThreadSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: body.error.issues }, 400);
    const thread = store.createThread(body.data);
    if (notify) notify(thread).catch((error) => console.error('notify failed', error));
    return c.json(thread, 201);
  });

  app.get('/threads/:id', (c) => {
    const thread = store.get(c.req.param('id'));
    return thread ? c.json(thread) : c.json({ error: 'not found' }, 404);
  });

  app.post('/threads/:id/comments', async (c) => {
    const body = addCommentSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: body.error.issues }, 400);
    const comment = store.addComment(c.req.param('id'), body.data);
    return comment ? c.json(comment, 201) : c.json({ error: 'not found' }, 404);
  });

  app.patch('/threads/:id', async (c) => {
    const body = updateThreadSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: body.error.issues }, 400);
    const thread = store.setResolved(c.req.param('id'), body.data.resolved);
    return thread ? c.json(thread) : c.json({ error: 'not found' }, 404);
  });

  app.delete('/threads/:id', (c) => (store.delete(c.req.param('id')) ? c.body(null, 204) : c.json({ error: 'not found' }, 404)));

  return app;
}
