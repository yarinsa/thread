import { anchorFor, pinPosition } from './anchor';
import { ApiClient } from './api';
import { styles } from './styles';
import type { OverlayConfig, Thread } from './types';

type Mode = 'idle' | 'commenting';

const SHARE_PARAM = 'rc';

export class Overlay {
  private readonly api: ApiClient;
  private readonly root: ShadowRoot;
  private readonly host: HTMLElement;
  private threads: Thread[] = [];
  private mode: Mode = 'idle';
  private activeThreadId: string | null = null;
  private draft: { anchor: ReturnType<typeof anchorFor>; x: number; y: number } | null = null;
  private listOpen = false;
  private showResolved = false;
  private route = window.location.pathname;
  private raf = 0;

  constructor(private readonly config: OverlayConfig) {
    this.api = new ApiClient(config);
    this.host = document.createElement('div');
    this.host.setAttribute('data-review-overlay', '');
    this.root = this.host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = styles;
    this.root.append(style);
    document.body.append(this.host);

    document.addEventListener('click', this.onDocumentClick, true);
    document.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('scroll', this.scheduleRender, true);
    window.addEventListener('resize', this.scheduleRender);
    window.addEventListener('popstate', this.onRouteChange);
    this.patchHistory();

    void this.load();
  }

  private patchHistory() {
    const wrap = (method: 'pushState' | 'replaceState') => {
      const original = history[method].bind(history);
      history[method] = (...args: Parameters<History['pushState']>) => {
        original(...args);
        this.onRouteChange();
      };
    };
    wrap('pushState');
    wrap('replaceState');
  }

  private onRouteChange = () => {
    if (window.location.pathname === this.route) return;
    this.route = window.location.pathname;
    this.activeThreadId = null;
    this.draft = null;
    void this.load();
  };

  private async load() {
    this.threads = await this.api.listThreads(this.route);
    const shared = new URLSearchParams(window.location.search).get(SHARE_PARAM);
    if (shared && this.threads.some((t) => t.id === shared)) this.activeThreadId = shared;
    this.render();
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.mode = 'idle';
      this.draft = null;
      this.activeThreadId = null;
      this.listOpen = false;
      this.render();
    }
  };

  private onDocumentClick = (event: MouseEvent) => {
    if (this.mode !== 'commenting') return;
    const path = event.composedPath();
    if (path.includes(this.host)) return;
    const target = path.find((node): node is Element => node instanceof Element && node !== document.documentElement && node !== document.body);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    this.draft = { anchor: anchorFor(target, event.clientX, event.clientY), x: event.clientX, y: event.clientY };
    this.activeThreadId = null;
    this.mode = 'idle';
    this.render();
  };

  private scheduleRender = () => {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.render());
  };

  private el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> & { className?: string } = {}, ...children: (Node | string)[]) {
    const node = document.createElement(tag);
    Object.assign(node, props);
    node.append(...children);
    return node;
  }

  private render() {
    for (const child of Array.from(this.root.children)) if (child.tagName !== 'STYLE') child.remove();

    this.root.append(this.renderToolbar());
    if (this.mode === 'commenting') this.root.append(this.el('div', { className: 'hint' }, 'Click any element to comment. Esc to cancel.'));
    if (this.listOpen) this.root.append(this.renderList());

    const visible = this.threads.filter((t) => this.showResolved || !t.resolved);
    visible.forEach((thread, index) => this.root.append(this.renderPin(thread, index + 1)));

    const active = this.threads.find((t) => t.id === this.activeThreadId);
    if (active) this.root.append(this.renderPanel(active, pinPosition(active.anchor)));
    if (this.draft) this.root.append(this.renderDraftPanel());
  }

  private renderToolbar() {
    const comment = this.el('button', { textContent: 'Comment', title: 'Pin a comment (c)' });
    comment.setAttribute('aria-pressed', String(this.mode === 'commenting'));
    comment.onclick = () => {
      this.mode = this.mode === 'commenting' ? 'idle' : 'commenting';
      this.draft = null;
      this.render();
    };
    const open = this.threads.filter((t) => !t.resolved).length;
    const list = this.el('button', { textContent: `Threads (${open})` });
    list.setAttribute('aria-pressed', String(this.listOpen));
    list.onclick = () => {
      this.listOpen = !this.listOpen;
      this.render();
    };
    const resolved = this.el('button', { textContent: this.showResolved ? 'Hide resolved' : 'Show resolved' });
    resolved.onclick = () => {
      this.showResolved = !this.showResolved;
      this.render();
    };
    const branch = this.el('span', { textContent: this.config.branch });
    branch.style.cssText = 'padding:6px 8px;color:#777';
    return this.el('div', { className: 'toolbar' }, comment, list, resolved, branch);
  }

  private renderList() {
    const list = this.el('div', { className: 'list' });
    if (this.threads.length === 0) list.append(this.el('div', { className: 'empty' }, 'No comments on this page yet.'));
    this.threads.forEach((thread, index) => {
      const first = thread.comments[0]?.body ?? '';
      const button = this.el('button', { className: thread.resolved ? 'resolved' : '', textContent: `${index + 1}. ${thread.author}: ${first.slice(0, 60)}` });
      button.onclick = () => {
        this.activeThreadId = thread.id;
        this.listOpen = false;
        this.render();
      };
      list.append(button);
    });
    return list;
  }

  private renderPin(thread: Thread, number: number) {
    const { x, y, attached } = pinPosition(thread.anchor);
    const pin = this.el('div', { className: ['pin', thread.resolved ? 'resolved' : '', attached ? '' : 'detached', thread.id === this.activeThreadId ? 'active' : ''].join(' ').trim(), textContent: String(number) });
    pin.title = attached ? thread.author : `${thread.author} (element no longer found)`;
    pin.style.left = `${x}px`;
    pin.style.top = `${y}px`;
    pin.onclick = () => {
      this.activeThreadId = this.activeThreadId === thread.id ? null : thread.id;
      this.draft = null;
      this.render();
    };
    return pin;
  }

  private panelAt(x: number, y: number) {
    const panel = this.el('div', { className: 'panel' });
    panel.style.left = `${Math.min(x + 16, window.innerWidth - 336)}px`;
    panel.style.top = `${Math.min(y + 16, window.innerHeight - 200)}px`;
    return panel;
  }

  private renderPanel(thread: Thread, position: { x: number; y: number }) {
    const panel = this.panelAt(position.x, position.y);
    const close = this.el('button', { textContent: '×' });
    close.onclick = () => {
      this.activeThreadId = null;
      this.render();
    };
    const share = this.el('button', { textContent: 'Copy link' });
    share.onclick = () => {
      const url = new URL(window.location.href);
      url.searchParams.set(SHARE_PARAM, thread.id);
      void navigator.clipboard.writeText(url.toString());
      share.textContent = 'Copied';
    };
    const resolve = this.el('button', { textContent: thread.resolved ? 'Reopen' : 'Resolve' });
    resolve.onclick = async () => {
      await this.api.setResolved(thread.id, !thread.resolved);
      await this.load();
    };
    const remove = this.el('button', { textContent: 'Delete' });
    remove.onclick = async () => {
      if (!confirm('Delete this thread?')) return;
      await this.api.deleteThread(thread.id);
      this.activeThreadId = null;
      await this.load();
    };
    panel.append(this.el('header', {}, this.el('span', { textContent: thread.resolved ? 'Resolved' : 'Open' }), this.el('span', {}, share, resolve, remove, close)));

    for (const comment of thread.comments) {
      panel.append(
        this.el('div', { className: 'comment' }, this.el('b', { textContent: comment.author }), this.el('time', { textContent: new Date(comment.createdAt).toLocaleString() }), this.el('p', { textContent: comment.body }))
      );
    }

    const textarea = this.el('textarea', { placeholder: 'Reply…' });
    const send = this.el('button', { className: 'primary', textContent: 'Reply' });
    send.onclick = async () => {
      const body = textarea.value.trim();
      if (!body) return;
      await this.api.addComment(thread.id, body);
      await this.load();
    };
    panel.append(textarea, this.el('div', { className: 'actions' }, send));
    return panel;
  }

  private renderDraftPanel() {
    const draft = this.draft!;
    const panel = this.panelAt(draft.x, draft.y);
    const textarea = this.el('textarea', { placeholder: 'Leave a comment…' });
    const cancel = this.el('button', { textContent: 'Cancel' });
    cancel.onclick = () => {
      this.draft = null;
      this.render();
    };
    const send = this.el('button', { className: 'primary', textContent: 'Comment' });
    send.onclick = async () => {
      const body = textarea.value.trim();
      if (!body) return;
      const thread = await this.api.createThread(draft.anchor, body);
      this.draft = null;
      this.activeThreadId = thread.id;
      await this.load();
    };
    panel.append(this.el('header', {}, this.el('span', { textContent: `New comment on ${draft.anchor.selector.slice(0, 40)}` })), textarea, this.el('div', { className: 'actions' }, cancel, send));
    queueMicrotask(() => textarea.focus());
    return panel;
  }
}
