# New APIs Integration Plan

Three new backend modules: `email_accounts.py`, `sent_emails.py`, `webhooks.py`.

---

## Current State

| Page | Composable | Status |
|---|---|---|
| `inboxes/index.vue` | `useInboxes.ts` | MOCK data; wrong API path (`/inboxes/` vs `/email-accounts`) |
| `sent-emails.vue` | none | MOCK data; wrong interface shape |
| — | — | Webhooks = backend-only, no UI needed |

---

## Module 1: Email Accounts (Inboxes)

**Base path:** `/api/v1/email-accounts`

### Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/email-accounts/connect-google` | Start OAuth → returns `{ authorization_url }` |
| `GET` | `/email-accounts/connect-google/callback` | Google redirect (no auth, backend-only) |
| `GET` | `/email-accounts` | List inboxes — paginated, filters: `status`, `domain`, `search`, `page`, `page_size` |
| `GET` | `/email-accounts/{id}` | Full detail |
| `PATCH` | `/email-accounts/{id}` | Update settings: `display_name`, `daily_send_limit`, `timezone`, `send_window_start`, `send_window_end`, `send_days_of_week`, `notes` |
| `POST` | `/email-accounts/{id}/pause` | Pause inbox |
| `POST` | `/email-accounts/{id}/resume` | Resume inbox |
| `DELETE` | `/email-accounts/{id}` | Retire inbox (soft-delete) |
| `POST` | `/email-accounts/{id}/watch` | Re-register Gmail Pub/Sub watch |

### Schema: `EmailAccountSummary` (list)

```ts
interface EmailAccountSummary {
  id: string
  email: string
  display_name: string
  domain: string
  status: 'active' | 'paused' | 'warming_up' | 'suspended' | 'auth_expired' | 'retired'
  daily_send_limit: number
  current_day_sent: number
  total_sent: number
  deliverability_score: number | null
  created_at: string
}
```

### Schema: `EmailAccountResponse` (detail)

```ts
interface EmailAccountDetail extends EmailAccountSummary {
  oauth_token_expires_at: string | null
  oauth_scopes: string[] | null
  gmail_watch_expires_at: string | null
  timezone: string
  send_window_start: string   // "HH:MM:SS"
  send_window_end: string
  send_days_of_week: number[] // 0=Mon … 6=Sun
  warmup_day: number
  warmup_started_at: string | null
  warmup_completed_at: string | null
  bounce_rate_7d: number | null
  reply_rate_7d: number | null
  total_bounced: number
  total_replied: number
  notes: string | null
  updated_at: string
}
```

### Files to Create / Modify

1. **MODIFY `app/composables/useInboxes.ts`** (full rewrite)
   - Fix API path: `/email-accounts` (was `/inboxes/`)
   - Update `Inbox` interface → `EmailAccountSummary`
   - Add `EmailAccountDetail` interface
   - Add functions: `listInboxes()`, `getInbox()`, `updateInbox()`, `pauseInbox()`, `resumeInbox()`, `retireInbox()`, `watchInbox()`, `startGoogleOAuth()`

2. **MODIFY `app/pages/inboxes/index.vue`** (full rewrite)
   - Replace MOCK data with real `listInboxes()` calls
   - Add search + status filter + pagination
   - "Connect inbox" button → call `startGoogleOAuth()` → redirect to `authorization_url`
   - Handle OAuth return params: `?connected=<email>` (show success toast) and `?error=<message>` (show error toast)
   - Per-row actions dropdown: Pause / Resume / Retire / Re-register watch
   - Add detail panel or link to `/inboxes/{id}` (optional — could be inline modal)

3. **CREATE `app/pages/inboxes/[id].vue`** (new page)
   - Full inbox detail: send window, warm-up status, health metrics
   - Edit settings form (display_name, daily_send_limit, timezone, send window, notes)
   - Action buttons: Pause / Resume / Retire / Re-register watch

---

## Module 2: Sent Emails

**Base path:** `/api/v1/sent-emails`

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/sent-emails` | Paginated list — filters: `campaign_id`, `contact_id`, `email_account_id`, `status`, `step_number`, `page`, `page_size` |
| `GET` | `/sent-emails/{id}` | Full detail with body_html, body_text, error info, open/bounce/delivery timeline |

### Schema: `SentEmailSummary` (list)

```ts
interface SentEmailSummary {
  id: string
  campaign_id: string
  contact_id: string
  email_account_id: string
  step_number: number
  subject: string
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced' | 'failed'
  scheduled_at: string
  sent_at: string | null
  gmail_message_id: string | null
  error_code: string | null
  created_at: string
}
```

### Schema: `SentEmailDetail`

```ts
interface SentEmailDetail extends SentEmailSummary {
  body_html: string | null
  body_text: string | null
  gmail_thread_id: string | null
  error_message: string | null
  retry_count: number
  delivered_at: string | null
  bounced_at: string | null
  first_opened_at: string | null
  open_count: number
}
```

### Files to Create / Modify

1. **CREATE `app/composables/useSentEmails.ts`** (new composable)
   - Interfaces: `SentEmailSummary`, `SentEmailDetail`, `SentEmailListResponse`
   - Functions: `fetchSentEmails(params)`, `getSentEmail(id)`

2. **MODIFY `app/pages/sent-emails.vue`** (full rewrite)
   - Replace MOCK data with real `fetchSentEmails()` calls
   - Update column definitions to match real field names (`contact_id`, `email_account_id`, `campaign_id` — display as truncated UUIDs or resolve lazily)
   - Real server-side pagination
   - Status filter: all / pending / sent / delivered / opened / replied / bounced / failed
   - Campaign filter: only if campaign_id is known (pass as query param)
   - Row click → fetch `getSentEmail(id)` → show detail modal with body_html rendered in iframe or sanitised div, timeline (scheduled → sent → delivered → opened → replied/bounced), error info
   - Debounced search on subject (client-side on current page, since API doesn't support subject search)

---

## Module 3: Webhooks

**Base path:** `/api/v1/webhooks`

| Method | Path | Description |
|---|---|---|
| `POST` | `/webhooks/gmail` | Gmail Pub/Sub push — called by Google, not the frontend |

**No frontend integration needed.** This endpoint is backend-only. Google calls it directly via Pub/Sub push subscription. The frontend never calls it.

---

## Implementation Order

1. `useInboxes.ts` — rewrite composable
2. `inboxes/index.vue` — rewrite page (OAuth flow + list + actions)
3. `useSentEmails.ts` — new composable
4. `sent-emails.vue` — rewrite page (real data + detail modal)
5. `inboxes/[id].vue` — new detail page (optional, lower priority)

---

## Notes & Gotchas

- **OAuth redirect**: `POST /email-accounts/connect-google` returns `{ authorization_url }`. Frontend must do `window.location.href = authorization_url`. Google then redirects back to the backend callback which redirects to `FRONTEND_URL/inboxes?connected=<email>` or `FRONTEND_URL/inboxes?error=<msg>`. The inboxes page must read these query params on mount.
- **Webhook**: No `Authorization` header — Google doesn't send one. Backend handles it. No frontend touch needed.
- **Retire vs Delete**: `DELETE /email-accounts/{id}` sets status to `retired`; the row is not deleted. Show as "Retire" in the UI, not "Delete".
- **Status enum**: Backend uses `active | paused | warming_up | suspended | auth_expired | retired`. No status mapping needed (unlike campaigns where `running` → `active`).
- **`send_window_start` / `send_window_end`**: Backend returns `"HH:MM:SS"` strings (Python `time` type). Display as `"HH:MM"` — strip seconds.
- **`send_days_of_week`**: Array of ints `[0,1,2,3,4]` = Mon–Fri. Display as day abbreviations.
- **Sent emails list**: No `toName` field — only `contact_id` UUID. For a richer display, a future enhancement would join with contacts, but for now show truncated UUID or `contact_id`.
- **Detail modal body**: `body_html` may contain HTML. Render in a `<div v-html="...">` (Nuxt/Vue sanitises in SSR; for CSR use `DOMPurify` if needed — but for an internal admin tool it's acceptable as-is).
