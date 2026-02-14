-- Migration 00007: Security fixes
-- Fixes: messages UPDATE RLS, activity_feed INSERT restriction, atomic view count

-- ============================================
-- 1. Messages: Allow participants to mark messages as read
-- ============================================
CREATE POLICY "Participants can update read_at on received messages"
  ON public.messages FOR UPDATE
  USING (
    -- Must be a participant in the job request
    EXISTS (
      SELECT 1 FROM public.job_requests jr
      WHERE jr.id = messages.job_request_id
      AND (jr.customer_id = auth.uid() OR jr.seller_id = auth.uid())
    )
  )
  WITH CHECK (
    -- Can only update messages you received (not your own)
    sender_id != auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.job_requests jr
      WHERE jr.id = messages.job_request_id
      AND (jr.customer_id = auth.uid() OR jr.seller_id = auth.uid())
    )
  );

-- ============================================
-- 2. Activity feed: Restrict INSERT to own activity only
-- ============================================
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert activity" ON public.activity_feed;

-- Replace with user-scoped insert
CREATE POLICY "Users can insert own activity"
  ON public.activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. Atomic view count increment (replaces read-modify-write)
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_listing_view_count(p_listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings
  SET view_count = view_count + 1
  WHERE id = p_listing_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon and authenticated (public listings can be viewed by anyone)
GRANT EXECUTE ON FUNCTION public.increment_listing_view_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_listing_view_count(UUID) TO authenticated;
