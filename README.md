# LeadFlow

A full-stack lead-management platform for small sales teams. It includes a public
lead-capture page, an authenticated workspace, admin/member permissions, lead
assignment, a status pipeline, timestamped notes, and an activity trail.

## Architecture

```text
React + Vite client
       │ JSON API + secure HTTP-only cookie
       ▼
Express API ── permission middleware
       │
       ▼
Prisma ORM ── SQLite locally / PostgreSQL in production
```

The server is the security boundary. The client hides admin-only controls for a
better user experience, but every sensitive API route independently verifies the
session and role. Members can only read and change leads assigned to them.

## Data model

- `User`: account, password hash, active state, and `ADMIN`/`MEMBER` role
- `Lead`: contact details, source, pipeline status, and optional assignee
- `Note`: immutable timestamped note linked to its author and lead
- `Activity`: append-only audit event linked to a lead and optional actor

Lead statuses are `NEW`, `CONTACTED`, `QUALIFIED`, `WON`, and `LOST`.

## Local setup

Requirements: Node.js 20+ and npm.

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:4000`.

Demo accounts (created by the seed command):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@leadflow.dev` | `DemoPass123!` |
| Member | `member@leadflow.dev` | `DemoPass123!` |

Never reuse demo credentials in production.

## API documentation

All request and response bodies use JSON. Authenticated calls require the
`session` HTTP-only cookie set during login.

### Authentication

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Create an 8-hour session |
| POST | `/api/auth/logout` | Signed in | Clear the session |
| GET | `/api/auth/me` | Signed in | Return the current user |

Login body:

```json
{ "email": "admin@leadflow.dev", "password": "DemoPass123!" }
```

### Leads

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/leads/public` | Public | Capture an inquiry |
| GET | `/api/leads` | Signed in | Paginated/filterable lead list |
| GET | `/api/leads/:id` | Allowed user | Lead, notes, and activity |
| PATCH | `/api/leads/:id` | Allowed user | Change status; admins can assign |
| POST | `/api/leads/:id/notes` | Allowed user | Add a timestamped note |
| DELETE | `/api/leads/:id` | Admin | Delete a lead |
| GET | `/api/users` | Admin | List active users for assignment |

`GET /api/leads` query parameters:

| Parameter | Default | Description |
|---|---:|---|
| `page` | 1 | Page number, minimum 1 |
| `limit` | 10 | Items per page, 1–100 |
| `status` | — | One of the five pipeline statuses |
| `assigneeId` | — | Admin-only assignment filter |
| `search` | — | Matches name, email, or company |

Example:

```http
GET /api/leads?page=2&limit=10&status=QUALIFIED&search=acme
```

List response:

```json
{
  "items": [],
  "pagination": { "page": 2, "limit": 10, "total": 14, "pages": 2 }
}
```

Public capture body:

```json
{
  "name": "Riya Shah",
  "email": "riya@example.com",
  "phone": "+91 98765 43210",
  "company": "Acme",
  "message": "We need help improving our sales pipeline."
}
```

### Status codes

- `200 OK`: successful read or update
- `201 Created`: lead or note created
- `204 No Content`: logout or deletion succeeded
- `400 Bad Request`: validation or query error
- `401 Unauthorized`: missing, invalid, or expired session
- `403 Forbidden`: signed in but not permitted
- `404 Not Found`: route or record does not exist
- `500 Internal Server Error`: unexpected server failure

## Permission matrix

| Action | Admin | Member |
|---|:---:|:---:|
| View all leads | ✓ | — |
| View assigned leads | ✓ | ✓ |
| Change status | ✓ | Assigned only |
| Add notes | ✓ | Assigned only |
| Assign/reassign | ✓ | — |
| Delete | ✓ | — |
| List team members | ✓ | — |

## Scripts

- `npm run dev` — run API and web client together
- `npm run build` — production build
- `npm test` — run four isolated API integration tests
- `npm run db:generate` — generate Prisma client
- `npm run db:migrate -- --name <name>` — create/apply a local migration
- `npm run db:seed` — create demo users

## Automated test coverage

The Vitest/Supertest suite creates a separate disposable SQLite database. It
currently verifies:

1. Protected routes reject unauthenticated requests with `401`.
2. Members only see their assigned leads and cannot reassign them.
3. Public capture creates a normalized lead and audit event.
4. An assigned member can advance the status and add a timestamped note.

Run the same checks used by continuous integration:

```bash
npm test
npm run build
```

## Production checklist

## Deploy on Render

The included `render.yaml` deploys the React frontend and Express API together
as one free Render web service:

1. Open [Render Blueprints](https://dashboard.render.com/blueprints).
2. Connect this GitHub repository.
3. Select the `main` branch and approve the `render.yaml` configuration.
4. Wait for the build and health check to pass.
5. Open the generated `onrender.com` URL and test both demo accounts.

Render generates `JWT_SECRET` securely. The free service uses an ephemeral
SQLite database that is recreated and seeded when the service restarts. This is
appropriate for a training demo, but submitted leads can reset after inactivity
or redeployment. For permanent production data, switch Prisma to PostgreSQL and
set `DATABASE_URL` to a managed provider such as Neon.

Before submitting, verify:

```bash
npm test
npm run build
```

Built for Digital Heroes Training Task — [digitalheroesco.com](https://digitalheroesco.com)
