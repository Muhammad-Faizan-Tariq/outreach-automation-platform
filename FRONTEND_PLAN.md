# Frontend Plan — Email Outreach Engine

> **Scope:** UI design only. No live API calls. All data is static mock data defined
> inline per page. Existing API-connected composables are preserved but not called —
> pages use local `ref`/`computed` with seed data instead.

---

## 1. What Exists Today

| File | State | Action |
|---|---|---|
| `pages/login.vue` | ✅ Complete | Keep as-is |
| `pages/index.vue` | ⚠ Partial | Replace with full dashboard design |
| `pages/contacts/index.vue` | ⚠ Has API calls | Keep layout, swap `fetchContacts` → inline mock |
| `pages/contacts/[id].vue` | ⚠ Has API calls | Keep layout, swap `getContact` → inline mock |
| `pages/inboxes/index.vue` | ⚠ Has API calls | Keep layout, swap `fetchInboxes` → inline mock |
| `pages/health.vue` | ⚠ Has API calls | Keep layout, swap `$fetch` → inline mock |
| `layouts/default.vue` | ⚠ Incomplete nav | Expand sidebar with all sections |
| `layouts/auth.vue` | ✅ Complete | Keep as-is |

---

## 2. Navigation Structure (Updated Sidebar)

```
├── Dashboard                /
│
├── Campaigns                /campaigns
│   ├── [detail]             /campaigns/[id]
│   └── Create               /campaigns/create
│
├── Templates                /templates
│   ├── [detail/edit]        /templates/[id]
│   └── Create               /templates/create
│
├── Contacts                 /contacts
│   └── [detail]             /contacts/[id]
│
├── Inboxes                  /inboxes
│
├── Replies                  /replies
│
├── Sent Emails              /sent-emails
│
├── Analytics                /analytics
│
├── Queue                    /queue
│
├── Settings
│   ├── Users                /settings/users
│   └── Suppression          /settings/suppression
│
└── Health                   /health
```

Sidebar visual changes:
- Add section dividers: **Outreach**, **Monitoring**, **Settings**
- Active section expands to show child links (Campaigns sub-links)
- Show badge with unread count on **Replies** (static: `12`)
- Collapse sidebar to icon-only at `< lg` breakpoint

---

## 3. New Pages to Build

### 3.1 Dashboard `/` (redesign)

**Top row — 4 stat cards:**
- Total Contacts (static: `2,041,330`)
- Active Campaigns (static: `3`)
- Emails Sent Today (static: `18,240`)
- New Replies Today (static: `47`)

**Second row — 3 panels:**
- **Sending progress bar** — today's sent vs target (18,240 / 20,000)
- **Top 5 campaigns by send rate** — horizontal bar chart (use `UProgress`)
- **Inbox health distribution** — 3 badges: Healthy (312), Reduced (68), Paused (20)

**Bottom row:**
- **Recent replies** — 5 rows: contact name, email snippet, campaign, time, AI label badge
- **Queue snapshot** — pending / processing / failed counts with colored badges

---

### 3.2 Campaigns List `/campaigns`

**Header:** "Campaigns" title + "New Campaign" button (→ `/campaigns/create`)

**Filter bar:** Status tabs (All | Running | Paused | Draft | Completed) + search input

**Table columns:**
| Name | Status | Type | Contacts | Sent | Open Rate | Reply Rate | Created | Actions |

**Static mock rows (5):**
1. Dubai Marina Owners Q2 · Running · owner_sell · 84,200 contacts · 42,100 sent · 28.4% open · 3.1% reply
2. JBR Tenant Outreach · Paused · owner_rent_out · 12,800 · 6,400 · 22.1% · 1.8%
3. Palm Jumeirah Sequence · Running · owner_sell · 31,500 · 15,200 · 31.2% · 4.2%
4. Downtown Leads Q1 · Completed · owner_sell · 9,000 · 9,000 · 19.8% · 2.3%
5. New Launches 2026 · Draft · owner_sell · 0 · 0 · — · —

**Row actions:** View / Pause / Resume / Stop — shown as a `UDropdownMenu`

Status badges:
- Running → `success`
- Paused → `warning`
- Draft → `neutral`
- Completed → `info`

---

### 3.3 Campaign Detail `/campaigns/[id]`

**Top:**
- Campaign name + status badge + action buttons (Pause / Resume / Stop)
- 4 stat cards: Contacts Enrolled, Total Sent, Replies, Unsubscribes

**Tabs: Overview | Sequence | Contacts | Sent Log | Settings**

**Overview tab:**
- Sending chart (7-day line: emails/day) — SVG sparkline or use CSS bar chart
- Inbox rotation table: inbox email · sends today · health score
- Reply breakdown: Interested (42) / Questions (18) / Not Interested (67) / OOO (12) / Unsubscribe (8)

**Sequence tab:**
- Visual timeline (vertical stepper) showing the 3-step sequence:
  - Step 1: Initial email · Day 0 · Template "Marina Intro"
  - Step 2: Follow-up 1 · Day +3 · Template "Marina Follow-up 1"
  - Step 3: Follow-up 2 · Day +5 · Template "Marina Follow-up 2"

**Contacts tab:**
- Table of enrolled contacts (paginated mock): email, step, next send date, status

**Sent Log tab:**
- Table: to email, inbox used, sent at, status, opens, clicks

**Settings tab:**
- Read-only form: daily cap, follow-up delays, target area, campaign type

---

### 3.4 Campaign Create `/campaigns/create`

**Multi-step wizard (4 steps shown as horizontal `USteps`):**

**Step 1 — Details**
- Name (text input)
- Type: Owner Sell / Owner Rent Out (radio cards with icons)
- Target area (text input, e.g. "Dubai Marina")
- Daily send cap (number input, default 500)

**Step 2 — Audience**
- Filter builder mockup: Location contains + Contact type = Owner + Status = Active
- Estimated audience count shown (static: "~84,200 contacts match")
- Table preview of first 5 matching contacts

**Step 3 — Sequence**
- Add Step buttons
- Each step card: Step number · Delay (+N days) · Template selector (USelect)
- 3 steps pre-populated with mock template names

**Step 4 — Review & Launch**
- Summary: all selections in a read-only grid
- Launch / Save as Draft buttons

---

### 3.5 Templates List `/templates`

**Header:** "Email Templates" + "New Template" button

**Card grid (3-column)** — each card shows:
- Template name
- Subject preview (first 60 chars)
- Last updated date
- `UBadge` for type (Initial / Follow-up 1 / Follow-up 2)
- Footer: Edit | Preview | Duplicate | Delete buttons

**Static mock cards (6):**
1. Marina Intro · "Hi {{first_name}}, I wanted to reach out about your property…"
2. Marina Follow-up 1 · "Following up on my previous email about {{property_location}}…"
3. Marina Follow-up 2 · "Last chance — quick question about {{property_address}}…"
4. JBR Tenant Intro · "Good {{time_of_day}} {{first_name}}, I'm reaching out…"
5. Generic Intro A/B · "{{first_name}}, a quick note about the market…"
6. Re-engagement · "It's been a while since we last spoke about {{property_location}}…"

---

### 3.6 Template Detail/Edit `/templates/[id]`

**Split-pane layout:**

**Left (editor):**
- Name input
- Subject line input
- Body: `<textarea>` styled as a minimal code/rich editor
- Variables panel: clickable chips `{{first_name}}` `{{property_location}}` `{{unit_number}}` `{{agent_name}}` — clicking inserts at cursor

**Right (preview):**
- Live preview rendered in a fake email client frame (grey outer border, white inner card)
- Variables replaced with sample data
- "Send test" button (static, no action)

---

### 3.7 Replies `/replies`

**Inspired by a Gmail-style inbox — the most complex page.**

**Left column (reply list, w-80):**
- Filter tabs: All | Interested | Questions | Unsubscribe | OOO
- List of reply items (scrollable), each row:
  - Contact name + email (truncated)
  - AI label badge (Interested / Question / etc.)
  - Email snippet (first line, truncated)
  - Relative time ("2h ago")
  - Unread dot indicator

**Right column (reply detail):**
- Contact header: name, email, campaign name
- AI label badge + "Re-classify" button
- Thread view: original email (collapsed) + reply (expanded)
- Action bar: "Assign to agent" dropdown + "Mark resolved" button
- Notes textarea

**Static mock: 8 replies pre-seeded** across all label types

---

### 3.8 Analytics `/analytics`

**Date range selector** (Last 7 days / 30 days / 90 days — static, doesn't filter)

**KPI row (5 cards):**
- Emails Sent (142,300)
- Delivered Rate (97.2%)
- Open Rate (26.8%)
- Reply Rate (3.1%)
- Unsubscribe Rate (0.08%)

**Charts (CSS/Tailwind-based, no chart library needed):**

**Sending Volume** — 7-bar chart using `UProgress` stacked vertically or `div` with `width` % trick, labeled Mon–Sun

**Top Campaigns** — horizontal bar list (campaign name + % bar + count)

**Inbox Health Distribution** — 3 donut-style stat blocks (Healthy / Reduced / Paused)

**Reply Classification Breakdown** — 5 rows with colored bars:
- Interested 42% · success
- Questions 18% · info
- Not Interested 28% · neutral
- OOO 8% · warning
- Unsubscribe 4% · error

**Per-inbox table** (bottom): inbox email · sent 7d · health score · status badge · sparkline (tiny CSS bars)

---

### 3.9 Sent Emails `/sent-emails`

**Filter bar:** Campaign selector + Inbox selector + Status (All / Sent / Bounced / Failed) + date range

**Table:**
| To | From Inbox | Campaign | Template | Sent At | Status | Opens | Step |

**Static: 20 mock rows** with varied statuses

Row click → slide-over panel showing full email content preview

---

### 3.10 Queue Dashboard `/queue`

**3 stat cards (top):**
- Pending Jobs (847)
- Processing Now (23)
- Failed (5)

**Active workers** (table):
- Worker ID · Status (Active / Idle) · Jobs processed today · Current job

**Failed jobs** (table, with retry button per row):
- Job ID · Type (send_email) · Error message (truncated) · Failed at · Retry button

**Job type breakdown** (horizontal bars):
- send_email (812) · refresh_token (24) · warmup_send (11)

---

### 3.11 Users Management `/settings/users`

**Header:** "Team Members" + "Invite User" button → opens `UModal`

**Table:**
| Name | Email | Role | Status | Last Login | Actions |

**Static mock (6 users):**
1. Abdul Malik · admin@dxbpropvault.com · Super Admin · Active
2. Sara Ahmed · sara@dxbpropvault.com · Manager · Active
3. Khalid Hassan · khalid@dxbpropvault.com · Agent · Active
4. Fatima Al-Ali · fatima@dxbpropvault.com · Agent · Active
5. Omar Sheikh · omar@dxbpropvault.com · Viewer · Inactive
6. Nadia Karim · nadia@dxbpropvault.com · Admin · Active

**Invite modal:** Name, Email, Role selector (USelect), Send Invite button

**Row actions:** Edit Role / Deactivate (via `UDropdownMenu`)

---

### 3.12 Suppression List `/settings/suppression`

**Header:** "Suppression List" + count badge + "Add Email" button

**Search input** + "Import CSV" button

**Table:**
| Email | Reason | Added By | Added At |

Static mock: 10 rows with reasons (Unsubscribed / Bounced / Manual / Complained)

Confirm-delete dialog on row delete action

---

## 4. Existing Pages — Mock Data Replacements

| Page | Remove | Replace With |
|---|---|---|
| `contacts/index.vue` | `fetchContacts()` call in `onMounted` | 50 inline mock contacts in a `const MOCK_CONTACTS` array |
| `contacts/[id].vue` | `getContact()` call in `onMounted` | Single `MOCK_CONTACT` object matching the detail interface |
| `inboxes/index.vue` | `fetchInboxes()` call in `onMounted` | 8 inline mock inboxes with varied statuses and health scores |
| `health.vue` | Both `$fetch` calls | Static `MOCK_LIVENESS` and `MOCK_READINESS` objects |
| `index.vue` | `fetchContacts()` + `fetchInboxes()` calls | Full inline mock per section |

---

## 5. Layout Changes (`layouts/default.vue`)

- Sidebar expanded with all nav sections and dividers
- Section groups:
  - **Outreach:** Campaigns, Templates, Contacts
  - **Inboxes & Replies:** Inboxes, Replies (with unread badge), Sent Emails
  - **Monitoring:** Analytics, Queue, Health
  - **Settings:** Users, Suppression
- Settings section uses a collapsible sub-menu
- Sidebar footer: user avatar, name, role, logout button (existing — keep)

---

## 6. Shared Components to Create

| Component | Used By |
|---|---|
| `AppStatCard.vue` | Dashboard, Analytics, Campaign detail |
| `AppEmptyState.vue` | All list pages (zero-state) |
| `AppPageHeader.vue` | All pages (title + action slot) |
| `AppStatusBadge.vue` | Campaigns, Replies, Queue (wraps UBadge with type map) |
| `AppMiniChart.vue` | Analytics per-inbox table, Campaign detail |

---

## 7. Mock Data Strategy

All mock data lives **inside each page's `<script setup>`** as `const MOCK_*` — no external files, no composable calls. This makes every page self-contained and reviewable in isolation.

```typescript
// Example pattern used in every page
const MOCK_CAMPAIGNS = [
  { id: '1', name: 'Dubai Marina Owners Q2', status: 'running', ... },
  ...
]
const campaigns = ref(MOCK_CAMPAIGNS)
const loading = ref(false)
```

No `onMounted`, no `await`, no `$fetch`. Pages render instantly.

---

## 8. What Is NOT in Scope

- Real chart library (recharts, chart.js, etc.) — all charts are CSS/Tailwind
- Rich text editor — template body uses `<textarea>`
- Real-time updates / websockets
- File upload interaction for CSV (button renders, no handler)
- Toast notifications from actions (buttons render, no side effects)
- Mobile responsiveness below `sm` breakpoint

---

## 9. Build Order (Suggested)

| # | Page | Complexity |
|---|---|---|
| 1 | Layout sidebar update | Low |
| 2 | Shared components (StatCard, PageHeader, EmptyState) | Low |
| 3 | Existing pages — strip API, add mock data | Low |
| 4 | Dashboard redesign | Medium |
| 5 | Campaigns list | Medium |
| 6 | Templates list + detail/edit | Medium |
| 7 | Campaign detail (tabbed) | High |
| 8 | Campaign create wizard | High |
| 9 | Replies inbox | High |
| 10 | Analytics | Medium |
| 11 | Sent Emails | Low |
| 12 | Queue | Low |
| 13 | Users management | Low |
| 14 | Suppression list | Low |

---

## 10. Open Questions for Review

1. **Campaigns create wizard** — 4 linear steps or a sidebar stepper? Should step 2 (audience) show a real contact preview table or just a count?
2. **Templates editor** — plain `<textarea>` or a styled monospace-font editor with syntax highlighting for `{{variables}}`?
3. **Replies page** — should the left-column list auto-select the first reply on load, or start empty?
4. **Analytics charts** — CSS-only bars are fast to build but limited visually. Is a chart library acceptable even if API data isn't wired? (e.g. Chart.js with static data)
5. **Sidebar** — always visible wide sidebar, or should it collapse to icons on `md` and only expand on hover/toggle?
6. **Sent Emails slide-over** — full-width slide-over showing email HTML preview, or a modal?
