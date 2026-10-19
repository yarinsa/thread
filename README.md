# review-overlay

Self-hosted look-alike of the Vercel Toolbar comments feature. A single injected script lets reviewers pin threaded comments to any element on a page; a tiny API stores them per host, project, branch and route.

## Packages

- `packages/overlay` - vanilla TypeScript, built to one IIFE `overlay.js`. Shadow DOM, no framework, no dependencies.
- `packages/server` - Hono + `node:sqlite`. REST API with an optional Slack webhook on new threads.

## Run

```bash
pnpm install
pnpm build
pnpm dev:server                 # http://localhost:4747, DB at ./review-overlay.db
```

Serve `packages/overlay/dist/overlay.js` from anywhere and add to the host page:

```html
<script
  src="https://reviews.example.internal/overlay.js"
  data-api="https://reviews.example.internal"
  data-project="portal"
  data-branch="feat/new-table"
  data-author="yarin"
></script>
```

- `data-branch` groups threads per environment. Pass the git branch at build time.
- Threads are also scoped by the page's host (`window.location.host`, including the port), so the same project and branch on `localhost:3000` and on a preview domain keep separate threads.
- `data-author` is optional; without it the overlay prompts once and remembers the name in localStorage.
- Threads are pinned by a CSS selector that prefers `data-testid`, then `id`, then a structural path. Pins whose element is gone show in orange at the top right.
- `?rc=<threadId>` in the URL opens that thread on load. "Copy link" produces it.

Server env: `PORT`, `DB_PATH`, `SLACK_WEBHOOK_URL`, `PUBLIC_APP_URL` (used to build links in Slack messages).

## Capsule portal

Add the script tag to `apps/portal/index.html` guarded by a build-time flag, and pass `data-branch` from the dynamic-env chart. The API is open CORS and has no auth, so deploy it only on the internal network.

## Develop

```bash
pnpm test
pnpm typecheck
```
