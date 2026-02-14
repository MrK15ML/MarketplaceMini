-- Migration: Add cover images and tags to listings

-- Add cover image and gallery support
ALTER TABLE public.listings
  ADD COLUMN cover_image_url TEXT,
  ADD COLUMN images JSONB DEFAULT '[]'::JSONB;

-- Add tags for visual indicators (urgent, popular, new, featured)
ALTER TABLE public.listings
  ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Note: Supabase Storage bucket 'listing-images' must be created
-- via the Supabase dashboard as a PUBLIC bucket.
-- Storage policies:
--   INSERT: auth.uid() IS NOT NULL (authenticated users can upload)
--   SELECT: true (public read for listing images)
--   DELETE: auth.uid() = owner (users can delete their own uploads)
