# Email Automation Platform — Integration Plan

> **Scope:** Email automation only. WhatsApp templates excluded.
> **Last updated:** 2026-06-11

---

## 1. What the Backend Developer Has Built

The backend is a FastAPI + PostgreSQL + Celery stack. Below is every implemented endpoint.

### 1.1 Health
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Liveness probe |
| GET | `/health/ready` | Readiness check (DB connectivity) |

### 1.2 Authentication
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/auth/login` | Exchange email+password for JWT | No |
| GET | `/auth/me` | Get current user profile | Bearer token |

- OAuth2 `PasswordRequestForm` — `username` field is treated as email
- Token payload: `{ id, email, role, permissions[] }`
- Token expiry: configurable (default 60 min)

### 1.3 Contacts & CSV Imports
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/contacts` | Paginated list — query: `page`, `page_size`, `search`, `country` |
| GET | `/contacts/{id}` | Full contact detail + properties array |
| POST | `/imports` | Upload DLD CSV file (multipart) — returns `{ batch_id }` immediately (async) |
| GET | `/imports/{batch_id}` | Poll import status and stats |
| GET | `/imports` | List recent import batches |

### 1.4 Campaigns
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/campaigns` | Paginated list — filter by `status`, `campaign_type`, `search` |
| POST | `/campaigns` | Create campaign (lands in `draft`) |
| GET | `/campaigns/{id}` | Full campaign detail |
| PATCH | `/campaigns/{id}` | Update campaign fields |
| DELETE | `/campaigns/{id}` | Soft-delete (draft only) |
| POST | `/campaigns/{id}/start` | Draft/Paused → Running (snapshots audience) |
| POST | `/campaigns/{id}/pause` | Running → Paused |
| POST | `/campaigns/{id}/complete` | Running → Completed (terminal) |
| POST | `/campaigns/{id}/archive` | Archive (hides from default list) |
| POST | `/campaigns/preview-audience` | Real-time audience size estimate before creation |
| GET | `/campaigns/{id}/templates` | Ordered template sequence for campaign |

**Campaign statuses:** `draft → scheduled → running → paused → completed → archived`

**AudienceFilter fields (JSONB):**
```
locations[], project_names[], building_names[], countries[], countries_exclude[],
min/max_transaction_value, certificate_date_before/after, min/max_rooms
```

### 1.5 Email Templates
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/templates` | List — filter: `campaign_type`, `step_number`, `is_active` |
| GET | `/templates/allowed-variables` | All available `{{variable}}` names |
| POST | `/templates` | Create template (variables auto-extracted) |
| GET | `/templates/{id}` | Get single template |
| PATCH | `/templates/{id}` | Update template (in-place, not versioned) |
| DELETE | `/templates/{id}` | Soft-delete (sets `is_active=false`) |
| POST | `/templates/{id}/preview` | Render with sample variables — returns rendered HTML |

### 1.6 Suppression List
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/suppression` | List — filter: `search`, `reason` |
| GET | `/suppression/reasons` | Enum of valid suppression reasons |
| POST | `/suppression` | Add single email |
| POST | `/suppression/bulk` | Add up to 1000 emails at once |
| DELETE | `/suppression/{id}` | Remove from suppression |

---

## 2. What is NOT Yet Built in the Backend

These are the gaps that block a fully working system. They need to be built before full integration is possible.

### 2.1 Inbox (Gmail Account) Management ❌
The frontend has `useInboxes.ts` already prepared. None of these endpoints exist yet.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/inboxes` | List all connected Gmail inboxes with status |
| POST | `/inboxes/connect/google` | Start Gmail OAuth2 flow — returns redirect URL |
| GET | `/inboxes/oauth/callback` | OAuth2 callback — stores tokens |
| GET | `/inboxes/{id}` | Single inbox detail |
| PATCH | `/inboxes/{id}` | Update daily limit, display name |
| DELETE | `/inboxes/{id}` | Disconnect inbox |
| POST | `/inboxes/{id}/test` | Send a test email to verify connectivity |
| GET | `/inboxes/{id}/health` | Deliverability score, bounce rate, warmup status |
| POST | `/inboxes/{id}/pause` | Stop sending from this inbox |
| POST | `/inboxes/{id}/resume` | Resume sending |

**What this requires on backend:**
- Google OAuth2 consent flow with `gmail.send` + `gmail.readonly` scopes
- Fernet-encrypted token storage in `GmailCredential` table
- Token refresh logic (Google tokens expire hourly)
- Gmail Pub/Sub subscription per inbox for reply detection

### 2.2 Email Sending Pipeline ❌
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/campaigns/{id}/sending-log` | Paginated sent email log for a campaign |
| GET | `/sent-emails` | Global sent emails feed — filter: `status`, `campaign_id`, `inbox_id`, `date_from/to` |
| GET | `/sent-emails/{id}` | Single sent email with full body HTML |

**What this requires on backend:**
- `SentEmail` table: id, contact_id, campaign_id, inbox_id, template_id, message_id (Gmail), subject, body_html, status, opened_at, replied_at, bounced_at, created_at
- Celery send task: pick next batch from `CampaignContact`, select inbox from pool, render template, send via Gmail API, record result
- Celery beat schedule: trigger send task every N minutes within send window
- Gmail webhook → update open/bounce/reply status

### 2.3 Reply Detection & Inbox ❌
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/replies` | List conversations — filter: `label`, `resolved`, `assigned_to`, `inbox_id` |
| GET | `/replies/{id}` | Full conversation thread |
| PATCH | `/replies/{id}` | Update label, resolved state, assigned agent, notes |
| GET | `/replies/stats` | Count per label for dashboard |

**What this requires on backend:**
- `Reply` table: id, contact_id, sent_email_id, inbox_id, campaign_id, gmail_message_id, gmail_thread_id, subject, body_text, body_html, received_at, ai_label, resolved, assigned_to, notes
- Gmail Pub/Sub push endpoint to receive new messages
- Thread matching logic (match by `gmail_thread_id` to original sent email)
- Optional: AI label classification (call Claude API with reply body → classify as Interested / OOO / Questions / Unsubscribe / Not Interested)

### 2.4 Analytics / Reporting ❌
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/analytics/overview` | Platform totals: contacts, emails sent today, active campaigns, new replies today |
| GET | `/analytics/campaigns` | Per-campaign open/reply/bounce rates over time |
| GET | `/analytics/inboxes` | Per-inbox deliverability metrics |
| GET | `/analytics/top-locations` | Top properties by engagement |

### 2.5 Queue Monitoring ❌
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/queue/stats` | Pending / processing / failed counts per queue |
| GET | `/queue/workers` | Worker list with status and current job |
| GET | `/queue/failed` | Failed job list with error messages |
| POST | `/queue/failed/{id}/retry` | Retry a failed job |

Alternatively, use **Flower** (already in `requirements.txt`) and proxy it behind `/flower`. The frontend queue page would embed or call Flower's REST API.

### 2.6 Users & Roles ❌
The `User`, `Role`, and `Permission` models exist in the DB. No API endpoints exposed yet.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/users` | List users |
| POST | `/users` | Create user (admin only) |
| PATCH | `/users/{id}` | Update name, role, active state |
| DELETE | `/users/{id}` | Deactivate user |
| GET | `/roles` | List roles with permissions |
| POST | `/roles` | Create custom role |

---

## 3. Frontend Integration Changes Required

### 3.1 Auth — Replace Mock with Real JWT

**File:** `app/composables/useAuth.ts`

```typescript
// login() — replace mock with:
const res = await $fetch<{ access_token: string }>(`${apiBase}/auth/login`, {
  method: 'POST',
  body: new URLSearchParams({ username: email, password }),
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
})
token.value = res.access_token

// fetchMe() — replace mock with:
user.value = await $fetch<AuthUser>(`${apiBase}/auth/me`, {
  headers: authHeaders.value,
})

// init() — call fetchMe if token exists, else clear
```

**File:** `app/middleware/auth.global.ts` — already correct; no changes needed.

### 3.2 Dashboard (`app/pages/index.vue`)

Replace hardcoded numbers with real calls on `onMounted`:
- `GET /analytics/overview` → stat cards (contacts, emails today, campaigns, replies)
- `GET /campaigns?status=running&page_size=5` → top campaigns table
- `GET /replies/stats` → recent replies panel
- `GET /queue/stats` → queue snapshot

### 3.3 Campaigns (`app/pages/campaigns/`)

**List page** (`index.vue`):
- Replace `MOCK_CAMPAIGNS` with `GET /campaigns?page=1&page_size=50&...`
- Wire status filter tabs to query param
- Wire search input (debounced)

**Detail page** (`[id].vue`):
- Replace `MOCK_CAMPAIGNS[id]` with `GET /campaigns/{id}`
- Wire Start/Pause/Complete/Archive buttons to their respective POST endpoints
- Wire Sent Log tab to `GET /campaigns/{id}/sending-log`

**Create page** (`create.vue`) — to be built:
- Audience filter builder → wire to `POST /campaigns/preview-audience` (live count)
- Template sequence builder → `GET /templates?campaign_type=...`
- Submit → `POST /campaigns`

### 3.4 Templates (`app/pages/templates/`)

**List page** (`index.vue`):
- Replace `MOCK_TEMPLATES` with `GET /templates?is_active=true`

**Detail/Edit page** (`[id].vue`):
- Replace `MOCK_TEMPLATES[id]` with `GET /templates/{id}`
- Save → `PATCH /templates/{id}`
- On mount for variable buttons: `GET /templates/allowed-variables`
- Preview modal → `POST /templates/{id}/preview` with sample variables (instead of client-side regex replace)

**Create page** — to be built:
- Submit → `POST /templates`

### 3.5 Contacts (`app/pages/contacts/`)

**List page** (`index.vue`):
- `fetchContacts()` already wired to real API — verify it works
- CSV upload flow: `uploadCSV()` → poll `getImport()` every 2s until `status === 'completed'`

**Detail page** (`[id].vue`):
- Replace `MOCK_CONTACT` with `getContact(id)` via `useContacts`

### 3.6 Inboxes (`app/pages/inboxes.vue`)

Blocked until backend implements `/inboxes/*`. When ready:
- `GET /inboxes` → replace mock list
- Connect button → `GET /inboxes/connect/google` → open OAuth URL
- Health scores → `GET /inboxes/{id}/health`

### 3.7 Replies (`app/pages/replies.vue`)

- `GET /replies?resolved=false` → conversation list
- Click conversation → `GET /replies/{id}` → thread messages
- Label change → `PATCH /replies/{id}` with `{ ai_label }`
- Mark resolved → `PATCH /replies/{id}` with `{ resolved: true }`
- Notes → `PATCH /replies/{id}` with `{ notes }`

### 3.8 Sent Emails (`app/pages/sent-emails.vue`)

- `GET /sent-emails?page=1&page_size=50` → replace mock list
- Click row → `GET /sent-emails/{id}` → full email body in slide-over

### 3.9 Suppression (`app/pages/settings/suppression.vue`)

- `GET /suppression` → replace mock list
- Add email → `POST /suppression`
- Bulk upload → `POST /suppression/bulk`
- Remove → `DELETE /suppression/{id}`
- Reasons dropdown → `GET /suppression/reasons`

### 3.10 Queue (`app/pages/queue.vue`)

- `GET /queue/stats` → job type breakdown + counts
- `GET /queue/workers` → workers table
- `GET /queue/failed` → failed jobs list
- Retry button → `POST /queue/failed/{id}/retry`

### 3.11 Users (`app/pages/settings/users.vue`)

Blocked until backend implements `/users/*`. When ready:
- `GET /users` → user list
- Invite/create → `POST /users`
- Role change → `PATCH /users/{id}`

### 3.12 Health Page (`app/pages/health.vue`)

- `GET /health/ready` → service status
- Can also show inbox health summaries

---

## 4. New Composables to Create

| File | Wraps | Used by |
|------|-------|---------|
| `useCampaigns.ts` | GET/POST/PATCH `/campaigns/*` | campaigns pages |
| `useTemplates.ts` | GET/POST/PATCH `/templates/*` | templates pages |
| `useReplies.ts` | GET/PATCH `/replies/*` | replies page |
| `useSentEmails.ts` | GET `/sent-emails/*` | sent-emails page |
| `useQueue.ts` | GET/POST `/queue/*` | queue page |
| `useAnalytics.ts` | GET `/analytics/*` | dashboard, analytics page |
| `useUsers.ts` | GET/POST/PATCH `/users/*` | settings/users page |

All should follow the same pattern as `useContacts.ts`:
- `loading`, `error` reactive refs
- `authHeaders` from `useAuth()`
- `apiBase` from `useRuntimeConfig().public.apiBase`

---

## 5. Phased Delivery Plan

### Phase 1 — Foundation (1–2 days)
> Everything works end-to-end for the core CRUD flows.

- [ ] Replace mock auth (`useAuth.ts`) with real `/auth/login` + `/auth/me`
- [ ] Test login page with real credentials
- [ ] Wire `contacts/index.vue` to real API (already partially done)
- [ ] Wire `contacts/[id].vue` to real API
- [ ] Wire `templates/index.vue` to real API
- [ ] Wire `templates/[id].vue` save + preview to real API
- [ ] Wire `settings/suppression.vue` to real API
- [ ] Create `useCampaigns.ts` composable
- [ ] Wire `campaigns/index.vue` to real API

### Phase 2 — Campaign Builder (2–3 days)
> Can create, configure, and start a real campaign.

- [ ] Build `campaigns/create.vue` with audience filter form
- [ ] Live audience preview using `POST /campaigns/preview-audience`
- [ ] Template sequence builder (drag-reorder steps)
- [ ] Wire campaign lifecycle buttons (Start / Pause / Complete) in `[id].vue`
- [ ] Wire sent log tab in campaign detail

### Phase 3 — Inbox Management (2–3 days, backend must be ready first)
> Gmail accounts connectable and manageable.

- [ ] Backend: implement `/inboxes/*` endpoints (OAuth2 flow, token storage)
- [ ] Backend: implement token refresh logic
- [ ] Frontend: wire `inboxes.vue` to real API
- [ ] Frontend: handle OAuth callback redirect

### Phase 4 — Sending Engine (3–5 days, backend)
> Emails actually go out.

- [ ] Backend: implement Celery send task (pick contacts → select inbox → render template → send via Gmail API)
- [ ] Backend: implement Celery beat schedule (trigger within send window)
- [ ] Backend: `SentEmail` table + status updates
- [ ] Backend: `GET /sent-emails` endpoint
- [ ] Frontend: wire `sent-emails.vue` to real API

### Phase 5 — Reply Detection (2–3 days, backend)
> Replies visible in the inbox.

- [ ] Backend: Gmail Pub/Sub push endpoint
- [ ] Backend: thread matching (link reply to original sent email)
- [ ] Backend: AI label classification (optional — call Claude API)
- [ ] Backend: `/replies/*` endpoints
- [ ] Frontend: wire `replies.vue` to real API

### Phase 6 — Analytics & Monitoring (1–2 days)
> Numbers are real.

- [ ] Backend: `/analytics/overview` endpoint
- [ ] Backend: `/queue/stats` + `/queue/workers` + `/queue/failed` endpoints
- [ ] Frontend: wire dashboard `index.vue`
- [ ] Frontend: wire `queue.vue` to real API
- [ ] Frontend: wire `analytics.vue`

### Phase 7 — Users & Roles (1 day)
> Admin can manage team access.

- [ ] Backend: `/users/*` + `/roles/*` endpoints
- [ ] Frontend: wire `settings/users.vue`

---

## 6. Environment Variables Needed

### Backend (`.env`)
```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/email_automation
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=<32-byte random hex>
ACCESS_TOKEN_EXPIRE_MINUTES=60
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/inboxes/oauth/callback
FERNET_KEY=<generated with Fernet.generate_key()>
```

### Frontend (`.env`)
```
NUXT_PUBLIC_API_BASE=http://localhost:8000/api/v1
```

---

## 7. Quick Reference — API Base URL

All frontend `$fetch` calls use:
```typescript
const config = useRuntimeConfig()
const apiBase = config.public.apiBase  // http://localhost:8000/api/v1
```

Full URL example: `${apiBase}/campaigns` → `http://localhost:8000/api/v1/campaigns`

---

## 8. Known Issues & Decisions Needed

| # | Issue | Decision needed |
|---|-------|----------------|
| 1 | `campaign_type` on templates is `owner_sell \| owner_rent_out` but frontend uses `initial \| follow_up \| closing`. These are different fields — `step_number` (1, 2, 3…) maps to initial/follow-up/closing. | Align frontend category labels with backend `step_number` |
| 2 | Frontend `Contact` interface has `property_count: number` but backend returns `property_count` only if aggregated in the list query. Confirm backend includes this in list response. | Verify backend `/contacts` response shape |
| 3 | Reply AI labelling: frontend has labels `Interested / Questions / Not Interested / OOO / Unsubscribe`. Backend `ai_label` field type not yet defined. | Agree on the enum values before implementing |
| 4 | Queue monitoring: Flower UI vs. custom API. Flower is already in `requirements.txt`. | Decide: embed Flower iframe or build custom endpoints |
| 5 | Frontend `useInboxes.ts` calls `GET /inboxes/connect/google` but OAuth typically requires a server-side redirect, not a JSON response. | Backend should redirect directly, or return a URL the frontend opens in a new tab |
| 6 | Token refresh: JWT expires in 60 min. Frontend currently has no refresh logic. | Add refresh token endpoint or implement silent re-login |
