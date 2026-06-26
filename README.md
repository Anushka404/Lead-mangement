# Lead Management & Email Tracking System

A lead-capture form that stores submissions in Supabase, auto-sends a
personalized email with a trackable link + open pixel, and surfaces
open/click engagement on an analytics dashboard.

## Tech Stack

| Layer    | Choice |
|----------|--------|
| Framework | Next.js (App Router) + React + TypeScript |
| Styling   | Tailwind CSS |
| Database  | Supabase (Postgres) |
| Email     | Gmail SMTP (Nodemailer) |
| AI        | Groq (Llama 3.3, free tier) |
| Hosting   | Vercel (build is hosting-agnostic) |

## Architecture

```
 Browser form (/)                 Email client
       │ POST /api/leads              │  opens email → loads pixel
       ▼                              ▼
 ┌──────────────┐   insert    ┌──────────────────┐
 │ /api/leads   │────────────▶│ Supabase         │
 │  - validate  │  leads,     │  leads / emails  │
 │  - send mail │  emails     │  clicks          │
 └──────┬───────┘             └────────▲─────────┘
        │ Resend                        │ update opened_at / open_count
        ▼                               │ insert clicks
   personalized email          ┌────────┴─────────┐
   - open pixel  ──────────────▶│ /api/track/open │ (1x1 gif)
   - CTA link    ──────────────▶│ /api/track/click│ (302 redirect)
                                └──────────────────┘
                                         ▲
                                /dashboard reads aggregates
```

All database writes happen in server routes using the Supabase
**service-role key**. RLS is enabled on every table with no public policies,
so the anon key can read/write nothing.

## How Tracking Works

Every sent email gets a row in `emails` with an opaque `tracking_id` (uuid).
That id — never a raw database id — is the only identifier in public URLs.

- **Opens:** the email embeds `<img src="…/api/track/open?tid=…">`. When the
  client loads images, the route sets `opened_at` (first open only) and
  increments `open_count`, then returns a 1×1 transparent GIF with no-cache
  headers.
- **Clicks:** the CTA points at `…/api/track/click?tid=…&url=<encoded target>`.
  The route logs a `clicks` row and `302`-redirects to the target. The target
  is **allowlisted** to the `CTA_TARGET_URL` host to prevent open-redirect abuse.

**Limitation:** pixel-based open tracking is approximate. Clients that block
images under-count opens; proxies/prefetchers (e.g. Apple Mail Privacy
Protection) can over-count. Click tracking is reliable.

## Project Structure

```
app/
  page.tsx                  Lead capture form
  dashboard/page.tsx        Analytics dashboard (server component)
  api/leads/route.ts        POST: validate, insert lead + email row, send mail
  api/track/open/route.ts   GET: log open, return 1x1 gif
  api/track/click/route.ts  GET: log click, allowlist-checked 302 redirect
lib/
  supabase.ts               server service-role client factory
  email.ts                  HTML template + Resend send (guarded)
components/
  LeadForm.tsx              client form + validation
  StatCard.tsx              dashboard stat tile
supabase/schema.sql         tables + RLS + indexes
```

## Local Setup

1. **Supabase:** create a project, open the SQL editor, paste & run
   [`supabase/schema.sql`](supabase/schema.sql).
2. **Env:** `cp .env.local.example .env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API)
   - `GMAIL_USER` + `GMAIL_APP_PASSWORD` (optional — without them, emails are
     logged to the console instead of sent). App Password: Google account →
     enable 2FA → Security → App passwords. Sends to any recipient.
   - `NEXT_PUBLIC_BASE_URL` (e.g. `http://localhost:3000`)
   - `CTA_TARGET_URL` (where the "Learn more" button redirects)
3. **Run:**
   ```bash
   npm install
   npm run dev
   ```
   Form at `/`, dashboard at `/dashboard`.

> Without credentials the app still builds and runs: DB-backed routes return a
> clear "not configured" response and the dashboard shows zeros, so you can
> develop the UI before wiring services.

## Dashboard Metrics

Total Leads · Emails Sent · Emails Opened · Open Rate (opened ÷ sent) · Links
Clicked (distinct emails with ≥1 click) · Click Rate (clicked ÷ sent).

The **Lead Records** table lists each lead with open/click status and the
AI-assigned category + priority.

## AI Lead Classification (bonus)

After a lead is saved, [`lib/classify.ts`](lib/classify.ts) calls Groq
(`llama-3.3-70b-versatile`, free tier) in JSON mode to tag the requirement with
a **category** (Sales / Support / Partnership / Hiring / Other) and a
**priority** (High / Medium / Low); the response is validated with a Zod schema,
stored on the lead, and shown in the dashboard. Best-effort: if `GROQ_API_KEY`
is unset or the call fails, the lead still saves without tags. New `leads`
columns: run [`supabase/add-ai-columns.sql`](supabase/add-ai-columns.sql) if
your table predates this feature.
