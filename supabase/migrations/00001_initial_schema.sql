-- ============================================
-- Handshake Marketplace — Initial Schema
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Helper: auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Profiles (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location_city TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  is_seller BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Listings
-- ============================================
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  pricing_type TEXT NOT NULL,
  price_min NUMERIC,
  price_max NUMERIC,
  price_fixed NUMERIC,
  currency TEXT DEFAULT 'NZD',
  is_remote BOOLEAN DEFAULT FALSE,
  location_radius_km INTEGER,
  availability JSONB,
  requires_license BOOLEAN DEFAULT FALSE,
  license_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Qualifications
-- ============================================
CREATE TABLE public.qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Job Requests
-- ============================================
CREATE TABLE public.job_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT NOT NULL,
  budget_min NUMERIC,
  budget_max NUMERIC,
  preferred_time TIMESTAMPTZ,
  location TEXT,
  attachments JSONB,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER job_requests_updated_at
  BEFORE UPDATE ON public.job_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Offers (versioned)
-- ============================================
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id UUID NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  price NUMERIC NOT NULL,
  pricing_type TEXT NOT NULL,
  estimated_duration TEXT,
  scope_description TEXT NOT NULL,
  valid_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_request_id, version)
);

-- ============================================
-- Deals
-- ============================================
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id UUID NOT NULL REFERENCES job_requests(id),
  offer_id UUID NOT NULL REFERENCES offers(id),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'active',
  agreed_price NUMERIC NOT NULL,
  agreed_scope TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Messages
-- ============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id UUID NOT NULL REFERENCES job_requests(id),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  metadata JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Reviews
-- ============================================
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

-- ============================================
-- Reports
-- ============================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reported_user_id UUID REFERENCES profiles(id),
  reported_listing_id UUID REFERENCES listings(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Verifications
-- ============================================
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  provider TEXT,
  metadata JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_active ON listings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_job_requests_customer ON job_requests(customer_id);
CREATE INDEX idx_job_requests_seller ON job_requests(seller_id);
CREATE INDEX idx_job_requests_status ON job_requests(status);
CREATE INDEX idx_messages_job_request ON messages(job_request_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_qualifications_user ON qualifications(user_id);
CREATE INDEX idx_qualifications_listing ON qualifications(listing_id);

-- ============================================
-- Row Level Security
-- ============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings are viewable by everyone"
  ON public.listings FOR SELECT
  USING (is_active = true OR seller_id = auth.uid());

CREATE POLICY "Sellers can insert own listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own listings"
  ON public.listings FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own listings"
  ON public.listings FOR DELETE
  USING (auth.uid() = seller_id);

-- Qualifications
ALTER TABLE public.qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualifications are viewable by everyone"
  ON public.qualifications FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own qualifications"
  ON public.qualifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own qualifications"
  ON public.qualifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own qualifications"
  ON public.qualifications FOR DELETE
  USING (auth.uid() = user_id);

-- Job Requests
ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job requests visible to participants"
  ON public.job_requests FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = seller_id);

CREATE POLICY "Customers can create job requests"
  ON public.job_requests FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Participants can update job requests"
  ON public.job_requests FOR UPDATE
  USING (auth.uid() = customer_id OR auth.uid() = seller_id);

-- Offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Offers visible to job request participants"
  ON public.offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_requests jr
      WHERE jr.id = job_request_id
      AND (jr.customer_id = auth.uid() OR jr.seller_id = auth.uid())
    )
  );

CREATE POLICY "Sellers can create offers"
  ON public.offers FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own offers"
  ON public.offers FOR UPDATE
  USING (auth.uid() = seller_id);

-- Deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deals visible to participants"
  ON public.deals FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = seller_id);

CREATE POLICY "Deals can be created by participants"
  ON public.deals FOR INSERT
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = seller_id);

CREATE POLICY "Deals can be updated by participants"
  ON public.deals FOR UPDATE
  USING (auth.uid() = customer_id OR auth.uid() = seller_id);

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages visible to job request participants"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_requests jr
      WHERE jr.id = job_request_id
      AND (jr.customer_id = auth.uid() OR jr.seller_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.job_requests jr
      WHERE jr.id = job_request_id
      AND (jr.customer_id = auth.uid() OR jr.seller_id = auth.uid())
    )
  );

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Deal participants can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_id
      AND (d.customer_id = auth.uid() OR d.seller_id = auth.uid())
    )
  );

-- Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Verifications
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications"
  ON public.verifications FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_requests;
