# NeuroEye Log — Codex Instructions

## Design System
Always read [DESIGN.md](DESIGN.md) before making any visual or UI decisions.
All font choices, colors, spacing, component specs, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Stack
- **Framework:** Next.js 15 (App Router), TypeScript
- **Database:** Supabase (PostgreSQL only — no Supabase Auth)
- **Auth:** Auth.js v5 (NextAuth) with Google provider + Postgres adapter (`@auth/pg-adapter`). Env vars: `AUTH_SECRET` (not `NEXTAUTH_SECRET`), `AUTH_URL` (not `NEXTAUTH_URL`) — wrong names silently break auth.
- **PWA:** `@serwist/next` (`skipWaiting: true`, `clientsClaim: true`). Fonts (DM Sans, Geist Mono) must be in `runtimeCaching` — never depend on Google CDN when offline. Installable from Safari, no App Store required.
- **Offline:** IndexedDB via idb-keyval, sync on reconnect (last-write-wins upsert)
- **Charts:** Recharts
- **Stats:** simple-statistics (Spearman via rank arrays + sampleCorrelation — NOT direct sampleCorrelation which is Pearson)
- **PDF:** jsPDF + html2canvas (capture Recharts as rasterized images)

## Architecture Rules
- All DB access through Next.js Server Actions only. Never expose service role key to client.
- RLS policies are `using (false)` — defense in depth. Service role key bypasses on server.
- Auth.js session provides `user.id` — always validate in every Server Action before any DB operation.
- Timezone: store IANA timezone in `users.timezone`. Use `toLocaleDateString('en-CA', { timeZone: userTimezone })` for date grouping. Never use `'local'` in SQL.
- `logged_at` must be set **client-side** at form submission time for all tables (check_ins, drops, triggers). `default now()` in DB is a fallback only. Offline submissions must send the time the user actually logged — not the sync time.
- Offline write pattern: generate `id = crypto.randomUUID()` and `logged_at = new Date().toISOString()` client-side before calling the Server Action. On failure, queue to IndexedDB with that same UUID. On sync, use `upsert` with `id` as conflict key (idempotent, last-write-wins).

## Product Context
Health tracker for neuropathic dry eye disease. The user may be in pain when they open this app.
- Dark-mode only. No light mode toggle. Ever.
- No gamification. No streaks, no badges, no celebration animations.
- 48px minimum touch targets. Non-negotiable.
- Every screen does ONE job.
