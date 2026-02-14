-- Migration: Add activity feed, view/request counts for marketplace maturity

-- Listing engagement counters
ALTER TABLE public.listings
  ADD COLUMN view_count INTEGER DEFAULT 0,
  ADD COLUMN request_count INTEGER DEFAULT 0;

-- Activity feed table
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'new_listing', 'deal_completed', 'review_received', 'score_milestone'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.activity_feed
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert activity" ON public.activity_feed
  FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX idx_listings_view_count ON listings(view_count DESC) WHERE is_active = TRUE;
CREATE INDEX idx_listings_request_count ON listings(request_count DESC) WHERE is_active = TRUE;
