# Scheduled jobs on Fly.io

Call protected HTTP endpoints on this app from an external scheduler or a [Fly Machines scheduled machine](https://fly.io/docs/machines/guides-examples/scheduled-machines/).

## Setup

1. Set `CRON_SECRET` on the Fly app:
   ```bash
   fly secrets set CRON_SECRET="$(openssl rand -hex 32)"
   ```
2. Schedule a POST to e.g. `https://<app>.fly.dev/api/scheduled/example`
3. Send the secret as `Authorization: Bearer <CRON_SECRET>` or header `x-cron-secret`.

## Add a job

1. Add a handler in `server/_core/index.ts` under `/api/scheduled/<name>`.
2. Use the `verifyCronSecret` middleware (see the `example` route).
3. Run business logic inline (DB, `invokeLLM`, etc.).

Cron requests have no user session — use only server-side credentials from Fly secrets.
