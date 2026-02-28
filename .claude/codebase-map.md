# Handshake Marketplace — Codebase Map

> **Last updated**: 2026-02-28
> **Stack**: Next.js 16.1.6 · React 19 · Tailwind CSS v4 · Supabase · TypeScript strict
> **Build**: Clean (`next build` passes)
> **Source of truth**: this file + `.claude/agent-memory/project-state.md`

---

## 1. Folder Structure

```
MarketplaceMini/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Public auth pages
│   │   │   ├── layout.tsx       # Centered card wrapper
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── onboarding/page.tsx
│   │   │   └── error.tsx
│   │   ├── (platform)/          # Auth-gated app pages
│   │   │   ├── layout.tsx       # Navbar + Sidebar shell
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── dashboard/loading.tsx  # Streams DashboardSkeleton
│   │   │   ├── listings/page.tsx
│   │   │   ├── listings/new/page.tsx
│   │   │   ├── listing/[id]/page.tsx
│   │   │   ├── listing/[id]/edit/page.tsx
│   │   │   ├── jobs/page.tsx
│   │   │   ├── jobs/[id]/page.tsx
│   │   │   ├── messages/page.tsx
│   │   │   ├── profile/[id]/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── error.tsx
│   │   ├── layout.tsx           # Root layout — fonts, Toaster
│   │   ├── page.tsx             # Landing page (public)
│   │   ├── not-found.tsx
│   │   └── globals.css          # Tailwind + brand CSS vars
│   ├── components/
│   │   ├── ui/                  # 17 shadcn/ui primitives
│   │   ├── shared/              # 12 layout + global widgets
│   │   ├── listings/            # 10 listing components
│   │   ├── jobs/                # 10 job/offer/deal components
│   │   ├── messaging/           # 5 chat components
│   │   ├── profiles/            # 6 profile + trust components
│   │   └── reviews/             # 2 review components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser Supabase client
│   │   │   ├── server.ts        # Async server Supabase client
│   │   │   ├── middleware.ts    # Session refresh + route guard
│   │   │   └── actions.ts       # ALL server actions (799 lines)
│   │   ├── types/
│   │   │   ├── database.ts      # Full DB schema types (915 lines)
│   │   │   └── index.ts         # Re-exports from database.ts
│   │   ├── hooks/               # 4 Supabase Realtime hooks
│   │   ├── utils/               # State machine, seller score, timeline
│   │   ├── validations/         # 8 Zod schemas
│   │   └── constants/           # Categories, statuses, enums
│   └── middleware.ts            # Delegates to lib/supabase/middleware.ts
├── supabase/
│   ├── migrations/              # 00001–00008 (append-only)
│   └── seed.sql
├── docs/
│   └── architecture.md          # System design + data flow diagrams
├── scripts/
│   └── smoke-test.mjs           # Route health check
├── .claude/
│   ├── agents/                  # 7 agent definition files
│   ├── agent-memory/            # project-state.md
│   ├── workflows/               # update-codebase-map.md, context-management.md
│   └── skills/                  # Symlinks to installed skill packages
├── .agents/skills/              # Raw skill packages (9 installed)
├── public/                      # SVG assets only
├── CLAUDE.md                    # Project spec + AI rules
├── CODEBASE_MAP.md              # Legacy root map (may diverge — prefer .claude/)
├── package.json
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
└── components.json
```

---

## 2. Major Feature Locations

| Feature | Entry Point | Key Files |
|---------|------------|-----------|
| Landing page | `app/page.tsx` | `featured-providers.tsx`, `footer.tsx`, `navbar.tsx` |
| Auth | `app/(auth)/` | `actions.ts:signIn/signUp/signOut`, `lib/supabase/middleware.ts` |
| Onboarding | `app/(auth)/onboarding/page.tsx` | `constants/index.ts` (NZ_CITIES) |
| Browse listings | `app/(platform)/listings/page.tsx` | `listing-card.tsx`, `listing-filters.tsx`, `sort-select.tsx` |
| Listing detail | `app/(platform)/listing/[id]/page.tsx` | `job-request-form.tsx`, `seller-trust-card.tsx`, `instant-book-button.tsx` |
| Listing CRUD | `listings/new/`, `listing/[id]/edit/` | `listing-form.tsx` (540 lines) |
| Job overview | `app/(platform)/jobs/page.tsx` | `status-badge.tsx` |
| Job detail | `app/(platform)/jobs/[id]/page.tsx` | `job-detail-tabs.tsx`, `job-action-bar.tsx`, `offer-list.tsx`, `deal-summary.tsx` |
| Chat | `components/messaging/` | `chat-messages.tsx`, `chat-input.tsx`, `use-realtime-messages.ts` |
| Messages list | `app/(platform)/messages/page.tsx` | Batched 3-query approach (no N+1) |
| Dashboard | `app/(platform)/dashboard/page.tsx` | `seller-stats-card.tsx`, `activity-feed.tsx` |
| Public profile | `app/(platform)/profile/[id]/page.tsx` | `profile-header.tsx`, `review-list.tsx`, `trust-tier-badge.tsx` |
| Settings | `app/(platform)/settings/page.tsx` | `image-upload.tsx`, `validations/profile.ts` |
| Notifications | `components/shared/notification-bell.tsx` | `use-unread-count.ts`, `actions.ts:createNotification` |
| Reviews | `components/reviews/review-form.tsx` | `rating-breakdown.tsx`, `actions.ts:submitReview` |
| Saved sellers | `components/shared/save-seller-button.tsx` | `actions.ts:toggleSaveSeller` |
| Reporting | `components/shared/report-dialog.tsx` | `actions.ts:submitReport` |
| Instant book | `components/listings/instant-book-button.tsx` | `actions.ts:instantBook`, RPC `instant_book()` |

---

## 3. Database Layer

### Migrations (append-only, never edit)

| File | Adds |
|------|------|
| `00001_initial_schema.sql` | Core tables: profiles, listings, qualifications, job_requests, offers, deals, messages, reviews, reports, verifications. All RLS, indexes, triggers, `handle_new_user()` trigger |
| `00002_month2_functions.sql` | `accept_offer()` RPC (atomic deal creation), `update_profile_rating()` |
| `00003_seller_scoring.sql` | handshake_score, total_completed_deals, avg_response_hours, completion_rate on profiles; `recalculate_handshake_score()` RPC; `platform_seller_averages` view |
| `00004_rating_categories.sql` | avg_communication, avg_quality, avg_reliability on profiles + reviews; updated `update_profile_rating()` |
| `00005_listing_images.sql` | cover_image_url, images (text[]), tags (text[]) on listings |
| `00006_activity_feed.sql` | activity_feed table; view_count, request_count on listings; `increment_listing_view_count()` RPC |
| `00007_security_fixes.sql` | Messages UPDATE RLS fix; activity_feed INSERT restriction; atomic view count increment |
| `00008_profit_features.sql` | notifications table + realtime publication; saved_sellers table; instant_book, instant_book_price on listings; `instant_book()` RPC |
| `00009_chat_message_index.sql` | `idx_messages_chat ON messages(job_request_id, created_at)` — eliminates sort step on all chat page loads |
| `00010_revoke_anon_view_count.sql` | `REVOKE EXECUTE ON increment_listing_view_count FROM anon` — prevents unauthenticated view count inflation |

### Core Tables
`profiles` · `listings` · `qualifications` · `job_requests` · `offers` · `deals` · `messages` · `reviews` · `reports` · `verifications` · `activity_feed` · `notifications` · `saved_sellers`

### Key RPCs
| Function | Purpose |
|----------|---------|
| `accept_offer(p_offer_id, p_customer_id)` | Atomically creates deal, marks offer accepted, updates job status |
| `instant_book(p_listing_id, p_customer_id, p_description)` | Creates job_request + offer + deal + system message in one transaction |
| `recalculate_handshake_score(p_user_id)` | Recalculates composite seller score |
| `increment_listing_view_count(p_listing_id)` | Atomic view counter increment |
| `update_profile_rating(p_user_id)` | Recalculates avg_rating + multi-dim averages from reviews |

### Handshake Score Formula
```
score = (avg_rating / 5)                        × 40   # rating weight
      + min(total_reviews / 20, 1)               × 15   # review volume
      + completion_rate                           × 20   # completion
      + (1 - min(avg_response_hours / 48, 1))    × 15   # responsiveness
      + min(total_completed_deals / 50, 1)        × 10   # experience
```

### Trust Tiers
| Tier | Score | Min Deals |
|------|-------|-----------|
| `new` | < 30 | any |
| `rising` | 30–59 | 2+ |
| `trusted` | 60–79 | 5+ |
| `top_provider` | 80+ | 10+ |

---

## 4. Auth Logic

### Middleware (`src/lib/supabase/middleware.ts`)
- Refreshes Supabase session cookies on every request
- **Protected prefixes**: `/dashboard`, `/jobs`, `/messages`, `/settings`
  - Unauthenticated → redirect `/login`
- **Auth pages** (`/login`, `/signup`): authenticated → redirect `/dashboard`
- Note: `/listings/new` and `/listing/[id]/edit` are NOT in middleware — protected by server-side checks inside the page

### Security Layers (defense in depth)
```
Layer 1: Middleware      → Redirects unauthenticated users
Layer 2: Server Actions  → Validates auth.getUser() + role + business rules
Layer 3: RLS Policies    → PostgreSQL enforces per-row access via auth.uid()
Layer 4: SECURITY DEFINER → Atomic RPCs bypass RLS safely for deal creation
```

---

## 5. Server Actions (`src/lib/supabase/actions.ts`)

All mutations go through this single `"use server"` file. Line ranges:

| Group | Actions | Lines |
|-------|---------|-------|
| Auth | `signIn`, `signUp`, `signOut`, `getUser` | 1–62 |
| Messaging | `sendMessage`, `markMessagesAsRead` | 68–132 |
| Offers | `createOffer`, `acceptOffer`, `declineOffer` | 138–380 |
| Job transitions | `transitionJobStatus` | 381–460 |
| Reviews | `submitReview` | 461–530 |
| Reports | `submitReport` | 531–570 |
| Seller stats | `getSellerStats`, `recalculateSellerScore` | 571–650 |
| Notifications | `createNotification`, `markNotificationsRead`, `getUnreadNotificationCount` | 651–700 |
| Saved sellers | `toggleSaveSeller` | 701–732 |
| Instant book | `instantBook` | 738–783 |
| **Listings** | `createListing`, `updateListing` | 785–860 |
| Featured providers | `getFeaturedProviders` | 862–876 |

**No `/api/` routes exist.** No Supabase Edge Functions implemented.

---

## 6. Supabase Usage

### Clients
| File | Client Type | Used For |
|------|------------|---------|
| `lib/supabase/server.ts` | `createServerClient` (SSR) | Server Components, Server Actions |
| `lib/supabase/client.ts` | `createBrowserClient` (SSR) | Client Components, Realtime hooks |
| `lib/supabase/middleware.ts` | `createServerClient` (SSR) | Session refresh in middleware |

### Realtime Channels
| Channel | Type | Purpose |
|---------|------|---------|
| `messages:{jobRequestId}` | `postgres_changes` | New message delivery |
| `job_status:{jobRequestId}` | `postgres_changes` | Status change notifications |
| `typing:{jobRequestId}` | `Presence` | Typing indicators |
| `unread:{userId}` | `postgres_changes` | Navbar unread badge |

### Storage
- Bucket: used by `components/shared/image-upload.tsx`
- Stores: profile avatars, listing cover images, listing image galleries

### Active Realtime Tables (added to `supabase_realtime` publication)
- `messages` (migration 00001)
- `notifications` (migration 00008)

---

## 7. UI Component Groups

### `components/ui/` — shadcn/ui primitives (17)
`avatar` · `badge` · `button` · `card` · `dialog` · `dropdown-menu` · `form` · `input` · `label` · `select` · `separator` · `sheet` · `skeleton` · `sonner` · `table` · `tabs` · `textarea`

### `components/shared/` — Layout & global widgets (12)
`navbar` · `sidebar` · `mobile-nav` · `footer` · `user-menu` · `notification-bell` · `image-upload` · `save-seller-button` · `report-dialog` · `activity-feed` · `unread-badge` · `dashboard-skeleton`

### `components/listings/` — Listing display & forms (10)
`listing-card` · `listing-card-skeleton` · `listing-form` · `listing-filters` · `listing-tags` · `category-badge` · `price-display` · `sort-select` · `social-proof` · `instant-book-button`

### `components/jobs/` — Handshake flow (10)
`job-request-form` · `status-badge` · `offer-form-dialog` · `offer-card` · `offer-list` · `deal-summary` · `job-action-bar` · `job-detail-tabs` · `job-timeline` · `seller-trust-card`

### `components/messaging/` — Chat (5)
`chat-messages` · `message-bubble` · `chat-input` · `typing-indicator` · `chat-skeleton`

### `components/profiles/` — Trust & profiles (6)
`profile-header` · `review-list` · `trust-tier-badge` · `seller-stats-card` · `featured-providers` · `trust-profile-card`

### `components/reviews/` — Review system (2)
`review-form` · `rating-breakdown`

---

## 8. Config Files

| File | Purpose |
|------|---------|
| `package.json` | Next.js 16.1.6, React 19, Supabase, Zod v4, TanStack Query v5, RHF v7, date-fns v4 |
| `tsconfig.json` | Strict mode, `@/` → `./src` path alias |
| `postcss.config.mjs` | Tailwind CSS v4 via PostCSS |
| `eslint.config.mjs` | ESLint 9 flat config + Next.js rules |
| `components.json` | shadcn/ui config — `radix-ui` v1.4 unified package |
| `src/app/globals.css` | `--brand-start/end/accent` CSS vars, `.text-gradient`, tw-animate-css |
| `.env.local` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` only |
| `.claude/settings.local.json` | Claude Code allowed Bash/fetch permissions |
| `scripts/smoke-test.mjs` | GET all routes, fail on non-200 |
| `docs/architecture.md` | System diagrams, score formula, state machine, realtime channels |

### Environment Variables
| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Missing |
| `NEXT_PUBLIC_POSTHOG_KEY` | ❌ Missing |
| `NEXT_PUBLIC_DAILY_API_KEY` | ❌ Missing (Month 3) |
| `STRIPE_SECRET_KEY` | ❌ Missing (Month 4) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ Missing (Month 4) |

---

## 9. Routing Summary

| Route | Auth | Gate | Purpose |
|-------|------|------|---------|
| `/` | Public | — | Landing page |
| `/login` | Public | → `/dashboard` if authed | Login |
| `/signup` | Public | → `/dashboard` if authed | Signup |
| `/onboarding` | Public | — | Post-signup role + profile setup |
| `/listings` | Public | — | Browse + filter + paginate |
| `/listing/[id]` | Public | — | Detail, request form, reviews |
| `/profile/[id]` | Public | — | Public seller profile |
| `/dashboard` | **Middleware** | — | Buyer + seller dashboard |
| `/jobs` | **Middleware** | — | All job requests (tabs) |
| `/jobs/[id]` | **Middleware** | Participant (server-checked) | Job detail, chat, offers |
| `/messages` | **Middleware** | — | Conversations list |
| `/settings` | **Middleware** | — | Profile + seller settings |
| `/listings/new` | Server-checked | Seller only | Create listing |
| `/listing/[id]/edit` | Server-checked | Owner only | Edit listing |
