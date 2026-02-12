-- ============================================
-- Month 2: Atomic database functions
-- ============================================

-- Function to atomically update profile rating after a review
CREATE OR REPLACE FUNCTION public.update_profile_rating(p_reviewee_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    avg_rating = COALESCE((
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM public.reviews
      WHERE reviewee_id = p_reviewee_id
    ), 0),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE reviewee_id = p_reviewee_id
    ),
    updated_at = NOW()
  WHERE id = p_reviewee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for atomic offer acceptance (offer update + deal create + job status)
CREATE OR REPLACE FUNCTION public.accept_offer(
  p_offer_id UUID,
  p_customer_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_offer RECORD;
  v_job RECORD;
  v_deal_id UUID;
BEGIN
  -- Fetch and lock the offer
  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
  IF v_offer.status != 'pending' THEN
    RAISE EXCEPTION 'Offer is not pending';
  END IF;

  -- Fetch and lock the job request
  SELECT * INTO v_job FROM public.job_requests WHERE id = v_offer.job_request_id FOR UPDATE;
  IF v_job.customer_id != p_customer_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Update offer status
  UPDATE public.offers SET status = 'accepted' WHERE id = p_offer_id;

  -- Supersede any other pending offers
  UPDATE public.offers
  SET status = 'superseded'
  WHERE job_request_id = v_offer.job_request_id
    AND id != p_offer_id
    AND status = 'pending';

  -- Create deal
  v_deal_id := gen_random_uuid();
  INSERT INTO public.deals (id, job_request_id, offer_id, customer_id, seller_id, agreed_price, agreed_scope)
  VALUES (
    v_deal_id,
    v_job.id,
    p_offer_id,
    v_job.customer_id,
    v_job.seller_id,
    v_offer.price,
    v_offer.scope_description
  );

  -- Update job request status
  UPDATE public.job_requests SET status = 'accepted', updated_at = NOW() WHERE id = v_job.id;

  RETURN v_deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
