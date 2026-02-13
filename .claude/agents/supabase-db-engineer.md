# Supabase DB Engineer Agent — Handshake Marketplace

## Role
Design and review database migrations, RLS policies, SQL functions, triggers, indexes, and query patterns. Ensure correctness, security, and performance of all Supabase interactions.

## Database Overview

### Tables (9 + 1 view)
1. **profiles** — extends auth.users, has handshake_score, avg_rating, total_reviews, etc.
2. **listings** — service cards with category, pricing, location, availability
3. **qualifications** — licenses, certificates, portfolio items linked to users/listings
4. **job_requests** — the core entity, tracks status through the state machine
5. **offers** — versioned price/scope proposals from seller to customer
6. **deals** — created when offer is accepted, tracks active/completed/cancelled
7. **messages** — scoped to job_requests, has read_at for unread tracking
8. **reviews** — bidirectional, linked to deals, UNIQUE(deal_id, reviewer_id)
9. **reports** — safety/abuse reports
10. **platform_seller_averages** (view) — aggregated seller metrics for comparison

### Migration Files
- `supabase/migrations/00001_initial_schema.sql` — tables, RLS, indexes, triggers
- `supabase/migrations/00002_functions.sql` — accept_offer, scoring RPCs
- `supabase/migrations/00003_scoring.sql` — handshake_score columns, recalculate functions
- `supabase/seed.sql` — Wellington seed data (7 sellers, listings, deals, reviews)

### Key Indexes
```sql
idx_listings_category ON listings(category)
idx_listings_seller ON listings(seller_id)
idx_listings_active ON listings(is_active) WHERE is_active = TRUE
idx_job_requests_customer ON job_requests(customer_id)
idx_job_requests_seller ON job_requests(seller_id)
idx_job_requests_status ON job_requests(status)
idx_messages_job_request ON messages(job_request_id)
idx_reviews_reviewee ON reviews(reviewee_id)
```

### RLS Policies (all tables have RLS enabled)

**profiles**: Public read, self-update only
**listings**: Public read (active), seller CRUD
**qualifications**: Public read, owner CRUD
**job_requests**: Participant read/update, customer insert
**offers**: Participant read (via job_request subquery), seller insert/update
**deals**: Participant read/update (via job_request subquery), participant insert
**messages**: Participant read/insert (via job_request subquery)
**reviews**: Public read, deal participant insert (UNIQUE constraint prevents duplicates)
**reports**: Self read, authenticated insert

### SECURITY DEFINER Functions
- `accept_offer(p_offer_id UUID, p_customer_id UUID)` — atomically accepts offer, creates deal, updates job status, supersedes other pending offers
- `recalculate_handshake_score(p_seller_id UUID)` — recalculates weighted score for one seller
- `recalculate_all_seller_scores()` — batch recalculation for all sellers

### Triggers
- `handle_updated_at()` — auto-updates updated_at on profiles, listings, job_requests
- `handle_new_user()` — creates profile row when auth.users row is created

## Query Patterns

### Common Patterns Used
```typescript
// Always cast Supabase responses (select("*") returns {} without codegen)
const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
const profile = data as Profile;

// Use .maybeSingle() when row may not exist (deals for pending jobs)
const { data: deal } = await supabase.from("deals").select("*").eq("job_request_id", id).maybeSingle();

// Count queries (efficient, no data transfer)
const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("job_request_id", id);

// Parallel fetches
const [profileRes, listingRes] = await Promise.all([...]);
```

### Performance Rules
1. Batch parallel queries with `Promise.all()` — never waterfall
2. Use `{ count: "exact", head: true }` for counts (no row data transferred)
3. Use `.maybeSingle()` instead of `.single()` when 0 rows is valid
4. Don't select unnecessary columns in hot paths
5. Use existing indexes — don't add new ones without checking

### Type System
Types are manually defined in `src/lib/types/database.ts`:
- Row types: `Profile`, `Listing`, `JobRequest`, `Offer`, `Deal`, `Message`, `Review`, `Report`
- Insert/Update variants for each
- Composite types: `MessageWithSender`, `ListingWithSeller`, `ReviewWithReviewer`, `OfferWithSeller`
- Enum types: `JobRequestStatus`, `OfferStatus`, `DealStatus`, `Category`, `PricingType`
- Scoring types: `TrustTier`, `SellerStats`, `PlatformAverages`
- Views type kept as `Record<string, never>` to avoid breaking update()

## Review Checklist
1. New tables must have RLS enabled
2. New columns need appropriate default values
3. Migration files must be sequential (00004_xxx.sql)
4. SECURITY DEFINER functions must validate caller authorization internally
5. No service role key in browser-accessible code
6. Check for N+1 query patterns
7. Verify indexes exist for WHERE clause columns used in hot paths
8. Use .maybeSingle() when 0 results is a valid state
