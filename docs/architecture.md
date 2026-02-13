# Handshake Marketplace — Architecture

## System Overview

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Browser    │────▶│  Next.js 16  │────▶│    Supabase      │
│  (React)     │◀────│  App Router  │◀────│  (PostgreSQL)    │
└─────────────┘     └──────────────┘     └──────────────────┘
       │                    │                      │
       │                    │                      ├── Auth
       │                    │                      ├── Realtime (WebSocket)
       │                    │                      ├── Storage (files)
       │                    │                      └── Edge Functions
       │                    │
       │                    ├── Server Components (data fetching)
       │                    ├── Server Actions (mutations)
       │                    └── Middleware (auth protection)
       │
       ├── Client Components (interactivity)
       ├── Realtime Hooks (live updates)
       └── Presence Channels (typing indicators)
```

## Data Flow

### Read Path (Server Components)
```
Browser Request
  → Next.js Middleware (auth check, cookie refresh)
  → Server Component (page.tsx)
  → createClient() from @supabase/ssr (server-side, with cookies)
  → Supabase PostgreSQL (RLS enforced via auth.uid())
  → React Server Component renders HTML
  → Streamed to browser
```

### Write Path (Server Actions)
```
Client Component triggers action
  → Server Action in actions.ts
  → createClient() (server-side)
  → auth.getUser() validation
  → Business logic validation (state machine, roles)
  → Supabase INSERT/UPDATE (RLS enforced)
  → revalidatePath() to refresh server components
  → Client calls router.refresh()
```

### Realtime Path (Client Hooks)
```
Client Component mounts
  → createClient() from @supabase/ssr (browser-side)
  → supabase.channel().on("postgres_changes", ...).subscribe()
  → PostgreSQL INSERT/UPDATE triggers
  → Supabase Realtime broadcasts to subscribed clients
  → Hook state updates → React re-render
```

## Core Protocol: The Handshake

```
Customer                    Platform                     Seller
   │                           │                           │
   │── Request Service ───────▶│                           │
   │                           │── Notify Incoming ───────▶│
   │                           │                           │
   │◀── Chat (clarify) ──────▶│◀── Chat (clarify) ──────▶│
   │                           │                           │
   │                           │◀── Send Offer (v1) ──────│
   │◀── Offer Notification ───│                           │
   │                           │                           │
   │── Accept Offer ──────────▶│                           │
   │                           │── Deal Created ──────────▶│
   │                           │                           │
   │                           │◀── Start Work ───────────│
   │                           │◀── Mark Complete ────────│
   │                           │                           │
   │── Leave Review ──────────▶│                           │
   │                           │◀── Leave Review ─────────│
   │                           │                           │
   └───────── DONE ────────────┴───────── DONE ───────────┘
```

## State Machine

### Job Request Status Transitions
```
pending ──────▶ clarifying ──────▶ offered ──────▶ accepted
   │                │                  │              │
   │                │                  │              ▼
   │                │                  │         in_progress
   │                │                  │              │
   │                │                  │              ▼
   │                │                  │          completed
   │                │                  │              │
   │                │                  │              ▼
   │                │                  │           reviewed
   │                │                  │
   ├── cancelled ◀─┼── cancelled ◀───┤
   └── declined  ◀─┘                  └── declined
```

### Role Permissions per Transition
| From → To | Who Can Do It |
|-----------|---------------|
| pending → clarifying | Either (auto on first message) |
| pending/clarifying → offered | Seller (via Send Offer) |
| offered → accepted | Customer |
| offered → declined | Customer |
| accepted → in_progress | Seller |
| in_progress → completed | Seller |
| completed → reviewed | System (when both review) |
| any pre-work → cancelled | Either party |

## Security Layers

```
Layer 1: Middleware ──── Redirects unauthenticated users to /login
Layer 2: Server Actions ── Validates auth + role + business rules
Layer 3: RLS Policies ──── PostgreSQL enforces row-level access
Layer 4: SECURITY DEFINER ── Atomic operations that bypass RLS safely
```

## Scoring System

### Handshake Score (0-100)
```
score = (avg_rating / 5) × 40    # 40% weight
      + min(total_reviews / 20, 1) × 15    # 15% weight, caps at 20
      + completion_rate × 20    # 20% weight
      + (1 - min(avg_response_hours / 48, 1)) × 15    # 15% weight
      + min(total_completed_deals / 50, 1) × 10    # 10% weight
```

All multiplied by 100 to get 0-100 range.

### Trust Tiers
| Tier | Score | Min Deals | Badge |
|------|-------|-----------|-------|
| new | < 30 | any | Hidden |
| rising | 30-59 | 2+ | TrendingUp |
| trusted | 60-79 | 5+ | Award |
| top_provider | 80+ | 10+ | Sparkles |

## Realtime Channels

| Channel | Type | Purpose |
|---------|------|---------|
| `messages:{jobRequestId}` | postgres_changes | New message delivery |
| `job_status:{jobRequestId}` | postgres_changes | Status change notifications |
| `typing:{jobRequestId}` | Presence | Typing indicators |
| `unread:{userId}` | postgres_changes | Navbar unread badge updates |

## File Organization Principles

1. **Colocate by feature**: Components for jobs live in `components/jobs/`
2. **Server by default**: Only add `'use client'` when you need hooks, events, or browser APIs
3. **Actions centralized**: All mutations in `src/lib/supabase/actions.ts`
4. **Types centralized**: All DB types in `src/lib/types/database.ts`
5. **Constants centralized**: Status configs, categories in `src/lib/constants/`
6. **Hooks for realtime**: Each realtime subscription gets its own hook in `src/lib/hooks/`
