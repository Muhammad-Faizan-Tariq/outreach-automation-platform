# New Modules Plan — Backend + Frontend

Four new backend modules to build, plus frontend integration for each.
All models already exist in the database — no migrations needed.

---

## Overview

| Module | Backend file | Frontend page | Composable | DB models used |
|---|---|---|---|---|
| Analytics | `analytics.py` + `schemas/analytics.py` | `analytics.vue`, `index.vue` | `useAnalytics.ts` | `sent_emails`, `campaigns`, `contacts`, `replies` |
| Replies | `replies.py` + `schemas/replies.py` | `replies.vue` | `useReplies.ts` | `replies`, `sent_emails`, `contacts`, `campaigns` |
| Queue | `queue.py` + `schemas/queue.py` | `queue.vue` | `useQueue.ts` | `campaign_contacts`, `sent_emails` + Celery inspect |
| Users | `users.py` + `schemas/users.py` | `settings/users.vue` | `useUsers.ts` | `users`, `roles` |

---

## Module 1 — Analytics

### Backend: `app/api/v1/endpoints/analytics.py`

#### `GET /analytics/summary`
Returns a single object for the dashboard. All numbers computed in one query pass.

```python
# Response shape
{
  "total_contacts": int,
  "active_campaigns": int,
  "sent_today": int,          # sent_emails WHERE DATE(sent_at) = today
  "replies_today": int,        # replies WHERE DATE(received_at) = today
  "daily_send_capacity": int,  # SUM(email_accounts.daily_send_limit) WHERE status='active'
  "top_campaigns": [           # top 5 by total_sent, running/paused only
    {
      "id": uuid,
      "name": str,
      "status": str,
      "total_sent": int,
      "total_replied": int,
      "reply_rate": float      # total_replied / total_sent
    }
  ],
  "inbox_health": {
    "healthy": int,            # deliverability_score >= 80
    "reduced": int,            # deliverability_score 60-79
    "critical": int            # deliverability_score < 60 or auth_expired/suspended
  }
}
```

**Query approach:**
- `total_contacts`: `SELECT COUNT(*) FROM contacts WHERE status != 'deleted'`
- `active_campaigns`: `SELECT COUNT(*) FROM campaigns WHERE status = 'running'`
- `sent_today`: `SELECT COUNT(*) FROM sent_emails WHERE sent_at::date = CURRENT_DATE`
- `replies_today`: `SELECT COUNT(*) FROM replies WHERE received_at::date = CURRENT_DATE`
- `top_campaigns`: `SELECT id, name, status, total_sent, total_replied FROM campaigns WHERE status IN ('running','paused') ORDER BY total_sent DESC LIMIT 5`
- `inbox_health`: Grouped count of `email_accounts` by deliverability_score ranges

#### `GET /analytics/metrics?range=7d|30d|90d`
Returns time-series arrays, one entry per day in the range.

```python
# Response shape
{
  "range": "30d",
  "labels": ["2026-05-15", ..., "2026-06-14"],   # date strings
  "sent": [int, ...],
  "delivered": [int, ...],
  "opened": [int, ...],
  "replied": [int, ...],
  "bounced": [int, ...],
  "open_rate": [float, ...],    # opened/sent per day (0–1)
  "reply_rate": [float, ...],   # replied/sent per day (0–1)
  "bounce_rate": [float, ...]   # bounced/sent per day (0–1)
}
```

**Query approach:**
- One `GROUP BY DATE(sent_at)` query on `sent_emails` for sent/delivered/bounced/opened
- One `GROUP BY DATE(received_at)` query on `replies` for replied count
- Join them by date in Python, fill zeros for missing days

### Backend: `app/schemas/analytics.py`
```python
class TopCampaign(BaseModel): id, name, status, total_sent, total_replied, reply_rate
class InboxHealth(BaseModel): healthy, reduced, critical
class AnalyticsSummary(BaseModel): total_contacts, active_campaigns, sent_today, replies_today, daily_send_capacity, top_campaigns, inbox_health
class AnalyticsMetrics(BaseModel): range, labels, sent, delivered, opened, replied, bounced, open_rate, reply_rate, bounce_rate
```

### Router update
Add `analytics.router` to `app/api/v1/router.py`.
Permission guard: `analytics.view` (already defined in permission system).

### Frontend: `app/composables/useAnalytics.ts` (new)
```ts
interface AnalyticsSummary { total_contacts, active_campaigns, sent_today, replies_today, daily_send_capacity, top_campaigns, inbox_health }
interface AnalyticsMetrics { range, labels, sent, delivered, opened, replied, bounced, open_rate, reply_rate, bounce_rate }

fetchSummary(): Promise<AnalyticsSummary>
fetchMetrics(range: '7d' | '30d' | '90d'): Promise<AnalyticsMetrics>
```

### Frontend: `app/pages/index.vue` (rewrite stat cards)
- Replace 4 hardcoded stat cards with `fetchSummary()` data
- Replace hardcoded top campaigns list with `summary.top_campaigns`
- Replace hardcoded inbox health with `summary.inbox_health`
- Replace hardcoded send progress with `summary.sent_today / summary.daily_send_capacity`

### Frontend: `app/pages/analytics.vue` (wire charts to real data)
- Replace all `generateLabels()` + random mock arrays with `fetchMetrics(range)` response
- `range` ref drives the API call on change
- Charts: sent/opened/replied/bounced line chart, open rate / reply rate line chart, bounce rate line chart (already using Chart.js — just swap data sources)

---

## Module 2 — Replies

### Backend: `app/api/v1/endpoints/replies.py`

#### `GET /replies`
Paginated list. Joined with contact and campaign for display names.

**Query params:** `classification`, `campaign_id`, `assigned_agent_id`, `is_handled` (bool), `search` (from_email / from_name), `page`, `page_size`

```python
# Response item shape (ReplyListItem)
{
  "id": uuid,
  "contact_id": uuid,
  "campaign_id": uuid | None,
  "from_email": str,
  "from_name": str | None,
  "subject": str | None,
  "snippet": str | None,
  "classification": str,          # interested / not_interested / question / unsubscribe / ...
  "classification_confidence": float | None,
  "assigned_agent_id": uuid | None,
  "handled_at": datetime | None,
  "received_at": datetime,
  # Joined fields
  "contact_name": str | None,     # contacts.full_name
  "campaign_name": str | None,    # campaigns.name
  "assigned_agent_name": str | None  # users.full_name
}
```

#### `GET /replies/{id}`
Full reply detail including original sent email body for thread context.

```python
# Response shape (ReplyDetail)
{
  ...all ReplyListItem fields...,
  "body_text": str | None,
  "body_html": str | None,
  "agent_notes": str | None,
  "classified_at": datetime | None,
  "classification_reason": str | None,
  # Original sent email (thread context)
  "original_email": {
    "subject": str,
    "body_html": str | None,
    "body_text": str | None,
    "sent_at": datetime | None
  } | None
}
```

#### `PATCH /replies/{id}`
Update classification, assign agent, mark handled, add notes.

```python
# Request body (ReplyUpdate)
{
  "classification": ReplyClassification | None,
  "assigned_agent_id": uuid | None,
  "is_handled": bool | None,      # sets handled_at = now(), handled_by = current_user
  "agent_notes": str | None
}
```

### Backend: `app/schemas/replies.py`
```python
class ReplyListItem(BaseModel): id, contact_id, campaign_id, from_email, from_name, subject, snippet, classification, classification_confidence, assigned_agent_id, handled_at, received_at, contact_name, campaign_name, assigned_agent_name
class OriginalEmail(BaseModel): subject, body_html, body_text, sent_at
class ReplyDetail(ReplyListItem): body_text, body_html, agent_notes, classified_at, classification_reason, original_email
class ReplyUpdate(BaseModel): classification, assigned_agent_id, is_handled, agent_notes
class ReplyListResponse(BaseModel): items, total, page, page_size
```

**Join strategy:** Use SQLAlchemy `outerjoin` on `contacts`, `campaigns`, `users` (for assigned_agent). The original email is fetched separately via `sent_email_id` FK.

### Router update
Add `replies.router` to `app/api/v1/router.py` (already commented as `# Future`).
Permission guard: `reply.view` for GET, `reply.update` for PATCH.

### Frontend: `app/composables/useReplies.ts` (new)
```ts
interface Reply { id, contact_id, campaign_id, from_email, from_name, subject, snippet, classification, assigned_agent_id, handled_at, received_at, contact_name, campaign_name, assigned_agent_name }
interface ReplyDetail extends Reply { body_text, body_html, agent_notes, classified_at, classification_reason, original_email }

fetchReplies(params): Promise<{ items, total, page, page_size }>
getReply(id): Promise<ReplyDetail>
updateReply(id, data): Promise<ReplyDetail>
```

### Frontend: `app/pages/replies.vue` (full rewrite)
Replace full mock with real API:
- Two-pane layout: left = reply list, right = selected reply thread
- List filters: classification (Interested / Not Interested / Question / Unsubscribe / All), handled/unhandled toggle
- Each list item: from_name, from_email, campaign_name, snippet, classification badge, received_at
- Right pane: original email body + reply body, classification badge, agent notes input, mark-handled button, assign agent dropdown
- On classification/handled change → call `PATCH /replies/{id}` immediately

---

## Module 3 — Queue

### Backend: `app/api/v1/endpoints/queue.py`

#### `GET /queue`
Pending email jobs — contacts scheduled to receive an email but not yet sent.

**Source:** `campaign_contacts` WHERE `next_send_at IS NOT NULL AND exited_at IS NULL AND sequence_completed_at IS NULL`, joined with `contacts`, `campaigns`, `sent_emails` (latest per contact).

**Query params:** `campaign_id`, `page`, `page_size`

```python
# Response item shape
{
  "campaign_contact_id": uuid,
  "contact_id": uuid,
  "contact_email": str,
  "campaign_id": uuid,
  "campaign_name": str,
  "current_step": int,
  "next_send_at": datetime,
  "status": "pending" | "overdue"  # overdue if next_send_at < now
}
```

#### `GET /queue/workers`
Celery worker status via `celery_app.control.inspect()`.

```python
# Response shape
{
  "workers": [
    {
      "name": str,          # e.g. "celery@hostname"
      "status": "online" | "offline",
      "active_tasks": int,
      "queues": [str]
    }
  ],
  "total_online": int,
  "queued_tasks": {         # from broker queue lengths
    "sending": int,
    "replies": int,
    "imports": int,
    "maintenance": int
  }
}
```

**Note:** `celery_app.control.inspect(timeout=2)` — short timeout, return empty gracefully if no workers respond.

#### `GET /queue/failed`
Emails that failed after all retries.

**Source:** `sent_emails` WHERE `status = 'failed'` ORDER BY `created_at DESC`.

**Query params:** `campaign_id`, `page`, `page_size`

```python
# Response item shape
{
  "id": uuid,
  "contact_id": uuid,
  "contact_email": str,     # joined from contacts
  "campaign_id": uuid,
  "campaign_name": str,     # joined from campaigns
  "step_number": int,
  "subject": str,
  "error_code": str | None,
  "error_message": str | None,
  "retry_count": int,
  "created_at": datetime
}
```

### Backend: `app/schemas/queue.py`
```python
class QueueItem(BaseModel): campaign_contact_id, contact_id, contact_email, campaign_id, campaign_name, current_step, next_send_at, status
class WorkerInfo(BaseModel): name, status, active_tasks, queues
class QueuedTaskCounts(BaseModel): sending, replies, imports, maintenance
class WorkersResponse(BaseModel): workers, total_online, queued_tasks
class FailedJob(BaseModel): id, contact_id, contact_email, campaign_id, campaign_name, step_number, subject, error_code, error_message, retry_count, created_at
class QueueListResponse(BaseModel): items, total, page, page_size
class FailedListResponse(BaseModel): items, total, page, page_size
```

Permission guard: `analytics.view` (reuse — admins/managers see queue).

### Frontend: `app/composables/useQueue.ts` (new)
```ts
interface QueueItem { ... }
interface WorkersResponse { ... }
interface FailedJob { ... }

fetchQueue(params): Promise<{ items, total, page, page_size }>
fetchWorkers(): Promise<WorkersResponse>
fetchFailed(params): Promise<{ items, total, page, page_size }>
```

### Frontend: `app/pages/queue.vue` (full rewrite)
Replace mock with real API:
- 3 tabs: **Pending** / **Workers** / **Failed**
- Pending tab: table with contact email, campaign, step, scheduled time, overdue badge; auto-refresh every 30s
- Workers tab: worker cards with status dot, queue names, active task count; auto-refresh every 10s
- Failed tab: table with contact email, campaign, step, error code, retry count; no retry button (send engine handles retries automatically)

---

## Module 4 — Users

### Backend: `app/api/v1/endpoints/users.py`

#### `GET /users`
List all users with role name.

**Query params:** `search` (name/email), `role`, `is_active`, `page`, `page_size`

```python
# Response item (UserSummary)
{
  "id": uuid,
  "email": str,
  "full_name": str,
  "role": str,        # role.name e.g. "admin", "manager"
  "is_active": bool,
  "last_login_at": datetime | None,
  "created_at": datetime
}
```

#### `POST /users`
Create a new user (super_admin/admin only).

```python
# Request (UserCreate)
{
  "email": str,
  "full_name": str,
  "role": str,        # role name: "admin" | "manager" | "agent" | "viewer"
  "password": str     # temporary password — user should change on first login
}
```

#### `PATCH /users/{id}`
Update role or active status.

```python
# Request (UserUpdate)
{
  "full_name": str | None,
  "role": str | None,
  "is_active": bool | None
}
```

### Backend: `app/schemas/users.py`
```python
class UserSummary(BaseModel): id, email, full_name, role, is_active, last_login_at, created_at
class UserCreate(BaseModel): email, full_name, role, password
class UserUpdate(BaseModel): full_name, role, is_active
class UserListResponse(BaseModel): items, total, page, page_size
```

**Role lookup:** Fetch `role_id` by doing `SELECT id FROM roles WHERE name = payload.role` before creating/updating.
**Password hashing:** Use the same bcrypt hashing already used in `auth` service.

Permission guard: `user.view` for GET, `user.manage` for POST/PATCH.

### Router update
Add `users.router` to `app/api/v1/router.py`.

### Frontend: `app/composables/useUsers.ts` (new)
```ts
interface UserSummary { id, email, full_name, role, is_active, last_login_at, created_at }

fetchUsers(params): Promise<{ items, total, page, page_size }>
createUser(data): Promise<UserSummary>
updateUser(id, data): Promise<UserSummary>
```

### Frontend: `app/pages/settings/users.vue` (rewrite)
Replace mock with real API:
- Table: name, email, role badge, status badge, last login, action dropdown
- "Invite / Add user" modal → call `POST /users` with email, full name, role, temp password
- Row actions: Change role (dropdown), Disable / Re-enable toggle
- Only shown to admin/super_admin (check `user.role` from `useAuth()`)

---

## Router additions summary

```python
# app/api/v1/router.py — add these imports and includes:
from app.api.v1.endpoints import analytics, replies, queue, users

api_router.include_router(analytics.router)
api_router.include_router(replies.router)
api_router.include_router(queue.router)
api_router.include_router(users.router)
```

---

## Implementation order (recommended)

1. **Users** — simplest: pure CRUD on existing `User` model, no joins complexity
2. **Analytics summary** — fast wins: all data from denormalized counters already on `campaigns` and `email_accounts`
3. **Analytics metrics** — time-series GROUP BY queries on `sent_emails` + `replies`
4. **Replies** — most complex joins; needs contact/campaign names joined
5. **Queue** — depends on Celery inspect availability in the environment

---

## Notes & Gotchas

- **No new migrations needed** — all four modules query existing tables (`users`, `roles`, `replies`, `sent_emails`, `campaign_contacts`, `campaigns`, `email_accounts`, `contacts`)
- **Analytics metrics range:** Clamp `range` to max 90 days; beyond that the GROUP BY query is expensive without an aggregation table
- **Queue workers endpoint:** `celery_app.control.inspect(timeout=2)` can hang if Redis is down — always wrap in `try/except` with a fallback empty response
- **Replies join:** `contacts.full_name` can be NULL — use `COALESCE(contacts.full_name, replies.from_name)` for display
- **Users password:** The `User` model has `password_hash` (bcrypt). `POST /users` must hash the supplied password before storing. No email invite flow exists yet — just create with a known temp password
- **Permission codes needed:** `analytics.view`, `reply.view`, `reply.update`, `user.view`, `user.manage` — verify these exist in the `permissions` table seeded by the migration
- **`EmailSendStatus` enum mismatch:** The frontend `useSentEmails.ts` uses `'pending'` but the backend enum uses `'queued'`. Will need to align when showing queue items in sent-emails page
