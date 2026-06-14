# API Overview — Email Automation Platform

Base URL: `http://localhost:8000/api/v1`  
Auth: `Authorization: Bearer <JWT>` on all endpoints except `/auth/login`, `/auth/me` (no-auth), and `/webhooks/gmail` (Google-signed).

---

## Table of Contents

1. [My New Backend APIs](#1-my-new-backend-apis)
   - [Analytics](#11-analytics)
   - [Replies](#12-replies)
   - [Queue](#13-queue)
   - [Users](#14-users)
2. [Other Developer's APIs — Integrated on Frontend](#2-other-developers-apis--integrated-on-frontend)
   - [Email Accounts (Inboxes)](#21-email-accounts-inboxes)
   - [Sent Emails](#22-sent-emails)
   - [Webhooks](#23-webhooks)
3. [Original APIs — Already Integrated](#3-original-apis--already-integrated)
   - [Health](#31-health)
   - [Auth](#32-auth)
   - [Contacts & CSV Imports](#33-contacts--csv-imports)
   - [Campaigns](#34-campaigns)
   - [Email Templates](#35-email-templates)
   - [Suppression List](#36-suppression-list)

---

## 1. My New Backend APIs

These 4 modules were built from scratch and are fully integrated on the frontend.

---

### 1.1 Analytics

**Frontend page:** `analytics.vue`, `index.vue` (dashboard)  
**Composable:** `useAnalytics.ts`  
**Permission required:** `analytics.view`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/summary` | Dashboard summary — contacts count, active campaigns, sent/replies today, top 5 campaigns, inbox health |
| `GET` | `/analytics/metrics?range=` | Time-series data for charts — daily sent/delivered/opened/replied/bounced + rates |

**Query params for `/analytics/metrics`:**

| Param | Values | Default |
|-------|--------|---------|
| `range` | `7d`, `30d`, `90d` | `30d` |

**`/analytics/summary` response:**
```json
{
  "total_contacts": 2041330,
  "active_campaigns": 3,
  "sent_today": 1240,
  "replies_today": 47,
  "daily_send_capacity": 1000,
  "top_campaigns": [
    { "id": "...", "name": "Marina Q2", "status": "running", "total_sent": 2941, "total_replied": 318, "reply_rate": 0.1082 }
  ],
  "inbox_health": { "healthy": 5, "reduced": 2, "critical": 1 }
}
```

**`/analytics/metrics` response:**
```json
{
  "range": "30d",
  "labels": ["2026-05-15", "2026-05-16", ...],
  "sent": [120, 200, ...],
  "delivered": [118, 195, ...],
  "opened": [40, 70, ...],
  "replied": [12, 18, ...],
  "bounced": [2, 5, ...],
  "open_rate": [0.333, 0.35, ...],
  "reply_rate": [0.1, 0.09, ...],
  "bounce_rate": [0.016, 0.025, ...]
}
```

> **Note:** `open_rate`, `reply_rate`, `bounce_rate` are fractions (0.0–1.0), multiply by 100 to display as %.

---

### 1.2 Replies

**Frontend page:** `replies.vue`  
**Composable:** `useReplies.ts`  
**Permissions:** `reply.view` (GET), `reply.update` (PATCH)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/replies` | Paginated list of inbound replies with joined contact/campaign/agent names |
| `GET` | `/replies/{id}` | Full reply detail — body HTML/text + original sent email for thread context |
| `PATCH` | `/replies/{id}` | Update classification, assign agent, mark handled, save agent notes |

**`GET /replies` query params:**

| Param | Type | Description |
|-------|------|-------------|
| `classification` | string | Filter by classification value (see below) |
| `campaign_id` | UUID | Filter by campaign |
| `assigned_agent_id` | UUID | Filter by assigned agent |
| `is_handled` | bool | `true` = handled only, `false` = unhandled only |
| `search` | string | Search by `from_email` or `from_name` |
| `page` | int | Default 1 |
| `page_size` | int | Default 50, max 200 |

**Classification values:**
`interested` · `not_interested` · `unsubscribe` · `auto_reply` · `bounce` · `question` · `referral` · `spam_complaint` · `unclassified`

**`PATCH /replies/{id}` body:**
```json
{
  "classification": "interested",
  "assigned_agent_id": "uuid-or-null",
  "is_handled": true,
  "agent_notes": "Follow up next week"
}
```

> All fields optional — only send what you want to change.

---

### 1.3 Queue

**Frontend page:** `queue.vue`  
**Composable:** `useQueue.ts`  
**Permission required:** `analytics.view`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/queue` | Pending email sends — campaign contacts scheduled but not yet dispatched |
| `GET` | `/queue/workers` | Live Celery worker status + queued task counts per queue |
| `GET` | `/queue/failed` | Sent emails that failed after all retries (status = `failed`) |

**`GET /queue` query params:**

| Param | Type | Description |
|-------|------|-------------|
| `campaign_id` | UUID | Filter by campaign |
| `page` | int | Default 1 |
| `page_size` | int | Default 50, max 200 |

**Queue item status values:** `pending` (scheduled in the future) · `overdue` (past `next_send_at` but not yet sent)

**`GET /queue/workers` response:**
```json
{
  "workers": [
    { "name": "celery@hostname", "status": "online", "active_tasks": 2, "queues": ["sending"] }
  ],
  "total_online": 1,
  "queued_tasks": { "sending": 9, "replies": 0, "imports": 1, "maintenance": 0 }
}
```

> Worker endpoint has a 2-second timeout and returns empty gracefully if Redis/Celery is down.  
> Frontend auto-refreshes queue every **30s**, workers every **10s**.

---

### 1.4 Users

**Frontend page:** `settings/users.vue`  
**Composable:** `useUsers.ts`  
**Permissions:** `user.view` (GET), `user.manage` (POST/PATCH/DELETE)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | Paginated user list with role, active status, last login |
| `POST` | `/users` | Create a new user with a temporary password |
| `GET` | `/users/{id}` | Get single user detail |
| `PATCH` | `/users/{id}` | Update name, role, or active status |
| `DELETE` | `/users/{id}` | Soft-deactivate a user (sets `is_active=false`, row not deleted) |

**`GET /users` query params:**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by name or email |
| `role` | string | Filter by role name |
| `is_active` | bool | Filter active/inactive users |
| `page` | int | Default 1 |
| `page_size` | int | Default 50, max 200 |

**`POST /users` body:**
```json
{
  "email": "jane@company.com",
  "full_name": "Jane Smith",
  "role": "manager",
  "password": "temporary123"
}
```

**`PATCH /users/{id}` body:**
```json
{
  "full_name": "Jane Smith",
  "role": "admin",
  "is_active": false
}
```

**Role names:** `super_admin` · `admin` · `manager` · `agent` · `viewer`

> DELETE is a soft-delete only. Users cannot deactivate themselves.  
> Password must be at least 8 characters.

---

## 2. Other Developer's APIs — Integrated on Frontend

These modules were built by another developer. I integrated them into the frontend.

---

### 2.1 Email Accounts (Inboxes)

**Frontend pages:** `inboxes/index.vue`, `inboxes/[id].vue`  
**Composable:** `useInboxes.ts`  
**Prefix:** `/email-accounts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/email-accounts/connect-google` | Start Google OAuth — returns `{ authorization_url }` to redirect user to |
| `GET` | `/email-accounts/connect-google/callback` | OAuth callback (called by Google) — creates inbox, redirects to `/inboxes?connected=<email>` or `?error=<msg>` |
| `GET` | `/email-accounts` | List all inboxes with filters |
| `GET` | `/email-accounts/{id}` | Get single inbox with full settings |
| `PATCH` | `/email-accounts/{id}` | Update send settings (daily limit, send window, timezone, notes) |
| `POST` | `/email-accounts/{id}/pause` | Pause inbox — no sends scheduled |
| `POST` | `/email-accounts/{id}/resume` | Resume a paused inbox |
| `DELETE` | `/email-accounts/{id}` | Retire inbox (soft-delete, history preserved) |
| `POST` | `/email-accounts/{id}/watch` | Re-register Gmail Pub/Sub watch (use when watch expires) |

**`GET /email-accounts` query params:** `status`, `domain`, `search`, `page`, `page_size`

**Inbox status values:** `active` · `paused` · `warming_up` · `suspended` · `auth_expired` · `retired`

**OAuth flow:**
1. Frontend calls `POST /email-accounts/connect-google` → gets `authorization_url`
2. Frontend redirects user: `window.location.href = authorization_url`
3. User grants consent on Google
4. Google redirects to backend callback → backend creates inbox → redirects to `FRONTEND_URL/inboxes?connected=<email>` or `?error=<msg>`
5. Frontend reads the query params on mount and shows a toast

---

### 2.2 Sent Emails

**Frontend page:** `sent-emails.vue`  
**Composable:** `useSentEmails.ts`  
**Prefix:** `/sent-emails`  
**Permission required:** `analytics.view`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sent-emails` | Paginated audit trail of every email sent or attempted |
| `GET` | `/sent-emails/{id}` | Full detail — rendered HTML/text body, error info, timeline |

**`GET /sent-emails` query params:** `campaign_id`, `contact_id`, `email_account_id`, `status`, `step_number`, `page`, `page_size`

**Status values:** `queued` · `sending` · `sent` · `delivered` · `bounced` · `failed` · `skipped`

---

### 2.3 Webhooks

**Not a frontend page** — called directly by Google Pub/Sub.  
**Prefix:** `/webhooks`  
**No auth** (Google doesn't send auth headers by default).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhooks/gmail` | Receive Gmail change notification from Google Pub/Sub — decodes payload, looks up inbox, fires Celery task to process new replies. Always returns 204. |

**Pub/Sub envelope format:**
```json
{
  "message": {
    "data": "<base64-encoded JSON with emailAddress + historyId>",
    "messageId": "...",
    "publishTime": "..."
  },
  "subscription": "projects/.../subscriptions/..."
}
```

> Configure the Google Pub/Sub push subscription to point to: `https://your-domain/api/v1/webhooks/gmail`

---

## 3. Original APIs — Already Integrated

These were built before this session and are already wired into the frontend.

---

### 3.1 Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Returns `{ status: "ok" }` — used to check if the API is up |

---

### 3.2 Auth

**Frontend:** Login page, `useAuth.ts` composable

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Email + password → JWT access token (OAuth2 password form) |
| `GET` | `/auth/me` | Current user profile + role + permissions list |

**Login request:** form-encoded `username` (email) + `password`  
**Login response:** `{ access_token, token_type: "bearer", expires_in }`

---

### 3.3 Contacts & CSV Imports

**Frontend page:** `contacts/index.vue`  
**Composable:** `useContacts.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/imports` | Upload a CSV file — returns `batch_id`, processing is async |
| `GET` | `/imports/{batch_id}` | Poll import batch status and progress |
| `GET` | `/imports` | List all import batches |
| `GET` | `/contacts` | Paginated contact list with filters (search, status, tags, properties) |
| `GET` | `/contacts/{id}` | Single contact detail with all custom properties |

---

### 3.4 Campaigns

**Frontend pages:** `campaigns/index.vue`, `campaigns/create.vue`, `campaigns/[id].vue`  
**Composable:** `useCampaigns.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/campaigns` | Create a campaign (starts as draft) |
| `GET` | `/campaigns` | List campaigns with filters |
| `GET` | `/campaigns/{id}` | Get single campaign detail |
| `PATCH` | `/campaigns/{id}` | Update a draft campaign |
| `DELETE` | `/campaigns/{id}` | Soft-delete a draft campaign |
| `POST` | `/campaigns/{id}/start` | Start campaign (draft/paused → running) |
| `POST` | `/campaigns/{id}/pause` | Pause a running campaign |
| `POST` | `/campaigns/{id}/complete` | Mark as completed |
| `POST` | `/campaigns/{id}/archive` | Archive a campaign |
| `GET` | `/campaigns/{id}/templates` | Get the campaign's email template sequence |
| `POST` | `/campaigns/preview-audience` | Estimate audience size for a filter set |

---

### 3.5 Email Templates

**Frontend page:** `templates/index.vue`  
**Composable:** `useTemplates.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/templates` | List all templates |
| `POST` | `/templates` | Create a new template |
| `GET` | `/templates/{id}` | Get single template |
| `PATCH` | `/templates/{id}` | Update — creates a new version (old version preserved) |
| `DELETE` | `/templates/{id}` | Archive a template |
| `POST` | `/templates/preview` | Render a template with sample variables → returns HTML preview |
| `GET` | `/templates/{id}/versions` | List all versions of a template |

> Templates are **versioned** — updates never mutate existing rows, they create a new row with `version + 1`. Campaigns using the old version are not affected.

---

### 3.6 Suppression List

**Frontend page:** `suppression.vue`  
**Composable:** `useSuppression.ts` (or inline)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/suppression` | List suppressed emails |
| `POST` | `/suppression` | Add a single email to the suppression list |
| `POST` | `/suppression/bulk` | Add multiple emails at once |
| `DELETE` | `/suppression/{id}` | Remove an email from the suppression list |
| `POST` | `/suppression/check` | Check if an email is suppressed |

**Suppression reasons:** `unsubscribe` · `bounce` · `spam_complaint` · `manual`

---

## Summary Count

| Developer | Module | Endpoints | Frontend Integrated |
|-----------|--------|-----------|-------------------|
| Me | Analytics | 2 | ✅ `analytics.vue`, `index.vue` |
| Me | Replies | 3 | ✅ `replies.vue` |
| Me | Queue | 3 | ✅ `queue.vue` |
| Me | Users | 5 | ✅ `settings/users.vue` |
| Other dev | Email Accounts | 9 | ✅ `inboxes/index.vue`, `inboxes/[id].vue` |
| Other dev | Sent Emails | 2 | ✅ `sent-emails.vue` |
| Other dev | Webhooks | 1 | ✅ (server-to-server, no UI) |
| Original | Health | 1 | ✅ |
| Original | Auth | 2 | ✅ login page, `useAuth.ts` |
| Original | Contacts + Imports | 5 | ✅ `contacts/index.vue` |
| Original | Campaigns | 11 | ✅ `campaigns/` pages |
| Original | Templates | 7 | ✅ `templates/` pages |
| Original | Suppression | 5 | ✅ `suppression.vue` |
| **Total** | **13 modules** | **56 endpoints** | **All integrated** |
