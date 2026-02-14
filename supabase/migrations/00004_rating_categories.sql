-- Migration: Add multi-dimensional rating categories
-- Adds Communication, Quality, and Reliability ratings to reviews
-- and corresponding averages to profiles

-- Add rating category columns to reviews table
ALTER TABLE public.reviews
  ADD COLUMN rating_communication INTEGER CHECK (rating_communication >= 1 AND rating_communication <= 5),
  ADD COLUMN rating_quality INTEGER CHECK (rating_quality >= 1 AND rating_quality <= 5),
  ADD COLUMN rating_reliability INTEGER CHECK (rating_reliability >= 1 AND rating_reliability <= 5);

-- Add category averages to profiles
ALTER TABLE public.profiles
  ADD COLUMN avg_communication NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN avg_quality NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN avg_reliability NUMERIC(3,2) DEFAULT 0;

-- Update the rating recalculation function to include categories
CREATE OR REPLACE FUNCTION public.update_profile_rating(p_reviewee_id UUID)
RETURNS VOID AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_avg_comm NUMERIC;
  v_avg_qual NUMERIC;
  v_avg_rel NUMERIC;
  v_count INTEGER;
BEGIN
  SELECT
    AVG(rating),
    AVG(rating_communication),
    AVG(rating_quality),
    AVG(rating_reliability),
    COUNT(*)
  INTO v_avg_rating, v_avg_comm, v_avg_qual, v_avg_rel, v_count
  FROM public.reviews
  WHERE reviewee_id = p_reviewee_id;

  UPDATE public.profiles
  SET
    avg_rating = COALESCE(ROUND(v_avg_rating, 2), 0),
    avg_communication = COALESCE(ROUND(v_avg_comm, 2), 0),
    avg_quality = COALESCE(ROUND(v_avg_qual, 2), 0),
    avg_reliability = COALESCE(ROUND(v_avg_rel, 2), 0),
    total_reviews = COALESCE(v_count, 0)
  WHERE id = p_reviewee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for rating category queries
CREATE INDEX idx_reviews_category_ratings ON reviews(reviewee_id, rating_communication, rating_quality, rating_reliability);
