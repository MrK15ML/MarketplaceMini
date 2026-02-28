# Handshake Marketplace — Project State

> **Last updated**: 2026-02-28
> **Phase**: MVP complete — Month 2 done, Month 3 not started
> **Build**: Clean (`next build` passes)

---

## Working Features

### Auth & Onboarding
- Email/password signup + login (Supabase Auth)
- Auto-profile row created on signup via `handle_new_user()` DB trigger
- Two-step onboarding: role selection → city + bio
- Middleware route protection: `/dashboard`, `/jobs`, `/messages`, `/settings`
- Authed users redirected away from `/login` and `/signup`
- Auth + platform error boundary pages

### Listings
- Full CRUD (create, edit, deactivate) — seller-gated, owner-checked server-side
- 12 categories with icons, labels, subcategories
- Pricing types: fixed / range / hourly
- Cover image + image gallery (Supabase Storage)
- Tags (text array)
- Location radius or remote flag
- Availability windows (JSONB stored)
- Licensed trade flag + license type field
- Instant book flag + price
- Browse: category, subcategory, location, remote filters
- Sort: newest / rating / price asc+desc
- Pagination: 12 per page
- View count (atomic RPC), request count

### Handshake Flow
- Structured job request form (description, budget, time, location, attachments)
- 9-status state machine: `pending → clarifying → offered → accepted → in_progress → completed → reviewed` + `cancelled` / `declined`
- `canTransition()` enforced server-side before every status mutation
- Offer versioning: new offers supersede pending ones
- `accept_offer()` RPC — atomic deal creation (SECURITY DEFINER)
- `instant_book()` RPC — creates job + offer + deal + system message atomically
- Deal summary auto-generated from accepted offer
- Role-aware job action bar (seller vs customer actions)
- Visual job timeline (7 steps)

### Messaging
- In-app chat scoped to job requests only
- Supabase Realtime (`messages:{jobRequestId}` channel) with dedup
- Typing indicator via Presence channel (`typing:{jobRequestId}`)
- Auto-scroll + mark-as-read on view
- System messages on every status transition
- Messages list page: batched 3-query fetch (no N+1)
- Auto-transition `pending → clarifying` on first message send
- Content validation: 1–2000 chars, sender must be participant

### Trust & Reviews
- Star ratings (1–5) + text reviews, bidirectional
- Multi-dimensional ratings: communication / quality / reliability
- `update_profile_rating()` RPC recalculates all averages atomically
- Handshake Score (0–100 composite): rating 40% + review volume 15% + completion 20% + response time 15% + experience 10%
- Trust tiers: `new` (<30, any deals) · `rising` (30–59, 2+) · `trusted` (60–79, 5+) · `top_provider` (80+, 10+)
- `platform_seller_averages` view for benchmark comparisons
- Seller stats card with benchmark deltas

### Profiles
- Public profile pages (listings + reviews tabs)
- Avatar upload (Supabase Storage)
- Seller mode toggle in settings
- Profile-level + listing-level qualifications (license, cert, portfolio, testimonial)
- Featured providers on landing (ranked by handshake_score > 0)

### Notifications (Realtime)
- In-app bell, realtime via `unread:{userId}` postgres_changes channel
- 8 event types: `new_request` · `new_offer` · `offer_accepted` · `offer_declined` · `new_message` · `review_received` · `job_completed` · `job_cancelled`
- Deep-link `href` to relevant page
- Mark all as read
- Triggered by: sendMessage, createOffer, acceptOffer, instantBook

### Saved Sellers
- Heart toggle on profile + listing pages
- Unique constraint prevents duplicates
- Cannot save self (server-validated)
- Saved providers section on dashboard

### Dashboard
- My requests (customer, 5 most recent)
- Incoming jobs (seller — pending/clarifying)
- My listings with edit links
- Seller stats card (is_seller only)
- Activity feed
- Saved providers

### Reporting
- Report dialog for users and listings
- Reason + description
- Stored with status: `open → investigating → resolved → dismissed`

### UX & Platform
- Mobile sheet nav, responsive all pages
- Loading skeletons: dashboard, chat, listing cards
- `dashboard/loading.tsx` wires `DashboardSkeleton` for Suspense streaming (2026-02-28)
- Sonner toasts for all mutations
- Error boundaries (auth + platform) — `(platform)/error.tsx` uses `useRouter` (not `window.location.href`)
- Chat card uses `dvh`-based height (`min-h-[200px] h-[55dvh] max-h-[450px]`) — input stays visible when mobile keyboard opens (2026-02-28)
- `ChatInput` outer div has `shrink-0` — never compressed when card shrinks on small viewports
- Custom 404
- SEO metadata on key pages
- RLS on all 13 tables, server-side ownership checks in actions

---

## Partial Features

| Feature | What Works | What's Missing |
|---------|-----------|----------------|
| **Geolocation** | `location_lat/lng` columns on profiles + listings | Never used in queries — no radius search |
| **Availability matching** | `availability` JSONB stored on listings | Not filterable — UI and query not built |
| **Qualification verification** | Upload works, `verified` boolean exists | No admin review workflow; `verified` never set to true |
| **Dispute flow** | `deals.status = 'disputed'` exists in schema | No UI, no flow to trigger it |
| **Email notifications** | — | Only in-app; no transactional email (Resend/SendGrid not installed) |
| **Admin / moderation** | Reports stored in DB | No UI to list, review, or action reports |
| **Job / messages pagination** | Listings paginated | Jobs and messages list pages have no pagination — will degrade at scale |
| **Image upload validation** | Uploads work | No client-side file size cap or MIME type check |

---

## Missing Features

| Feature | Target | Blocker |
|---------|--------|---------|
| **Stripe payments** | Month 4 | SDK not installed, no keys |
| **Daily.co video calls** | Month 3 | SDK not installed, no keys |
| **PostHog analytics** | Planned | SDK not installed, no key, no events wired anywhere |
| **ID verification** | Phase 2 | Stripe Identity / Persona not integrated |
| **Supabase Edge Functions** | Planned | `supabase/functions/` directory does not exist |
| **Full-text search** | Planned | Listings filter is exact-match category/location only |
| **Mobile apps** | Month 6 | Web only |
| **Arbitration system** | Long-term | No design |
| **Advanced matching** | Long-term | No design |
| **Background checks** | Long-term | No integration |
| **`.env.example`** | — | File referenced in CLAUDE.md but doesn't exist |
| **`SUPABASE_SERVICE_ROLE_KEY`** | — | Not in `.env.local`; required for any privileged server-side operations |

---

## Known Technical Debt

### High Priority
1. **`actions.ts` monolith** — ~860 lines, all domains in one file. Needs splitting: `auth.ts`, `listings.ts`, `jobs.ts`, `messaging.ts`, `reviews.ts`, `notifications.ts`
2. **No tests** — Zero test files. `tests/` directory referenced in CLAUDE.md doesn't exist. No unit, integration, or e2e coverage
3. **Manual type casting** — `data as Profile`, `data as JobRequest` everywhere because there's no Supabase type codegen. Runtime type mismatch risk
4. **`zodResolver(schema) as any`** — Zod v4 + RHF v7 type incompatibility workaround used in all forms

### Medium Priority
5. **PostHog not wired** — CLAUDE.md mandates events for: listing created, request sent, offer made, deal accepted, review left. None implemented
6. **TanStack Query installed but unused for mutations** — All mutations use `router.refresh()` (full server re-render). Installed for realtime hooks only
7. **Realtime publication incomplete** — Only `messages` and `notifications` tables explicitly added to `supabase_realtime`. `job_status` hook uses broadcast/postgres_changes but may not be published
8. **Listing search is basic** — No `tsvector` / full-text search; category filter is exact enum match only
9. **No optimistic updates** — Every form submission causes a full page reload via `router.refresh()`
10. **Seed data stale** — `supabase/seed.sql` likely missing columns added in migrations 00003–00009
11. **DB security gaps (audited 2026-02-28)** — `anon` view count inflation fixed (00010) ✓; still pending (00011): notifications INSERT spam vector, deals direct INSERT bypasses RPCs, offers INSERT doesn't verify job ownership, listings INSERT doesn't check is_seller
12. **Security gaps (app layer, audited 2026-02-28)** — signup/page.tsx calls browser Supabase directly (bypasses server action); image upload MIME check client-side only (SVG XSS risk); `select("*")` on profiles leaks GPS coords in RSC payload; no rate limiting on auth endpoints
12. **DB performance gaps (audited 2026-02-28)** — `idx_messages_chat` added (00009) ✓; still missing: `deals(job_request_id)`, `listings(category, is_active)` composite, FK indexes on saved_sellers/verifications/reports
13. **`recalculate_handshake_score` double-count bug** — `v_completed_deals` assigned twice in 00003; dead code, should be cleaned up in 00011
14. **UX gaps (audited 2026-02-28)** — chat keyboard fix done ✓; remaining 9 issues: pagination breaks on mobile (`listings/page.tsx`), job form grid too tight below 640px (`job-request-form.tsx`), sticky action bar consumes vertical space (`jobs/[id]/page.tsx`), unread badge disappears when tab active (`job-detail-tabs.tsx`), no active filter count visible (`listing-filters.tsx`), empty states inconsistent (`jobs/page.tsx`), chat auto-scroll interrupts reading (`chat-messages.tsx`), offer dialog too narrow on mobile (`offer-form-dialog.tsx`), no bottom nav (`sidebar.tsx`)

### Low Priority
11. **Two codebase maps** — Root `CODEBASE_MAP.md` (legacy) and `.claude/codebase-map.md` (current). Root may diverge
12. **`radix-ui` v1.4 unified package** — shadcn components were designed for individual `@radix-ui/react-*` packages; unified package compatibility not confirmed for all components
13. **No `.env.example`** — New contributors have no template
14. **`docs/architecture.md` trust tier thresholds** differ slightly from `seller-score.ts` implementation — docs say `new < 30`, code uses `< 40`. Code is authoritative

---

## Architecture Notes (for agents)

- **All mutations** → `src/lib/supabase/actions.ts` (`"use server"`) — including listing CRUD (browser client path removed 2026-02-28)
- **All reads** → `createClient()` in Server Components directly
- **Realtime** → `src/lib/hooks/` using `supabase.channel()`
- **State machine** → always call `canTransition()` before `transitionJobStatus()`
- **Offers are structured objects** — never store offer data as chat messages
- **Migrations are append-only** — never edit existing files; next is `00011_`
- **RLS + server action auth** — both required; never rely on one alone
- **`/listings/new` and `/listing/[id]/edit`** — NOT middleware-protected; use server-side `redirect()` checks
