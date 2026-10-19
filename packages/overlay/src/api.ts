import type { Anchor, Comment, OverlayConfig, Thread } from './types';

export class ApiClient {
  constructor(private readonly config: OverlayConfig) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.api}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers }
    });
    if (!response.ok) throw new Error(`review-overlay API ${response.status} on ${path}`);
    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  }

  listThreads(route: string): Promise<Thread[]> {
    const { project, branch } = this.config;
    const query = new URLSearchParams({ project, branch, route });
    return this.request(`/threads?${query}`);
  }

  getThread(id: string): Promise<Thread> {
    return this.request(`/threads/${id}`);
  }

  createThread(anchor: Anchor, body: string): Promise<Thread> {
    const { project, branch, author } = this.config;
    return this.request('/threads', { method: 'POST', body: JSON.stringify({ project, branch, author, body, anchor }) });
  }

  addComment(threadId: string, body: string): Promise<Comment> {
    return this.request(`/threads/${threadId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ author: this.config.author, body })
    });
  }

  setResolved(threadId: string, resolved: boolean): Promise<Thread> {
    return this.request(`/threads/${threadId}`, { method: 'PATCH', body: JSON.stringify({ resolved }) });
  }

  deleteThread(threadId: string): Promise<void> {
    return this.request(`/threads/${threadId}`, { method: 'DELETE' });
  }
}
