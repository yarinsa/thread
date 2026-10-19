import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { anchorSchema, type AddComment, type Anchor, type CreateThread } from './schema.ts';

export interface Comment {
  id: string;
  threadId: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface Thread {
  id: string;
  project: string;
  branch: string;
  author: string;
  anchor: Anchor;
  resolved: boolean;
  createdAt: string;
  comments: Comment[];
}

interface ThreadRow {
  id: string;
  project: string;
  branch: string;
  author: string;
  anchor: string;
  resolved: number;
  created_at: string;
}

interface CommentRow {
  id: string;
  thread_id: string;
  author: string;
  body: string;
  created_at: string;
}

const LIST_LIMIT = 500;

export class Store {
  private readonly db: DatabaseSync;

  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        project TEXT NOT NULL,
        branch TEXT NOT NULL,
        author TEXT NOT NULL,
        anchor TEXT NOT NULL,
        route TEXT NOT NULL,
        resolved INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS threads_scope ON threads (project, branch, route);
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS comments_thread ON comments (thread_id, created_at);
    `);
    this.db.exec('PRAGMA foreign_keys = ON');
  }

  list(project: string, branch: string, route?: string): Thread[] {
    const rows = route
      ? this.db
          .prepare('SELECT * FROM threads WHERE project = ? AND branch = ? AND route = ? ORDER BY created_at LIMIT ?')
          .all(project, branch, route, LIST_LIMIT)
      : this.db
          .prepare('SELECT * FROM threads WHERE project = ? AND branch = ? ORDER BY created_at LIMIT ?')
          .all(project, branch, LIST_LIMIT);
    return (rows as unknown as ThreadRow[]).map((row) => this.hydrate(row));
  }

  get(id: string): Thread | undefined {
    const row = this.db.prepare('SELECT * FROM threads WHERE id = ?').get(id) as unknown as ThreadRow | undefined;
    return row ? this.hydrate(row) : undefined;
  }

  createThread(input: CreateThread): Thread {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db
      .prepare('INSERT INTO threads (id, project, branch, author, anchor, route, resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)')
      .run(id, input.project, input.branch, input.author, JSON.stringify(input.anchor), input.anchor.route, now);
    this.insertComment(id, { author: input.author, body: input.body }, now);
    return this.get(id)!;
  }

  addComment(threadId: string, input: AddComment): Comment | undefined {
    if (!this.get(threadId)) return undefined;
    return this.insertComment(threadId, input, new Date().toISOString());
  }

  setResolved(id: string, resolved: boolean): Thread | undefined {
    const result = this.db.prepare('UPDATE threads SET resolved = ? WHERE id = ?').run(resolved ? 1 : 0, id);
    return result.changes === 0 ? undefined : this.get(id);
  }

  delete(id: string): boolean {
    return this.db.prepare('DELETE FROM threads WHERE id = ?').run(id).changes > 0;
  }

  private insertComment(threadId: string, input: AddComment, createdAt: string): Comment {
    const id = randomUUID();
    this.db
      .prepare('INSERT INTO comments (id, thread_id, author, body, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, threadId, input.author, input.body, createdAt);
    return { id, threadId, author: input.author, body: input.body, createdAt };
  }

  private hydrate(row: ThreadRow): Thread {
    const comments = (
      this.db.prepare('SELECT * FROM comments WHERE thread_id = ? ORDER BY created_at LIMIT ?').all(row.id, LIST_LIMIT) as unknown as CommentRow[]
    ).map((c) => ({ id: c.id, threadId: c.thread_id, author: c.author, body: c.body, createdAt: c.created_at }));
    return {
      id: row.id,
      project: row.project,
      branch: row.branch,
      author: row.author,
      anchor: anchorSchema.parse(JSON.parse(row.anchor)),
      resolved: row.resolved === 1,
      createdAt: row.created_at,
      comments
    };
  }
}
