# ArchTrack

Modern web-based operations platform for a drafting and design company.

## Apps

- `apps/backend` - Express API with TypeScript
- `apps/frontend` - React, TypeScript, Vite, and TailwindCSS
- Backend repositories use InstantDB for persistent storage. If InstantDB env vars are missing, API writes return a configuration error instead of falling back to memory.

## Quick Start

```bash
npm install --cache ./.npm-cache
npm run dev
```

The backend listens on `http://localhost:4000`.
The frontend listens on `http://localhost:5173`.

For InstantDB and Google OAuth setup, see [SETUP.md](</C:/Users/Stephen/Documents/New project/SETUP.md>).

On Windows, you can also run:

```bat
scripts\dev.cmd
```

## Docker

```bash
docker compose up --build
```

## Auth API

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me` with `Authorization: Bearer <accessToken>`
- `GET /api/v1/auth/admin-check` with an admin bearer token
- `GET /api/v1/auth/google/url`
- `POST /api/v1/auth/google/callback`
- `GET /api/v1/setup/status`

## Operations API

- `GET|POST|PATCH|DELETE /api/v1/customers`
- `POST /api/v1/customers/:id/contacts`
- `POST /api/v1/customers/:id/notes`
- `GET|POST|PATCH|DELETE /api/v1/projects`
- `POST /api/v1/projects/:id/milestones`
- `GET|POST|PATCH|DELETE /api/v1/tasks`
- `POST /api/v1/tasks/:id/comments`
- `GET|POST|PATCH|DELETE /api/v1/documents`
- `POST /api/v1/documents/:id/revisions`
- `GET|POST|PATCH|DELETE /api/v1/time-entries`
- `POST /api/v1/time-entries/timer`
- `POST /api/v1/time-entries/:id/stop`
- `GET|POST|PATCH|DELETE /api/v1/quotes`
- `GET /api/v1/quotes/:id`
- `POST /api/v1/quotes/:id/convert-to-invoice`
- `GET /api/v1/quotes/:id/pdf`
- `GET|POST|PATCH|DELETE /api/v1/invoices`
- `GET /api/v1/invoices/:id`
- `PUT /api/v1/invoices/:id`
- `POST /api/v1/invoices/:id/send`
- `POST /api/v1/invoices/:id/mark-paid`
- `POST /api/v1/invoices/:id/mark-overdue`
- `POST /api/v1/invoices/:id/void`
- `GET /api/v1/invoices/:id/pdf`

## Notifications API

- `GET /api/v1/notifications`
- `POST /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `POST /api/v1/notifications/read-all`
- `GET|PATCH /api/v1/notifications/preferences`
- `GET /api/v1/notifications/email-queue` with an admin bearer token
- `POST /api/v1/notifications/email-queue/process` with an admin bearer token

## Google OAuth

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` before using Google sign-in. The default redirect URI is `http://localhost:5173/oauth/google/callback`.
Google sign-in requests Gmail send access plus Google Drive file access so linked accounts can send queued ArchTrack notification emails and create project Drive folders.
The notification email worker runs every `EMAIL_QUEUE_INTERVAL_MS` milliseconds by default, and the overdue invoice sweep runs every `JOB_SWEEP_INTERVAL_MS` milliseconds. Set either one to `0` to disable that background processing during local troubleshooting.
