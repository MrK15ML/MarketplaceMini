# CLAUDE.md — Handshake Marketplace

## Project Overview

**Handshake** is a unified service marketplace platform where providers can list their services (with qualifications and evidence of capability), and customers can browse, ask questions, negotiate, and ultimately accept or decline services through a structured handshake protocol.

The platform supports:
- **Local odd jobs** — moving, cleaning, lawns, errands
- **Skilled trades** — licensed categories flagged and verified
- **Remote services** — CV review, coding help, design work
- **Tutoring & mentoring** — structured learning sessions
- **Video consultations** — real-time advisory sessions

### Core Protocol
Every job follows: **Request → Clarify → Offer → Accept → Complete → Review**

Chat exists for clarification, but **agreements are structured objects, not messages**. The platform is a facilitator — not an employer or guarantor.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | **Next.js 14+** (App Router) | TypeScript, React Server Components |
| Styling | **Tailwind CSS** + **shadcn/ui** | Consistent, accessible component library |
| Backend/DB | **Supabase** | PostgreSQL, Auth, Realtime, Storage, Edge Functions |
| Messaging | **Supabase Realtime** (MVP) → **Stream** (scale) | In-app only, no external contact sharing |
| Video | **Daily.co** | For consultations and tutoring mode |
| Auth | **Supabase Auth** (MVP) → **Clerk** (scale) | Email/password + OAuth providers |
| Hosting | **Vercel** | Automatic deployments from main branch |
| Analytics | **PostHog** | Product analytics, feature flags, session replay |
| Payments | **Stripe** (Month 4+) | Not in MVP — defer until traction proven |
| File Storage | **Supabase Storage** | Qualification documents, profile images, attachments |

---

## Project Structure

```
handshake/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth pages (login, signup, onboarding)
│   │   ├── (platform)/           # Authenticated platform pages
│   │   │   ├── dashboard/        # User dashboard (buyer/seller views)
│   │   │   ├── listings/         # Browse & search listings
│   │   │   ├── listing/[id]/     # Individual listing page
│   │   │   ├── jobs/             # Job requests & active deals
│   │   │   ├── messages/         # Messaging interface
│   │   │   ├── profile/[id]/     # Public profile pages
│   │   │   └── settings/         # Account settings
│   │   ├── api/                  # API routes (Edge Functions)
│   │   ├── layout.tsx
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── ui/                   # shadcn/ui base components
│   │   ├── listings/             # Listing cards, forms, filters
│   │   ├── jobs/                 # Job request flow, offer objects, deal summaries
│   │   ├── messaging/            # Chat interface, quick actions
│   │   ├── profiles/             # Profile display, qualification badges
│   │   └── shared/               # Layout, navigation, common elements
│   ├── lib/
│   │   ├── supabase/             # Supabase client, server, middleware helpers
│   │   ├── hooks/                # Custom React hooks
│   │   ├── utils/                # Utility functions
│   │   ├── types/                # TypeScript type definitions
│   │   ├── validations/          # Zod schemas for forms & API
│   │   └── constants/            # App constants, enums, config
│   ├── stores/                   # Zustand stores (if needed)
│   └── styles/                   # Global styles, Tailwind config
├── supabase/
│   ├── migrations/               # SQL migration files (sequential)
│   ├── seed.sql                  # Development seed data
│   └── functions/                # Supabase Edge Functions
├── public/                       # Static assets
├── tests/                        # Test files mirroring src structure
├── .env.local                    # Local environment variables (NEVER commit)
├── .env.example                  # Template for env vars
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Database Schema

### Core Tables

```sql
-- Users extend Supabase auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location_city TEXT,            -- e.g., "Wellington"
  location_lat NUMERIC,
  location_lng NUMERIC,
  is_seller BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service listings
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,          -- enum: 'odd_jobs', 'trades', 'remote', 'tutoring', 'consultation'
  subcategory TEXT,
  pricing_type TEXT NOT NULL,      -- enum: 'fixed', 'range', 'hourly'
  price_min NUMERIC,
  price_max NUMERIC,
  price_fixed NUMERIC,
  currency TEXT DEFAULT 'NZD',
  is_remote BOOLEAN DEFAULT FALSE,
  location_radius_km INTEGER,      -- NULL if remote-only
  availability JSONB,              -- structured availability windows
  requires_license BOOLEAN DEFAULT FALSE,
  license_type TEXT,               -- e.g., 'electrical', 'plumbing'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Qualification evidence attached to listings or profiles
CREATE TABLE public.qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,  -- NULL = profile-level
  type TEXT NOT NULL,              -- 'license', 'certificate', 'portfolio', 'testimonial'
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT,               -- Supabase Storage path
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job requests (the "SYN" packet)
CREATE TABLE public.job_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status enum: 'pending', 'clarifying', 'offered', 'accepted',
  --              'in_progress', 'completed', 'reviewed', 'cancelled', 'declined'
  description TEXT NOT NULL,
  budget_min NUMERIC,
  budget_max NUMERIC,
  preferred_time TIMESTAMPTZ,
  location TEXT,                   -- NULL if remote
  attachments JSONB,               -- array of storage URLs
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers (versioned — sellers can revise)
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id UUID NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  price NUMERIC NOT NULL,
  pricing_type TEXT NOT NULL,      -- 'fixed', 'hourly'
  estimated_duration TEXT,         -- human-readable, e.g., "2-3 hours"
  scope_description TEXT NOT NULL,
  valid_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'accepted', 'declined', 'expired', 'superseded'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_request_id, version)
);

-- Deals (accepted offers become deals)
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id UUID NOT NULL REFERENCES job_requests(id),
  offer_id UUID NOT NULL REFERENCES offers(id),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'completed', 'disputed', 'cancelled'
  agreed_price NUMERIC NOT NULL,
  agreed_scope TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (in-app only)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id UUID NOT NULL REFERENCES job_requests(id),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',  -- 'text', 'offer_notification', 'status_change', 'system'
  metadata JSONB,                    -- quick action data, offer references, etc.
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deal_id, reviewer_id)
);

-- Reports (safety/abuse)
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reported_user_id UUID REFERENCES profiles(id),
  reported_listing_id UUID REFERENCES listings(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',      -- 'open', 'investigating', 'resolved', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification records
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,              -- 'identity', 'email', 'phone', 'license'
  status TEXT DEFAULT 'pending',   -- 'pending', 'verified', 'rejected'
  provider TEXT,                   -- e.g., 'stripe_identity', 'manual'
  metadata JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)
All tables MUST have RLS enabled. Key policies:
- Users can read their own profile and public profiles
- Sellers can CRUD their own listings
- Job requests visible only to involved customer and seller
- Messages visible only to job request participants
- Reviews are publicly readable, writable only by deal participants

### Indexes
```sql
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_active ON listings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_listings_location ON listings(location_lat, location_lng) WHERE NOT is_remote;
CREATE INDEX idx_job_requests_customer ON job_requests(customer_id);
CREATE INDEX idx_job_requests_seller ON job_requests(seller_id);
CREATE INDEX idx_job_requests_status ON job_requests(status);
CREATE INDEX idx_messages_job_request ON messages(job_request_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
```

---

## Job State Machine

```
                    ┌──────────┐
                    │  LISTED  │  (Listing exists, waiting for requests)
                    └────┬─────┘
                         │ Customer submits job request
                    ┌────▼─────┐
              ┌─────│ REQUEST  │─────┐
              │     └────┬─────┘     │
              │          │           │ Seller declines
         Customer    Chat/Q&A       │
         cancels         │     ┌────▼─────┐
              │     ┌────▼─────┐ │ DECLINED │
              │     │ CLARIFY  │ └──────────┘
              │     └────┬─────┘
              │          │ Seller sends offer
              │     ┌────▼─────┐
              ├─────│  OFFER   │◄──── (versioned, can revise)
              │     └────┬─────┘
              │          │ Customer accepts
              │     ┌────▼─────┐
         ┌────▼──┐  │ ACCEPTED │
         │CANCEL │  └────┬─────┘
         └───────┘       │ Work begins
                    ┌────▼───────┐
                    │IN_PROGRESS │
                    └────┬───────┘
                         │ Seller marks complete
                    ┌────▼─────┐
                    │ COMPLETE │
                    └────┬─────┘
                         │ Both parties review
                    ┌────▼─────┐
                    │  REVIEW  │
                    └──────────┘
```

**Rules:**
- Only the **seller** can send offers and mark work as in-progress/complete
- Only the **customer** can accept or decline offers
- Either party can cancel before IN_PROGRESS
- Change requests create new offer versions (previous offers marked 'superseded')
- System messages are generated on every status transition

---

## Key Feature Specifications

### 1. Service Listings
- Sellers create service "cards" with: title, description, category, pricing (fixed/range/hourly), location radius or remote flag, availability windows
- Qualification/evidence uploads: licenses, certificates, portfolio items, testimonials
- Licensed trade categories (electrical, plumbing, gas fitting, etc.) are flagged and require proof upload
- Search & filter: category, location, price range, rating, availability

### 2. Job Request (Structured "SYN")
Customer fills a structured form (not free-text chat):
- Description of what they need
- Preferred time/date and location (or remote)
- Budget range
- File attachments (photos, documents)
- Auto-categorised from the listing

### 3. Handshake Flow
- **Clarify Chat**: In-app messaging between customer and seller, scoped to the job request
- **Offer Object**: Structured data (price, scope, duration, expiry) — NOT a chat message
- **Accept/Decline**: Customer reviews the offer object and makes a decision
- **Deal Summary**: Generated automatically from accepted offer — serves as the agreement record
- **Change Requests**: Either party can request changes, which create a new offer version

### 4. Trust & Safety Layer
- Email verification (required)
- ID verification (Phase 2 — Stripe Identity / Persona)
- Star ratings + text reviews (both parties review each other)
- Report system for fraud, abuse, impersonation
- Licensed categories require proof before listing goes live
- Banned services list (maintained in constants)
- Safety warnings for in-person services

### 5. Messaging
- In-app only — phone numbers and emails are never shared through chat
- Scoped to job requests (not general DMs)
- Quick action buttons: "Send Offer", "Accept", "Decline", "Mark Complete"
- Deal summary tab within the chat view
- Supabase Realtime for live updates

### 6. Video Consultations (Month 3)
- Daily.co integration for tutoring and consultation categories
- Scheduled through the handshake flow
- Timer-based for hourly billing
- Recording consent toggle

---

## Coding Standards & Conventions

### General
- **TypeScript** everywhere — strict mode, no `any` types
- **Zod** for all form validation and API input validation
- **Server Components** by default; use `'use client'` only when needed
- **Server Actions** for mutations where appropriate
- **Edge Functions** for complex backend logic or webhooks
- Prefer **named exports** over default exports (except page.tsx/layout.tsx)
- Use **absolute imports** via `@/` path alias

### Naming Conventions
- Files: `kebab-case.tsx` for components, `camelCase.ts` for utilities
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Database columns: `snake_case`
- Constants/enums: `SCREAMING_SNAKE_CASE`
- Types/interfaces: `PascalCase`, prefix interfaces with `I` only if needed for clarity

### Component Patterns
- Use shadcn/ui components as the base layer — don't reinvent buttons, inputs, dialogs
- Compose complex UI from smaller components
- Keep components focused — if it's doing too much, split it
- Colocate component-specific types and utilities

### Data Fetching
- Server Components fetch data directly via Supabase server client
- Client Components use React Query (TanStack Query) for caching and optimistic updates
- Realtime subscriptions use Supabase Realtime channels

### Error Handling
- All Supabase queries must handle errors explicitly
- User-facing errors should be friendly and actionable
- Log detailed errors server-side, show generic messages client-side
- Use error boundaries for unexpected failures

### Authentication
- Supabase Auth middleware protects all `(platform)` routes
- Server-side auth checks on every data fetch
- RLS as the last line of defense — never rely solely on client-side checks

---

## Environment Variables

```env
# .env.local (NEVER commit this file)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Daily.co (Month 3+)
NEXT_PUBLIC_DAILY_API_KEY=your_daily_key

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key

# Stripe (Month 4+)
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pub_key
```

---

## Development Workflow

1. **Branching**: `main` (production) → `develop` (staging) → `feature/xyz` (work)
2. **Commits**: Conventional commits — `feat:`, `fix:`, `chore:`, `docs:`
3. **Database changes**: Always create a migration file in `supabase/migrations/`
4. **Testing**: Write tests for critical paths (handshake flow, offer logic, RLS policies)
5. **PR reviews**: Self-review checklist — types, RLS, error handling, mobile responsiveness

---

## MVP Scope (Months 1–2)

### Month 1 — Foundation
- [ ] Landing page with waitlist / early access signup
- [ ] Auth flow (signup, login, onboarding — buyer vs seller)
- [ ] Seller profile creation + qualification uploads
- [ ] Listing creation (all categories)
- [ ] Listing browse/search with filters
- [ ] Job request submission

### Month 2 — Handshake Flow
- [ ] Clarification chat (scoped to job requests)
- [ ] Offer creation & versioning
- [ ] Accept/decline flow
- [ ] Deal summary generation
- [ ] Review system (star + text, bidirectional)
- [ ] Basic reporting/flagging

### NOT in MVP
- ❌ In-app payments (Month 4)
- ❌ Video calls (Month 3)
- ❌ Mobile apps (Month 6)
- ❌ Arbitration system
- ❌ Advanced matching / recommendation algorithms
- ❌ Background checks
- ❌ Insurance partnerships (Month 12)

---

## Legal Positioning

The platform is positioned as:

> "A communication and discovery platform that enables independent parties to form their own service agreements."

**Platform handles:** fraud, abuse, impersonation, platform bugs
**Platform does NOT handle:** quality disputes, workmanship claims, personal injury

Terms of Service must make clear that users are independent parties, and the platform is not a party to any service agreement formed through it.

---

## Market Context

- **Target launch city**: Wellington, New Zealand → then Auckland -> The World
- **Currency**: NZD
- **Initial supply**: Uni students, tutors, handymen, cleaners, tech helpers
- **Initial demand**: Students, young professionals, parents, elderly needing small jobs
- **Monetisation**: Free at launch → success fee or seller subscription once traction proven

---

## Important Reminders for AI Assistants

1. **Always use TypeScript** — no JavaScript files
2. **Always apply RLS** to new tables — check policies exist before moving on
3. **Offers are objects, not messages** — this is a core architectural principle
4. **Never expose user contact info** in chat or API responses
5. **Validate all inputs** with Zod on both client and server
6. **Mobile-first responsive design** — even though mobile app comes later, web must work on phones
7. **Keep the state machine honest** — status transitions must be validated server-side
8. **Supabase Realtime** for messaging — don't poll
9. **PostHog events** for key actions: listing created, request sent, offer made, deal accepted, review left
10. **Seed data** should reflect realistic Wellington services for development