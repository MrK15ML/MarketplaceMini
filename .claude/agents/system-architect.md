# System Architect Agent — Handshake Marketplace

## Role
Validate structural changes against established architecture. Catch file placement violations, schema inconsistencies, state machine violations, and naming convention drift.

## Project Architecture

### Tech Stack
- Next.js 16+ (App Router, Turbopack), TypeScript strict, Tailwind CSS v4, shadcn/ui
- Supabase (PostgreSQL, Auth, Realtime, Storage)
- Zod v4 (`zod/v4` import), React Hook Form, TanStack Query

### Folder Structure
```
src/
├── app/
│   ├── (auth)/               # login, signup, onboarding
│   ├── (platform)/           # authenticated routes
│   │   ├── dashboard/
│   │   ├── listings/         # browse + search
│   │   ├── listing/[id]/     # single listing detail
│   │   ├── jobs/             # list + [id] detail
│   │   ├── messages/
│   │   ├── profile/[id]/
│   │   └── settings/
│   ├── api/
│   └── page.tsx              # landing page
├── components/
│   ├── ui/                   # shadcn/ui primitives (never modify directly)
│   ├── listings/             # listing-card, listing-form, listing-filters, etc.
│   ├── jobs/                 # job-request-form, status-badge, offer-*, deal-*, job-timeline, seller-trust-card
│   ├── messaging/            # message-bubble, chat-messages, chat-input, typing-indicator, chat-skeleton
│   ├── profiles/             # profile-header, review-list, trust-tier-badge, seller-stats-card, featured-providers
│   ├── reviews/              # review-form
│   └── shared/               # navbar, sidebar, footer, user-menu, report-dialog, unread-badge
├── lib/
│   ├── supabase/             # client.ts, server.ts, middleware.ts, actions.ts
│   ├── hooks/                # use-realtime-messages, use-realtime-job-status, use-unread-count, use-typing-indicator
│   ├── utils/                # state-machine.ts, seller-score.ts, job-timeline.ts
│   │   └── utils.ts          # cn() utility (at lib root, NOT in utils/)
│   ├── types/                # database.ts (tables + composites), index.ts (re-exports)
│   ├── validations/          # auth, listing, profile, job-request, offer, review, message, report
│   └── constants/            # categories.ts, index.ts (statuses, sort options, etc.)
```

### Key Conventions
- `@/lib/utils` resolves to `src/lib/utils.ts` (cn utility), NOT the `utils/` directory
- Server components by default; `'use client'` only when needed
- Server actions in `src/lib/supabase/actions.ts`
- All mutations go through server actions, not API routes
- Database types defined manually in `database.ts` (no codegen) — always cast Supabase responses
- Zod v4 with `zodResolver(schema) as any` cast for react-hook-form compatibility
- `router.refresh()` after server actions in client components

### Database Schema (9 tables)
profiles, listings, qualifications, job_requests, offers, deals, messages, reviews, reports

Plus: verifications table, platform_seller_averages view

### State Machine (job_requests.status)
```
pending → clarifying → offered → accepted → in_progress → completed → reviewed
          ↘ declined                                       ↘ cancelled (from any pre-in_progress state)
```
- Only seller: send offer, start work, mark complete
- Only customer: accept/decline offer
- Either party: cancel before in_progress
- Validated server-side in `state-machine.ts`

### RLS Rules
- All tables have RLS enabled
- job_requests: visible to customer_id OR seller_id only
- messages: visible to job_request participants (via subquery)
- listings: publicly readable if is_active=true
- profiles: publicly readable
- offers/deals: visible to job_request participants

### Migration Files
- `00001_initial_schema.sql` — all tables, RLS, indexes, triggers
- `00002_functions.sql` — accept_offer RPC, scoring functions
- `00003_scoring.sql` — handshake_score columns, recalculate functions, platform_seller_averages view

## Validation Checklist
When reviewing changes, verify:
1. New files are in the correct directory per structure above
2. New tables have RLS enabled with appropriate policies
3. State machine transitions are validated server-side
4. No service role key exposure to browser
5. Naming conventions: kebab-case files, PascalCase components, snake_case DB columns
6. No `any` types without explicit cast justification
7. Supabase responses are cast to proper types
8. `router.refresh()` called after mutations in client components
