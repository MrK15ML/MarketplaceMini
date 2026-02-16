-- Migration 00008: Profit-driving features
-- 1. Notifications system
-- 2. Saved sellers / favorites
-- 3. Instant book support on listings

-- ============================================
-- 1. NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  -- Types: 'new_request', 'new_offer', 'offer_accepted', 'offer_declined',
  --        'new_message', 'review_received', 'job_completed', 'job_cancelled'
  title TEXT NOT NULL,
  body TEXT,
  href TEXT,                        -- Deep link to relevant page
  metadata JSONB,                   -- Extra context (job_id, offer_id, etc.)
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System/server can insert notifications for any user
CREATE POLICY "Authenticated users can create notifications for others"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- 2. SAVED SELLERS (FAVORITES)
-- ============================================

CREATE TABLE public.saved_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, seller_id)
);

CREATE INDEX idx_saved_sellers_user ON saved_sellers(user_id, created_at DESC);

-- RLS
ALTER TABLE public.saved_sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved sellers"
  ON public.saved_sellers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save sellers"
  ON public.saved_sellers FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() != seller_id);

CREATE POLICY "Users can unsave sellers"
  ON public.saved_sellers FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. INSTANT BOOK on LISTINGS
-- ============================================

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS instant_book BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS instant_book_price NUMERIC;

-- ============================================
-- 4. INSTANT BOOK ATOMIC FUNCTION
-- Creates job_request + offer + deal in one transaction
-- ============================================

CREATE OR REPLACE FUNCTION public.instant_book(
  p_listing_id UUID,
  p_customer_id UUID,
  p_description TEXT DEFAULT 'Instant booking'
)
RETURNS UUID AS $$
DECLARE
  v_listing RECORD;
  v_job_request_id UUID;
  v_offer_id UUID;
  v_deal_id UUID;
BEGIN
  -- Get listing (must be active + instant book enabled)
  SELECT id, seller_id, category, instant_book_price, title
  INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id
    AND is_active = true
    AND instant_book = true
    AND instant_book_price IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not available for instant booking';
  END IF;

  -- Cannot book own listing
  IF v_listing.seller_id = p_customer_id THEN
    RAISE EXCEPTION 'Cannot book your own listing';
  END IF;

  -- Create job request
  INSERT INTO public.job_requests (listing_id, customer_id, seller_id, status, description, category)
  VALUES (p_listing_id, p_customer_id, v_listing.seller_id, 'accepted', p_description, v_listing.category)
  RETURNING id INTO v_job_request_id;

  -- Create offer (auto-accepted)
  INSERT INTO public.offers (job_request_id, version, seller_id, price, pricing_type, scope_description, status)
  VALUES (v_job_request_id, 1, v_listing.seller_id, v_listing.instant_book_price, 'fixed', 'Instant booking for: ' || v_listing.title, 'accepted')
  RETURNING id INTO v_offer_id;

  -- Create deal
  INSERT INTO public.deals (job_request_id, offer_id, customer_id, seller_id, agreed_price, agreed_scope)
  VALUES (v_job_request_id, v_offer_id, p_customer_id, v_listing.seller_id, v_listing.instant_book_price, 'Instant booking for: ' || v_listing.title)
  RETURNING id INTO v_deal_id;

  -- System message
  INSERT INTO public.messages (job_request_id, sender_id, content, message_type)
  VALUES (v_job_request_id, p_customer_id, 'Instant booking confirmed! Deal created automatically.', 'system');

  -- Increment request count
  UPDATE public.listings SET request_count = request_count + 1 WHERE id = p_listing_id;

  RETURN v_deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
