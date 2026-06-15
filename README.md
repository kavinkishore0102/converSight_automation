# ConverSight Automation Console

An industry-standard internal portal to **request, manage, and run ConverSight automations** — built in the ConverSight dark theme.

It supports two roles:

| Role | Capabilities |
|------|-------------|
| **Admin** | Create / edit / enable / disable automation templates, define dynamic input fields, review incoming requests and update their status. |
| **User**  | Browse enabled automations, submit requests against them, track the status of their requests. |

The default seeded automations mirror the existing CS automation ticket form:
*Activate Dataset · Increase Session Timeout · Remove SME Duplicates · Remove Insight Duplicates · Change Data Refresh Time · Enable Connector V2 Menu · Enable Athena IQ Menu · Update Refresh Time · Admin Email Changes*.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** with a custom ConverSight dark theme
- **lucide-react** icons
- **JWT (jose)** sessions in httpOnly cookies
- **bcryptjs** for password hashing
- File-backed JSON store at `data/db.json` (zero-config; swap for Postgres later)

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Demo accounts (seeded on first run):

| Role  | Email                    | Password |
|-------|--------------------------|----------|
| Admin | admin@conversight.ai     | admin123 |
| User  | user@conversight.ai      | user123  |

To re-seed: delete `data/db.json` and restart, or run `npm run seed`.

## Project layout

```
app/
  login/              # Sign-in screen
  dashboard/          # User console
    automations/      # Browse + run automations
    requests/         # Track personal requests
  admin/              # Admin console
    automations/      # CRUD automations + dynamic field editor
    requests/         # Review + update request status
    settings/         # Users + workspace info
  api/                # REST endpoints (auth, automations, requests)
components/           # UI shell, page header, status badge, editor
lib/                  # db.ts (JSON store), auth.ts (JWT), utils.ts
middleware.ts         # Route protection
```

## Environment variables

Set `AUTH_SECRET` in production:

```bash
AUTH_SECRET="$(openssl rand -hex 32)"
```
