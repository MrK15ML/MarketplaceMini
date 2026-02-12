-- ============================================
-- Migration 00003: Seller Scoring System
-- Adds Handshake Score infrastructure
-- ============================================

-- 1. Add scoring columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS handshake_score NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_completed_deals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_response_hours NUMERIC(7,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS completion_rate NUMERIC(5,2) DEFAULT NULL;

-- 2. Indexes for efficient sorting and lookups
CREATE INDEX IF NOT EXISTS idx_profiles_handshake_score
  ON profiles(handshake_score DESC) WHERE is_seller = TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_avg_rating
  ON profiles(avg_rating DESC) WHERE is_seller = TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_total_reviews
  ON profiles(total_reviews DESC) WHERE is_seller = TRUE;

CREATE INDEX IF NOT EXISTS idx_deals_seller_status
  ON deals(seller_id, status);

CREATE INDEX IF NOT EXISTS idx_messages_first_response
  ON messages(job_request_id, sender_id, created_at);

-- 3. Core scoring function
CREATE OR REPLACE FUNCTION public.recalculate_handshake_score(p_seller_id UUID)
RETURNS VOID AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_total_reviews INTEGER;
  v_is_verified BOOLEAN;
  v_account_age_days INTEGER;
  v_total_deals INTEGER;
  v_completed_deals INTEGER;
  v_completion_rate NUMERIC;
  v_avg_response_hours NUMERIC;
  v_recent_review_count INTEGER;
  v_score NUMERIC;
  -- Component scores
  v_rating_score NUMERIC := 0;
  v_review_score NUMERIC := 0;
  v_completion_score NUMERIC := 0;
  v_response_score NUMERIC := 0;
  v_tenure_score NUMERIC := 0;
  v_verified_score NUMERIC := 0;
  v_recency_multiplier NUMERIC := 1;
  -- Weights
  w_rating CONSTANT NUMERIC := 35;
  w_reviews CONSTANT NUMERIC := 15;
  w_completion CONSTANT NUMERIC := 20;
  w_response CONSTANT NUMERIC := 15;
  w_tenure CONSTANT NUMERIC := 10;
  w_verified CONSTANT NUMERIC := 5;
BEGIN
  -- 1. Get current profile data
  SELECT avg_rating, total_reviews, is_verified,
         EXTRACT(DAY FROM (NOW() - created_at))::INTEGER
  INTO v_avg_rating, v_total_reviews, v_is_verified, v_account_age_days
  FROM public.profiles
  WHERE id = p_seller_id;

  IF NOT FOUND THEN RETURN; END IF;

  -- 2. Calculate deal stats
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('completed', 'cancelled'))
  INTO v_total_deals, v_completed_deals
  FROM public.deals
  WHERE seller_id = p_seller_id;

  -- Only count completed (not cancelled) for completed_deals
  SELECT COUNT(*) INTO v_completed_deals
  FROM public.deals
  WHERE seller_id = p_seller_id AND status = 'completed';

  -- Completion rate
  IF v_total_deals > 0 THEN
    v_completion_rate := (v_completed_deals::NUMERIC / v_total_deals) * 100;
  ELSE
    v_completion_rate := NULL;
  END IF;

  -- 3. Calculate average response time (hours to first seller message per job request)
  SELECT AVG(response_hours) INTO v_avg_response_hours
  FROM (
    SELECT EXTRACT(EPOCH FROM (first_msg.first_response - jr.created_at)) / 3600.0 AS response_hours
    FROM public.job_requests jr
    INNER JOIN LATERAL (
      SELECT MIN(m.created_at) AS first_response
      FROM public.messages m
      WHERE m.job_request_id = jr.id
        AND m.sender_id = p_seller_id
        AND m.message_type = 'text'
    ) first_msg ON first_msg.first_response IS NOT NULL
    WHERE jr.seller_id = p_seller_id
      AND jr.status NOT IN ('pending', 'declined')
  ) subq
  WHERE response_hours > 0;

  -- 4. Count recent reviews (last 90 days)
  SELECT COUNT(*) INTO v_recent_review_count
  FROM public.reviews
  WHERE reviewee_id = p_seller_id
    AND created_at > NOW() - INTERVAL '90 days';

  -- 5. Compute score components

  -- Rating: (avg_rating / 5) * weight, scaled by confidence (min 3 reviews)
  IF v_total_reviews > 0 THEN
    v_rating_score := (COALESCE(v_avg_rating, 0) / 5.0) * w_rating
                      * LEAST(v_total_reviews::NUMERIC / 3.0, 1.0);
  END IF;

  -- Reviews volume: logarithmic scale, caps at ~50 reviews
  IF v_total_reviews > 0 THEN
    v_review_score := (LN(1 + LEAST(v_total_reviews, 100)) / LN(51)) * w_reviews;
  END IF;

  -- Completion rate: direct percentage mapping
  IF v_completion_rate IS NOT NULL AND v_total_deals >= 2 THEN
    v_completion_score := (v_completion_rate / 100.0) * w_completion;
  ELSIF v_total_deals = 1 AND v_completed_deals = 1 THEN
    v_completion_score := w_completion * 0.7;
  END IF;

  -- Response time: inverse scale, <1hr = perfect, >48hr = 0
  IF v_avg_response_hours IS NOT NULL THEN
    IF v_avg_response_hours <= 1 THEN
      v_response_score := w_response;
    ELSIF v_avg_response_hours >= 48 THEN
      v_response_score := 0;
    ELSE
      v_response_score := (1 - (v_avg_response_hours - 1) / 47.0) * w_response;
    END IF;
  END IF;

  -- Tenure: caps at 365 days
  v_tenure_score := (LEAST(COALESCE(v_account_age_days, 0), 365)::NUMERIC / 365.0) * w_tenure;

  -- Verified bonus
  IF v_is_verified THEN
    v_verified_score := w_verified;
  END IF;

  -- Recency multiplier: boost for recent activity
  IF v_recent_review_count >= 3 THEN
    v_recency_multiplier := 1.10;
  ELSIF v_recent_review_count >= 1 THEN
    v_recency_multiplier := 1.05;
  END IF;

  -- 6. Final score (clamped 0-100)
  v_score := (v_rating_score + v_review_score + v_completion_score +
              v_response_score + v_tenure_score + v_verified_score)
             * v_recency_multiplier;

  v_score := GREATEST(0, LEAST(100, v_score));

  -- 7. Update profile
  UPDATE public.profiles
  SET
    handshake_score = ROUND(v_score, 2),
    total_completed_deals = v_completed_deals,
    avg_response_hours = CASE
      WHEN v_avg_response_hours IS NOT NULL THEN ROUND(v_avg_response_hours, 2)
      ELSE NULL
    END,
    completion_rate = CASE
      WHEN v_completion_rate IS NOT NULL THEN ROUND(v_completion_rate, 2)
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = p_seller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger: recalculate after review insert
CREATE OR REPLACE FUNCTION public.trigger_recalculate_on_review()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalculate_handshake_score(NEW.reviewee_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS after_review_insert_recalculate ON public.reviews;
CREATE TRIGGER after_review_insert_recalculate
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_on_review();

-- 5. Trigger: recalculate after deal status changes to completed/cancelled
CREATE OR REPLACE FUNCTION public.trigger_recalculate_on_deal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'cancelled') AND OLD.status != NEW.status THEN
    PERFORM public.recalculate_handshake_score(NEW.seller_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS after_deal_update_recalculate ON public.deals;
CREATE TRIGGER after_deal_update_recalculate
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_on_deal();

-- 6. Trigger: recalculate on first seller message (for response time)
CREATE OR REPLACE FUNCTION public.trigger_recalculate_on_first_message()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_id UUID;
  v_msg_count INTEGER;
BEGIN
  IF NEW.message_type != 'text' THEN RETURN NEW; END IF;

  SELECT seller_id INTO v_seller_id
  FROM public.job_requests
  WHERE id = NEW.job_request_id;

  IF NEW.sender_id != v_seller_id THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_msg_count
  FROM public.messages
  WHERE job_request_id = NEW.job_request_id
    AND sender_id = v_seller_id
    AND message_type = 'text'
    AND id != NEW.id;

  IF v_msg_count = 0 THEN
    PERFORM public.recalculate_handshake_score(v_seller_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS after_message_insert_recalculate ON public.messages;
CREATE TRIGGER after_message_insert_recalculate
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_on_first_message();

-- 7. Batch recalculation for initial population
CREATE OR REPLACE FUNCTION public.recalculate_all_seller_scores()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_seller RECORD;
BEGIN
  FOR v_seller IN SELECT id FROM public.profiles WHERE is_seller = TRUE LOOP
    PERFORM public.recalculate_handshake_score(v_seller.id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Platform averages view for dashboard comparison
CREATE OR REPLACE VIEW public.platform_seller_averages AS
SELECT
  ROUND(AVG(handshake_score), 2) AS avg_score,
  ROUND(AVG(avg_rating), 2) AS avg_rating,
  ROUND(AVG(completion_rate), 2) AS avg_completion_rate,
  ROUND(AVG(avg_response_hours), 2) AS avg_response_hours,
  ROUND(AVG(total_completed_deals)::NUMERIC, 1) AS avg_completed_deals,
  COUNT(*) AS total_sellers
FROM public.profiles
WHERE is_seller = TRUE
  AND handshake_score > 0;
