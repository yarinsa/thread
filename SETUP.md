# Setup

## 1. Push to GitHub

```bash
unzip review-overlay.zip && cd review-overlay
git init -b main
git add -A
git commit -m "Initial overlay and server"
gh repo create yarinsa/review-overlay --private --source . --push
```

## 2. Run locally

Requires Node 22.13+ (built-in sqlite) and pnpm 10.

```bash
pnpm install
pnpm build
pnpm dev:server          # API on http://localhost:4747, DB at ./review-overlay.db
```

Check it: `curl localhost:4747/health` returns `{"ok":true}`.

Try the overlay on a plain page:

```bash
mkdir -p smoke && cp packages/overlay/dist/overlay.js smoke/
cat > smoke/index.html <<'HTML'
<!doctype html><main><button id="save">Save</button></main>
<script src="/overlay.js" data-api="http://localhost:4747" data-project="smoke" data-branch="main" data-author="me"></script>
HTML
(cd smoke && python3 -m http.server 4848)
```

Open http://localhost:4848, click Comment, click the button, type, submit. Reload: the pin is still there.

## 3. Deploy the server

Any Node host works. One process, one sqlite file on a persistent volume.

```bash
PORT=4747 DB_PATH=/data/review-overlay.db \
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... \
PUBLIC_APP_URL=https://portal.dev.example.internal \
node --experimental-strip-types packages/server/src/main.ts
```

Serve `packages/overlay/dist/overlay.js` from the same host, or any static bucket. The API has no auth and open CORS, so keep it on the internal network only.

## 4. Wire into the Capsule portal

In the capsule repo:

1. `apps/portal/src/config/environment.ts`: add `VITE_REVIEW_OVERLAY_API: str({ default: '' })` and `VITE_APP_BRANCH: str({ default: 'local' })`.
2. `apps/portal/src/main.tsx`: after the other init calls, when `env.VITE_REVIEW_OVERLAY_API` is set, create a `<script>` element with `src=<api>/overlay.js`, `data-api`, `data-project="portal"`, `data-branch=env.VITE_APP_BRANCH`, `data-author` from the logged-in user, and append it to `document.body`.
3. `apps/portal/Dockerfile`: add `ARG REVIEW_OVERLAY_API=""` and `ARG APP_BRANCH=""`, export them as the two `VITE_` vars before the build step.
4. Dynamic-env chart values: pass the branch name and the server URL as build args. Leave both unset for production so the overlay never ships to customers.

The script tag approach keeps the overlay out of the portal bundle entirely.

## 5. Verify

```bash
pnpm typecheck
pnpm test
```
