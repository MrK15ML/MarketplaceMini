# Handshake Marketplace — Complete Codebase Map

> **Last updated**: 2026-02-28
> **Status**: All features build-verified (`next build` passes clean)
> **Auto-update rule**: Update this file whenever files are added, removed, renamed, or their purpose changes.

---

## Root Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts (`dev`, `build`, `start`, `lint`) |
| `next.config.ts` | Next.js 16+ configuration |
| `tsconfig.json` | TypeScript strict mode, `@/` path alias |
| `postcss.config.mjs` | PostCSS for Tailwind CSS v4 |
| `eslint.config.mjs` | ESLint config |
| `components.json` | shadcn/ui config |
| `CLAUDE.md` | AI assistant instructions & project spec |
| `.env.local` | Environment variables (NEVER commit) |
| `.env.example` | Env var template |
| `scripts/smoke-test.mjs` | Route smoke test (checks all routes for non-404) |

---

## `src/` — Application Source

### `src/middleware.ts` (~20 lines)
- **Purpose**: Next.js middleware entry point
- **Exports**: `middleware`, `config`
- **Delegates to**: `@/lib/supabase/middleware` → `updateSession()`

---

### `src/app/` — Next.js App Router Pages

#### Root

| File | ~Lines | Purpose | Key Imports |
|------|--------|---------|-------------|
| `layout.tsx` | 58 | Root layout: fonts, global metadata (SEO), `<Toaster>` | `sonner` |
| `page.tsx` | 216 | Landing page: hero, features grid, categories, trust section, featured providers | `navbar`, `footer`, `featured-providers`, `supabase/server` |
| `not-found.tsx` | 27 | Custom 404 page | `button` |
| `globals.css` | — | Tailwind imports, brand CSS vars, custom utilities (`.text-gradient`, shadows, animations) | — |

#### `(auth)/` — Authentication Routes

| File | ~Lines | Purpose | Key Imports |
|------|--------|---------|-------------|
| `layout.tsx` | 19 | Centered card layout with logo | — |
| `login/page.tsx` | 113 | Login form (email/password) | `validations/auth`, `supabase/client` |
| `signup/page.tsx` | 152 | Signup form (email, password, display name) | `validations/auth`, `supabase/client` |
| `onboarding/page.tsx` | 195 | Two-step onboarding (role selection → city/bio) | `constants`, `supabase/client` |
| `error.tsx` | 35 | Auth error boundary | `button` |

#### `(platform)/` — Main App Routes

| File | ~Lines | Purpose | Key Imports |
|------|--------|---------|-------------|
| `layout.tsx` | 19 | Platform layout: `Navbar` + `Sidebar` | `navbar`, `sidebar` |
| `error.tsx` | 41 | Platform error boundary | `button`, `card` |
| `dashboard/page.tsx` | 383 | Dashboard: requests, incoming jobs, listings, seller stats, activity feed, saved providers | `supabase/server+actions`, `status-badge`, `category-badge`, `seller-stats-card`, `activity-feed` |
| `listings/page.tsx` | 256 | Browse listings: filters, search, sort, pagination (12/page) | `supabase/server`, `listing-*`, `constants` |
| `listings/new/page.tsx` | 50 | Create listing (seller gate check) | `supabase/server`, `listing-form` |
| `listing/[id]/page.tsx` | 305 | Listing detail: job request form, trust card, reviews, "more from seller", instant book | `supabase/server+actions`, `listing-*`, `job-*`, `profile-*` |
| `listing/[id]/edit/page.tsx` | 45 | Edit listing (ownership check) | `supabase/server`, `listing-form` |
| `jobs/page.tsx` | 195 | Jobs overview: tabs "My Requests" / "Incoming" (sellers) | `supabase/server`, `status-badge` |
| `jobs/[id]/page.tsx` | 297 | Job detail: tabs (chat, offers, deal, timeline), action bar | `supabase/server+actions`, `job-*`, `messaging/*` |
| `messages/page.tsx` | 180 | Messages overview (optimized: 3 queries total, not N+1) | `supabase/server`, `status-badge` |
| `profile/[id]/page.tsx` | 155 | Public profile: listings/reviews tabs, seller stats, save/report buttons | `supabase/server+actions`, `profile-*`, `shared/*` |
| `settings/page.tsx` | 248 | Settings: profile update, seller mode toggle, avatar, bio | `supabase/server`, `validations/profile`, `constants` |

---

### `src/lib/` — Core Libraries

#### `supabase/` — Supabase Integration

| File | ~Lines | Purpose | Exports |
|------|--------|---------|---------|
| `client.ts` | 10 | Browser Supabase client factory | `createClient` |
| `server.ts` | 30 | Server Supabase client factory (async) | `createClient` |
| `middleware.ts` | 62 | Auth session + route protection logic | `updateSession` |
| `actions.ts` | 799 | **All server actions** (mutations + complex queries) | `signIn`, `signUp`, `signOut`, `getUser`, `sendMessage`, `createOffer`, `acceptOffer`, `declineOffer`, `transitionJobStatus`, `submitReview`, `submitReport`, `markMessagesAsRead`, `recalculateSellerScore`, `getSellerStats`, `createNotification`, `markNotificationsRead`, `getUnreadNotificationCount`, `toggleSaveSeller`, `instantBook`, `getFeaturedProviders` |

#### `types/` — TypeScript Types

| File | ~Lines | Purpose | Key Exports |
|------|--------|---------|-------------|
| `database.ts` | 915 | Full Database schema types + convenience aliases | `Database`, `Profile`, `Listing`, `JobRequest`, `Offer`, `Deal`, `Message`, `Review`, `Report`, `Verification`, `ActivityFeedItem`, `Notification`, `SavedSeller`, `Category`, `PricingType`, `JobRequestStatus`, `OfferStatus`, `DealStatus`, `TrustTier`, `SellerStats`, `PlatformAverages`, all Insert/Update types |
| `index.ts` | 60 | Re-exports everything from `database.ts` | (all above) |

#### `utils/` — Utility Functions

| File | ~Lines | Purpose | Key Exports |
|------|--------|---------|-------------|
| `state-machine.ts` | 64 | Job status transition rules & validation | `Role`, `JOB_STATUS_TRANSITIONS`, `canTransition`, `getAvailableTransitions` |
| `seller-score.ts` | 65 | Trust tier calculation & metric formatting | `TRUST_TIER_CONFIG`, `getTrustTier`, `getTrustTierConfig`, `formatResponseTime`, `formatCompletionRate` |
| `job-timeline.ts` | 40 | Timeline steps generator for job detail UI | `TimelineStep`, `getTimelineSteps` |
| `../utils.ts` | 7 | Tailwind `cn()` class merge (shadcn standard) | `cn` |

#### `constants/` — App Constants

| File | ~Lines | Purpose | Key Exports |
|------|--------|---------|-------------|
| `categories.ts` | 243 | 12 service categories with icons, labels, descriptions, subcategories | `CategoryConfig`, `CATEGORIES`, `getCategoryConfig` |
| `index.ts` | 106 | Statuses, pricing types, cities, sort options, banned services | `PRICING_TYPES`, `JOB_REQUEST_STATUSES`, `getStatusConfig`, `LICENSED_TRADE_TYPES`, `NZ_CITIES`, `LISTING_SORT_OPTIONS`, `QUALIFICATION_TYPES`, etc. |

#### `hooks/` — Client-Side React Hooks

| File | ~Lines | Purpose | Export |
|------|--------|---------|--------|
| `use-realtime-messages.ts` | 84 | Realtime message subscription with dedup | `useRealtimeMessages` |
| `use-realtime-job-status.ts` | 45 | Realtime job status change subscription | `useRealtimeJobStatus` |
| `use-unread-count.ts` | 69 | Global + per-job unread message counts | `useUnreadCount` |
| `use-typing-indicator.ts` | 106 | Presence-based typing indicator | `useTypingIndicator` |

#### `validations/` — Zod Schemas

| File | ~Lines | Schema Exports |
|------|--------|----------------|
| `auth.ts` | 29 | `loginSchema`, `signupSchema`, `onboardingSchema` + value types |
| `listing.ts` | 48 | `listingSchema`, `ListingFormValues` |
| `profile.ts` | 19 | `profileUpdateSchema`, `qualificationSchema` + value types |
| `job-request.ts` | 29 | `jobRequestSchema`, `JobRequestFormValues` |
| `offer.ts` | 15 | `offerSchema`, `OfferFormValues` |
| `review.ts` | 12 | `reviewSchema`, `ReviewFormValues` |
| `message.ts` | 11 | `messageSchema`, `MessageFormValues` |
| `report.ts` | 9 | `reportSchema`, `ReportFormValues` |

---

### `src/components/` — React Components

#### `ui/` — shadcn/ui Base Components (standard, rarely modified)

`avatar.tsx` · `badge.tsx` · `button.tsx` · `card.tsx` · `dialog.tsx` · `dropdown-menu.tsx` · `form.tsx` · `input.tsx` · `label.tsx` · `select.tsx` · `separator.tsx` · `sheet.tsx` · `skeleton.tsx` · `sonner.tsx` · `table.tsx` · `tabs.tsx` · `textarea.tsx`

All export their named component + subcomponents. Import `cn` from `@/lib/utils`.

#### `shared/` — Shared/Layout Components

| File | ~Lines | Purpose | Key Props/Behavior |
|------|--------|---------|-------------------|
| `navbar.tsx` | 93 | Top nav: logo, links, UserMenu, NotificationBell, MobileNav | Server component, fetches user |
| `sidebar.tsx` | 60 | Desktop sidebar nav (hidden on mobile) | Server component, shows unread badge |
| `mobile-nav.tsx` | 85 | Mobile Sheet slide-out navigation | Server component |
| `footer.tsx` | 35 | Site footer | Static |
| `user-menu.tsx` | 60 | Avatar dropdown (settings, dashboard, sign out) | Client component |
| `notification-bell.tsx` | 130 | Bell icon + dropdown, realtime subscription, mark-all-read | Client component, realtime |
| `report-dialog.tsx` | 95 | Report user/listing dialog form | Client component |
| `image-upload.tsx` | 120 | Image upload to Supabase Storage | Client component |
| `save-seller-button.tsx` | 75 | Heart icon to save/unsave sellers | Client component |
| `activity-feed.tsx` | 85 | Activity feed items display | `items: ActivityFeedItem[]` |
| `dashboard-skeleton.tsx` | 40 | Dashboard loading skeleton | — |
| `unread-badge.tsx` | 15 | Unread count badge circle | `count: number` |

#### `listings/` — Listing Components

| File | ~Lines | Purpose | Key Props |
|------|--------|---------|-----------|
| `listing-card.tsx` | 159 | Image-first card: cover image, trust signals, instant book badge, verified badge, "New" sparkle | `listing: Listing & {profiles}` |
| `listing-form.tsx` | 540 | Create/edit form: all fields, pricing logic, cover image, tags, instant book | `listing?: Listing` (edit mode) |
| `listing-filters.tsx` | 95 | Category, subcategory, location, remote filter controls | URL search params |
| `sort-select.tsx` | 35 | Sort dropdown | URL search params |
| `category-badge.tsx` | 20 | Category badge with icon | `category: string` |
| `price-display.tsx` | 35 | Formatted price by pricing_type | `listing: Listing` |
| `listing-tags.tsx` | 25 | Tags as badges | `tags: string[]` |
| `social-proof.tsx` | 40 | View count / request count indicators | `viewCount, requestCount` |
| `listing-card-skeleton.tsx` | 25 | Card loading skeleton | — |
| `instant-book-button.tsx` | 80 | Instant book with confirmation dialog | `listing, userId` |

#### `jobs/` — Job/Offer/Deal Components

| File | ~Lines | Purpose | Key Props |
|------|--------|---------|-----------|
| `job-request-form.tsx` | 195 | Structured request form (description, budget, time, location) | `listingId, sellerId, category` |
| `status-badge.tsx` | 20 | Color-coded status badge | `status: string` |
| `offer-form-dialog.tsx` | 150 | Seller offer creation dialog | `jobRequestId` |
| `offer-card.tsx` | 80 | Single offer display with accept/decline | `offer, isCustomer, jobStatus` |
| `offer-list.tsx` | 55 | List of all offers for a job | `offers[], isCustomer, jobStatus` |
| `deal-summary.tsx` | 75 | Accepted deal summary card | `deal: Deal` |
| `job-action-bar.tsx` | 110 | Context-aware actions (send offer, cancel, complete) | `jobRequest, role` |
| `job-detail-tabs.tsx` | 95 | Tabs: chat, offers, deal, timeline | `jobRequest, messages, offers, deal` |
| `job-timeline.tsx` | 65 | Visual progress timeline | `jobRequest` |
| `seller-trust-card.tsx` | 85 | Compact seller trust card (listing detail sidebar) | `seller: Profile` |

#### `messaging/` — Chat Components

| File | ~Lines | Purpose | Key Props |
|------|--------|---------|-----------|
| `chat-messages.tsx` | 75 | Message list + realtime subscription + auto-scroll + mark-as-read | `jobRequestId, initialMessages, userId` |
| `message-bubble.tsx` | 65 | Individual message bubble with grouping | `message, isOwn, showAvatar` |
| `chat-input.tsx` | 90 | Message input + typing indicator broadcast | `jobRequestId, userId` |
| `typing-indicator.tsx` | 25 | "User is typing..." dots animation | `userName` |
| `chat-skeleton.tsx` | 20 | Chat loading skeleton | — |

#### `profiles/` — Profile/Trust Components

| File | ~Lines | Purpose | Key Props |
|------|--------|---------|-----------|
| `profile-header.tsx` | 110 | Profile header: avatar, name, verified, location, rating, trust tier, save btn | `profile, isSeller, isSaved` |
| `review-list.tsx` | 80 | Reviews list with reviewer info + multi-dim ratings | `reviews[]` |
| `trust-tier-badge.tsx` | 25 | Trust tier badge (New/Rising/Trusted/Top) | `tier: TrustTier` |
| `seller-stats-card.tsx` | 120 | Seller stats with platform average comparisons | `stats: SellerStats, averages` |
| `featured-providers.tsx` | 90 | Featured providers grid on landing page | `providers[]` |
| `trust-profile-card.tsx` | 95 | Compact/full profile card with trust signals | `profile, variant` |

#### `reviews/` — Review Components

| File | ~Lines | Purpose | Key Props |
|------|--------|---------|-----------|
| `review-form.tsx` | 180 | Review form: overall + category ratings (communication/quality/reliability) | `dealId, revieweeId` |
| `rating-breakdown.tsx` | 75 | Multi-dimensional rating bars | `profile` (with avg_communication, etc.) |

---

## `supabase/` — Database

### Migrations (run in order)

| File | Purpose |
|------|---------|
| `00001_initial_schema.sql` | Core tables (profiles, listings, qualifications, job_requests, offers, deals, messages, reviews, reports, verifications), all RLS policies, indexes, triggers |
| `00002_month2_functions.sql` | `accept_offer()` RPC (atomic deal creation), `update_profile_rating()` |
| `00003_seller_scoring.sql` | Handshake score columns, `recalculate_handshake_score()` RPC, `platform_seller_averages` view |
| `00004_rating_categories.sql` | Multi-dim reviews: `rating_communication/quality/reliability` on reviews + profiles, updated `update_profile_rating()` |
| `00005_listing_images.sql` | `cover_image_url`, `images` (text[]), `tags` (text[]) on listings |
| `00006_activity_feed.sql` | `activity_feed` table, `view_count`/`request_count` on listings, `increment_listing_view_count` RPC |
| `00007_security_fixes.sql` | Messages UPDATE RLS, activity_feed INSERT restriction, atomic view count increment |
| `00008_profit_features.sql` | `notifications` table + RLS + realtime, `saved_sellers` table + RLS, `instant_book` on listings, `instant_book()` RPC |

### `seed.sql`
Development seed data.

---

## Routing & Auth Summary

| Route | Auth | Purpose |
|-------|------|---------|
| `/` | Public | Landing page |
| `/login` | Public (redirects to `/dashboard` if authed) | Login |
| `/signup` | Public (redirects to `/dashboard` if authed) | Signup |
| `/listings` | Public | Browse listings |
| `/listing/[id]` | Public | Listing detail |
| `/profile/[id]` | Public | Profile page |
| `/dashboard` | **Auth-gated** → `/login` | User dashboard |
| `/jobs` | **Auth-gated** → `/login` | Job requests |
| `/jobs/[id]` | **Auth-gated** → `/login` | Job detail |
| `/messages` | **Auth-gated** → `/login` | Messages |
| `/settings` | **Auth-gated** → `/login` | Settings |
| `/listings/new` | **Auth-gated** + seller check | Create listing |
| `/listing/[id]/edit` | **Auth-gated** + ownership check | Edit listing |

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Client   │  │ Realtime │  │ React Hook Form  │  │
│  │ Hooks    │  │ Channels │  │ + Zod Validation │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
└───────┼──────────────┼─────────────────┼────────────┘
        │              │                 │
        ▼              ▼                 ▼
┌───────────────┐ ┌──────────┐  ┌───────────────────┐
│ supabase/     │ │ Supabase │  │ Server Actions    │
│ client.ts     │ │ Realtime │  │ (actions.ts)      │
│ (reads)       │ │ (WS)    │  │ (mutations)       │
└───────┬───────┘ └────┬─────┘  └────────┬──────────┘
        │              │                  │
        ▼              ▼                  ▼
┌─────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL + RLS)             │
│  Tables → RLS Policies → RPCs → Realtime → Storage  │
└─────────────────────────────────────────────────────┘
```

---

## Key Patterns Quick Reference

| Pattern | Details |
|---------|---------|
| Type casting | `const x = data as Profile` (Supabase returns `{}` without codegen) |
| RPC types | Define in `Database["public"]["Functions"]` |
| Zod + RHF | `zodResolver(schema) as any` cast needed |
| After mutations | Always `router.refresh()` in client components |
| Sorting joins | `query.order("field", { referencedTable: "profiles" })` |
| Route protection | `protectedPrefixes.some()` in middleware |
| Imports | Always use `@/` alias (absolute) |

---

## Stats

- **~85** TypeScript/TSX files
- **~12,000+** lines of code
- **18** route pages
- **62** React components
- **8** Zod validation schemas
- **8** database migrations
- **4** realtime hooks
- **4** utility modules
- **20** server actions in `actions.ts`
