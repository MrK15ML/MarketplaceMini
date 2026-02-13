-- ============================================
-- Handshake Marketplace — Seed Data
-- Realistic Wellington NZ service providers
-- Idempotent: safe to run multiple times
-- ============================================

-- Clean previous seed data (reverse FK order)
DELETE FROM public.reviews WHERE deal_id IN (SELECT id FROM public.deals WHERE seller_id IN (
  SELECT id FROM public.profiles WHERE bio LIKE '%[SEED]%'));
DELETE FROM public.messages WHERE job_request_id IN (SELECT id FROM public.job_requests WHERE seller_id IN (
  SELECT id FROM public.profiles WHERE bio LIKE '%[SEED]%'));
DELETE FROM public.deals WHERE seller_id IN (
  SELECT id FROM public.profiles WHERE bio LIKE '%[SEED]%');
DELETE FROM public.offers WHERE seller_id IN (
  SELECT id FROM public.profiles WHERE bio LIKE '%[SEED]%');
DELETE FROM public.job_requests WHERE seller_id IN (
  SELECT id FROM public.profiles WHERE bio LIKE '%[SEED]%');
DELETE FROM public.qualifications WHERE user_id IN (
  SELECT id FROM public.profiles WHERE bio LIKE '%[SEED]%');
DELETE FROM public.listings WHERE seller_id IN (
  SELECT id FROM public.profiles WHERE bio LIKE '%[SEED]%');
DELETE FROM public.profiles WHERE bio LIKE '%[SEED]%';
DELETE FROM auth.users WHERE email LIKE '%@seed.handshake.nz';

-- ============================================
-- Main seed block
-- ============================================
DO $$
DECLARE
  -- Sellers
  sid1 UUID; sid2 UUID; sid3 UUID; sid4 UUID; sid5 UUID; sid6 UUID;
  -- Buyers
  bid1 UUID; bid2 UUID;
  -- Listings
  lid1 UUID; lid2 UUID; lid3 UUID; lid4 UUID; lid5 UUID; lid6 UUID;
  lid7 UUID; lid8 UUID; lid9 UUID; lid10 UUID; lid11 UUID; lid12 UUID;
  lid13 UUID; lid14 UUID; lid15 UUID;
  -- Job requests
  jid1 UUID; jid2 UUID; jid3 UUID; jid4 UUID; jid5 UUID;
  jid6 UUID; jid7 UUID; jid8 UUID;
  -- Offers
  oid1 UUID; oid2 UUID; oid3 UUID; oid4 UUID; oid5 UUID;
  oid6 UUID; oid7 UUID; oid8 UUID;
  -- Deals
  did1 UUID; did2 UUID; did3 UUID; did4 UUID; did5 UUID;
  did6 UUID; did7 UUID; did8 UUID;
  -- Temp
  v_pw TEXT;
BEGIN
  -- Generate all UUIDs
  sid1 := gen_random_uuid(); sid2 := gen_random_uuid(); sid3 := gen_random_uuid();
  sid4 := gen_random_uuid(); sid5 := gen_random_uuid(); sid6 := gen_random_uuid();
  bid1 := gen_random_uuid(); bid2 := gen_random_uuid();

  lid1 := gen_random_uuid(); lid2 := gen_random_uuid(); lid3 := gen_random_uuid();
  lid4 := gen_random_uuid(); lid5 := gen_random_uuid(); lid6 := gen_random_uuid();
  lid7 := gen_random_uuid(); lid8 := gen_random_uuid(); lid9 := gen_random_uuid();
  lid10 := gen_random_uuid(); lid11 := gen_random_uuid(); lid12 := gen_random_uuid();
  lid13 := gen_random_uuid(); lid14 := gen_random_uuid(); lid15 := gen_random_uuid();

  jid1 := gen_random_uuid(); jid2 := gen_random_uuid(); jid3 := gen_random_uuid();
  jid4 := gen_random_uuid(); jid5 := gen_random_uuid(); jid6 := gen_random_uuid();
  jid7 := gen_random_uuid(); jid8 := gen_random_uuid();

  oid1 := gen_random_uuid(); oid2 := gen_random_uuid(); oid3 := gen_random_uuid();
  oid4 := gen_random_uuid(); oid5 := gen_random_uuid(); oid6 := gen_random_uuid();
  oid7 := gen_random_uuid(); oid8 := gen_random_uuid();

  did1 := gen_random_uuid(); did2 := gen_random_uuid(); did3 := gen_random_uuid();
  did4 := gen_random_uuid(); did5 := gen_random_uuid(); did6 := gen_random_uuid();
  did7 := gen_random_uuid(); did8 := gen_random_uuid();

  v_pw := crypt('SeedPass123!', gen_salt('bf'));

  -- ==========================================
  -- AUTH USERS (triggers auto-create profiles)
  -- ==========================================
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at, confirmation_token, recovery_token)
  VALUES
    (sid1, '00000000-0000-0000-0000-000000000000', 'sarah.chen@seed.handshake.nz', v_pw, NOW(), '{"display_name":"Sarah Chen"}'::jsonb, 'authenticated', 'authenticated', NOW() - INTERVAL '180 days', NOW(), '', ''),
    (sid2, '00000000-0000-0000-0000-000000000000', 'james.wiremu@seed.handshake.nz', v_pw, NOW(), '{"display_name":"James Wiremu"}'::jsonb, 'authenticated', 'authenticated', NOW() - INTERVAL '365 days', NOW(), '', ''),
    (sid3, '00000000-0000-0000-0000-000000000000', 'priya.patel@seed.handshake.nz', v_pw, NOW(), '{"display_name":"Priya Patel"}'::jsonb, 'authenticated', 'authenticated', NOW() - INTERVAL '120 days', NOW(), '', ''),
    (sid4, '00000000-0000-0000-0000-000000000000', 'tom.bradley@seed.handshake.nz', v_pw, NOW(), '{"display_name":"Tom Bradley"}'::jsonb, 'authenticated', 'authenticated', NOW() - INTERVAL '90 days', NOW(), '', ''),
    (sid5, '00000000-0000-0000-0000-000000000000', 'aroha.ngata@seed.handshake.nz', v_pw, NOW(), '{"display_name":"Aroha Ngata"}'::jsonb, 'authenticated', 'authenticated', NOW() - INTERVAL '200 days', NOW(), '', ''),
    (sid6, '00000000-0000-0000-0000-000000000000', 'mike.sullivan@seed.handshake.nz', v_pw, NOW(), '{"display_name":"Mike Sullivan"}'::jsonb, 'authenticated', 'authenticated', NOW() - INTERVAL '60 days', NOW(), '', ''),
    (bid1, '00000000-0000-0000-0000-000000000000', 'emma.wilson@seed.handshake.nz', v_pw, NOW(), '{"display_name":"Emma Wilson"}'::jsonb, 'authenticated', 'authenticated', NOW() - INTERVAL '150 days', NOW(), '', ''),
    (bid2, '00000000-0000-0000-0000-000000000000', 'david.kim@seed.handshake.nz', v_pw, NOW(), '{"display_name":"David Kim"}'::jsonb, 'authenticated', 'authenticated', NOW() - INTERVAL '100 days', NOW(), '', '');

  -- Also insert identities (required for Supabase auth to work)
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES
    (gen_random_uuid(), sid1, sid1, 'email', jsonb_build_object('sub', sid1, 'email', 'sarah.chen@seed.handshake.nz'), NOW(), NOW() - INTERVAL '180 days', NOW()),
    (gen_random_uuid(), sid2, sid2, 'email', jsonb_build_object('sub', sid2, 'email', 'james.wiremu@seed.handshake.nz'), NOW(), NOW() - INTERVAL '365 days', NOW()),
    (gen_random_uuid(), sid3, sid3, 'email', jsonb_build_object('sub', sid3, 'email', 'priya.patel@seed.handshake.nz'), NOW(), NOW() - INTERVAL '120 days', NOW()),
    (gen_random_uuid(), sid4, sid4, 'email', jsonb_build_object('sub', sid4, 'email', 'tom.bradley@seed.handshake.nz'), NOW(), NOW() - INTERVAL '90 days', NOW()),
    (gen_random_uuid(), sid5, sid5, 'email', jsonb_build_object('sub', sid5, 'email', 'aroha.ngata@seed.handshake.nz'), NOW(), NOW() - INTERVAL '200 days', NOW()),
    (gen_random_uuid(), sid6, sid6, 'email', jsonb_build_object('sub', sid6, 'email', 'mike.sullivan@seed.handshake.nz'), NOW(), NOW() - INTERVAL '60 days', NOW()),
    (gen_random_uuid(), bid1, bid1, 'email', jsonb_build_object('sub', bid1, 'email', 'emma.wilson@seed.handshake.nz'), NOW(), NOW() - INTERVAL '150 days', NOW()),
    (gen_random_uuid(), bid2, bid2, 'email', jsonb_build_object('sub', bid2, 'email', 'david.kim@seed.handshake.nz'), NOW(), NOW() - INTERVAL '100 days', NOW());

  -- ==========================================
  -- PROFILES (update auto-created profiles)
  -- ==========================================
  -- Seller 1: Sarah Chen — Cleaning
  UPDATE public.profiles SET
    display_name = 'Sarah Chen', bio = 'Professional house cleaner with 5 years experience in the Wellington region. Eco-friendly products, flexible scheduling. [SEED]',
    location_city = 'Wellington', location_lat = -41.2865, location_lng = 174.7762,
    is_seller = TRUE, is_verified = TRUE,
    created_at = NOW() - INTERVAL '180 days'
  WHERE id = sid1;

  -- Seller 2: James Wiremu — Electrician (licensed trade)
  UPDATE public.profiles SET
    display_name = 'James Wiremu', bio = 'Registered electrician, 12 years in the trade. Residential and light commercial. Wellington and Hutt Valley. [SEED]',
    location_city = 'Wellington', location_lat = -41.2780, location_lng = 174.7780,
    is_seller = TRUE, is_verified = TRUE,
    created_at = NOW() - INTERVAL '365 days'
  WHERE id = sid2;

  -- Seller 3: Priya Patel — Tutor
  UPDATE public.profiles SET
    display_name = 'Priya Patel', bio = 'VUW maths PhD student. Tutoring NCEA L1-3, first-year uni calculus and stats. Patient and thorough. [SEED]',
    location_city = 'Wellington', location_lat = -41.2900, location_lng = 174.7680,
    is_seller = TRUE, is_verified = FALSE,
    created_at = NOW() - INTERVAL '120 days'
  WHERE id = sid3;

  -- Seller 4: Tom Bradley — Gardening & Lawns
  UPDATE public.profiles SET
    display_name = 'Tom Bradley', bio = 'Lawn mowing, hedge trimming, garden tidy-ups. Reliable and affordable. Based in Karori. [SEED]',
    location_city = 'Wellington', location_lat = -41.2820, location_lng = 174.7400,
    is_seller = TRUE, is_verified = FALSE,
    created_at = NOW() - INTERVAL '90 days'
  WHERE id = sid4;

  -- Seller 5: Aroha Ngata — Web Dev & Design (remote)
  UPDATE public.profiles SET
    display_name = 'Aroha Ngata', bio = 'Freelance web developer and designer. React, Next.js, Shopify. Available for remote projects NZ-wide. [SEED]',
    location_city = 'Wellington', location_lat = -41.2950, location_lng = 174.7740,
    is_seller = TRUE, is_verified = TRUE,
    created_at = NOW() - INTERVAL '200 days'
  WHERE id = sid5;

  -- Seller 6: Mike Sullivan — Moving & Removals
  UPDATE public.profiles SET
    display_name = 'Mike Sullivan', bio = 'Strong pair of hands for house moves, furniture assembly, and heavy lifting. Ute available. [SEED]',
    location_city = 'Wellington', location_lat = -41.3100, location_lng = 174.7810,
    is_seller = TRUE, is_verified = FALSE,
    created_at = NOW() - INTERVAL '60 days'
  WHERE id = sid6;

  -- Buyer 1: Emma Wilson
  UPDATE public.profiles SET
    display_name = 'Emma Wilson', bio = 'Young professional in Thorndon. [SEED]',
    location_city = 'Wellington', location_lat = -41.2770, location_lng = 174.7760,
    is_seller = FALSE,
    created_at = NOW() - INTERVAL '150 days'
  WHERE id = bid1;

  -- Buyer 2: David Kim
  UPDATE public.profiles SET
    display_name = 'David Kim', bio = 'VUW student, Kelburn. [SEED]',
    location_city = 'Wellington', location_lat = -41.2850, location_lng = 174.7690,
    is_seller = FALSE,
    created_at = NOW() - INTERVAL '100 days'
  WHERE id = bid2;

  -- ==========================================
  -- LISTINGS (15 total, 2-3 per seller)
  -- ==========================================
  INSERT INTO public.listings (id, seller_id, title, description, category, subcategory, pricing_type, price_min, price_max, price_fixed, is_remote, location_radius_km, requires_license, license_type, is_active, created_at) VALUES
    -- Sarah Chen: Cleaning (3 listings)
    (lid1, sid1, 'Standard House Clean', 'Full house clean including vacuuming, mopping, kitchen and bathroom. Eco-friendly products used. Wellington CBD and suburbs.', 'cleaning', 'house_cleaning', 'hourly', NULL, NULL, 45, FALSE, 15, FALSE, NULL, TRUE, NOW() - INTERVAL '170 days'),
    (lid2, sid1, 'Deep Clean / End of Tenancy', 'Thorough deep clean for bond returns. Oven, windows, carpets. Guaranteed satisfaction.', 'cleaning', 'deep_clean', 'fixed', NULL, NULL, 350, FALSE, 15, FALSE, NULL, TRUE, NOW() - INTERVAL '160 days'),
    (lid3, sid1, 'Office & Commercial Cleaning', 'Regular office cleaning, after-hours available. Competitive rates for ongoing contracts.', 'cleaning', 'commercial', 'range', 80, 200, NULL, FALSE, 20, FALSE, NULL, TRUE, NOW() - INTERVAL '140 days'),

    -- James Wiremu: Electrician (2 listings)
    (lid4, sid2, 'Residential Electrical Work', 'Switches, power points, lighting, fuse board upgrades. Registered electrician with CoC.', 'trades', 'electrical', 'hourly', NULL, NULL, 85, FALSE, 30, TRUE, 'electrical', TRUE, NOW() - INTERVAL '350 days'),
    (lid5, sid2, 'Heat Pump Installation', 'Supply and install heat pumps. Free quote. All major brands. Warranty on workmanship.', 'trades', 'electrical', 'range', 2500, 5000, NULL, FALSE, 30, TRUE, 'electrical', TRUE, NOW() - INTERVAL '300 days'),

    -- Priya Patel: Tutoring (3 listings)
    (lid6, sid3, 'NCEA Maths Tutoring (L1-L3)', 'One-on-one maths tutoring for NCEA. Algebra, calculus, statistics. In-person or online.', 'tutoring', 'academic', 'hourly', NULL, NULL, 40, FALSE, 10, FALSE, NULL, TRUE, NOW() - INTERVAL '110 days'),
    (lid7, sid3, 'University Calculus Help', 'First and second year university calculus. Assignments, exam prep. Online available.', 'tutoring', 'academic', 'hourly', NULL, NULL, 55, TRUE, NULL, FALSE, NULL, TRUE, NOW() - INTERVAL '100 days'),
    (lid8, sid3, 'Stats & Data Analysis Tutoring', 'STATS 101-201 help. R, SPSS, Excel. Assignment guidance and exam prep.', 'tutoring', 'academic', 'hourly', NULL, NULL, 50, TRUE, NULL, FALSE, NULL, TRUE, NOW() - INTERVAL '80 days'),

    -- Tom Bradley: Gardening (2 listings)
    (lid9, sid4, 'Lawn Mowing & Garden Tidy', 'Regular or one-off lawn mowing, weed eating, hedge trimming. Own equipment. Karori and surrounds.', 'odd_jobs', 'gardening', 'range', 40, 80, NULL, FALSE, 10, FALSE, NULL, TRUE, NOW() - INTERVAL '85 days'),
    (lid10, sid4, 'Section Clearing & Green Waste', 'Large garden clear-outs, section prep, green waste removal. Free quote.', 'odd_jobs', 'gardening', 'range', 150, 500, NULL, FALSE, 15, FALSE, NULL, TRUE, NOW() - INTERVAL '70 days'),

    -- Aroha Ngata: Web Dev (3 listings)
    (lid11, sid5, 'Custom Website Development', 'Modern, responsive websites built with React/Next.js. E-commerce, portfolios, business sites.', 'remote', 'web_development', 'range', 1500, 8000, NULL, TRUE, NULL, FALSE, NULL, TRUE, NOW() - INTERVAL '190 days'),
    (lid12, sid5, 'Shopify Store Setup', 'Full Shopify store setup with custom theme. Product upload, payment config, SEO basics.', 'remote', 'web_development', 'fixed', NULL, NULL, 1200, TRUE, NULL, FALSE, NULL, TRUE, NOW() - INTERVAL '150 days'),
    (lid13, sid5, 'Website Maintenance & Updates', 'Ongoing website maintenance. Content updates, security patches, hosting support. Monthly retainer.', 'remote', 'web_development', 'range', 200, 500, NULL, TRUE, NULL, FALSE, NULL, TRUE, NOW() - INTERVAL '130 days'),

    -- Mike Sullivan: Moving (2 listings)
    (lid14, sid6, 'House Moving Help', 'Strong helpers for house moves. Loading, unloading, furniture shifting. Ute with trailer available.', 'odd_jobs', 'moving', 'hourly', NULL, NULL, 50, FALSE, 25, FALSE, NULL, TRUE, NOW() - INTERVAL '55 days'),
    (lid15, sid6, 'Furniture Assembly & Heavy Lifting', 'IKEA assembly, appliance moving, rearranging. Solo or with a mate. Competitive rates.', 'odd_jobs', 'furniture', 'hourly', NULL, NULL, 45, FALSE, 20, FALSE, NULL, TRUE, NOW() - INTERVAL '40 days');

  -- ==========================================
  -- QUALIFICATIONS (for trust display)
  -- ==========================================
  INSERT INTO public.qualifications (user_id, listing_id, type, title, description, verified, created_at) VALUES
    (sid2, lid4, 'license', 'Registered Electrician', 'EWRB Registration #12345. Current practising licence.', TRUE, NOW() - INTERVAL '350 days'),
    (sid2, lid5, 'certificate', 'Mitsubishi Heat Pump Installer', 'Certified installer for Mitsubishi Electric heat pumps.', TRUE, NOW() - INTERVAL '200 days'),
    (sid1, NULL, 'certificate', 'First Aid Certificate', 'St John Workplace First Aid. Valid until 2027.', FALSE, NOW() - INTERVAL '100 days'),
    (sid3, NULL, 'certificate', 'VUW PhD Candidate - Mathematics', 'Enrolled PhD student, Victoria University of Wellington.', FALSE, NOW() - INTERVAL '110 days'),
    (sid5, NULL, 'portfolio', 'Portfolio: aroha.dev', 'Personal portfolio with 15+ completed projects.', FALSE, NOW() - INTERVAL '180 days'),
    (sid5, lid12, 'testimonial', 'Client Testimonial - KoruCraft NZ', '"Aroha built our Shopify store in 2 weeks. Sales up 40% since launch." — KoruCraft owner', FALSE, NOW() - INTERVAL '90 days');

  -- ==========================================
  -- JOB REQUESTS (8 total, all completed flow)
  -- ==========================================
  INSERT INTO public.job_requests (id, listing_id, customer_id, seller_id, status, description, budget_min, budget_max, category, created_at, updated_at) VALUES
    -- Completed jobs with reviews
    (jid1, lid1, bid1, sid1, 'reviewed', 'Need a regular weekly clean for my 2-bed apartment in Thorndon. Wednesday mornings preferred.', 40, 60, 'cleaning', NOW() - INTERVAL '140 days', NOW() - INTERVAL '130 days'),
    (jid2, lid4, bid1, sid2, 'reviewed', 'Want to add two double power points in the lounge and a light in the garage.', 150, 300, 'trades', NOW() - INTERVAL '120 days', NOW() - INTERVAL '110 days'),
    (jid3, lid6, bid2, sid3, 'reviewed', 'Need help with NCEA Level 2 calculus. Struggling with differentiation. Weekly sessions.', 35, 50, 'tutoring', NOW() - INTERVAL '90 days', NOW() - INTERVAL '60 days'),
    (jid4, lid9, bid1, sid4, 'reviewed', 'Lawn mowing and hedge trim for a medium-sized Kelburn property. One-off for now.', 50, 80, 'odd_jobs', NOW() - INTERVAL '70 days', NOW() - INTERVAL '65 days'),
    (jid5, lid11, bid2, sid5, 'reviewed', 'Need a simple portfolio site for my photography. 5-6 pages, gallery, contact form.', 1500, 3000, 'remote', NOW() - INTERVAL '150 days', NOW() - INTERVAL '120 days'),
    (jid6, lid14, bid2, sid6, 'reviewed', 'Moving from Kelburn to Newtown. One bedroom flat, mostly boxes and a couch.', 100, 200, 'odd_jobs', NOW() - INTERVAL '45 days', NOW() - INTERVAL '42 days'),
    (jid7, lid2, bid2, sid1, 'reviewed', 'End of tenancy deep clean for a 3-bed in Mt Cook. Need it done by Friday.', 300, 400, 'cleaning', NOW() - INTERVAL '60 days', NOW() - INTERVAL '55 days'),
    (jid8, lid7, bid1, sid3, 'reviewed', 'Help with MATH 142 assignment and exam prep. Two sessions needed.', 50, 60, 'tutoring', NOW() - INTERVAL '50 days', NOW() - INTERVAL '40 days');

  -- ==========================================
  -- OFFERS (one per job request, all accepted)
  -- ==========================================
  INSERT INTO public.offers (id, job_request_id, version, seller_id, price, pricing_type, estimated_duration, scope_description, valid_until, status, created_at) VALUES
    (oid1, jid1, 1, sid1, 45, 'hourly', '2 hours weekly', 'Weekly clean: vacuum, mop, kitchen, bathroom. Eco products included. Wednesdays 9am.', NOW() - INTERVAL '100 days', 'accepted', NOW() - INTERVAL '138 days'),
    (oid2, jid2, 1, sid2, 250, 'fixed', '3-4 hours', 'Install 2x double GPOs in lounge + 1 LED batten in garage. Materials included. CoC provided.', NOW() - INTERVAL '80 days', 'accepted', NOW() - INTERVAL '118 days'),
    (oid3, jid3, 1, sid3, 40, 'hourly', '1 hour per session', 'Weekly 1hr tutoring sessions covering NCEA L2 calculus. Differentiation, integration, applications.', NOW() - INTERVAL '50 days', 'accepted', NOW() - INTERVAL '88 days'),
    (oid4, jid4, 1, sid4, 65, 'fixed', '1.5 hours', 'Mow lawns front and back, trim hedges along driveway, weed eat edges. Green waste taken.', NOW() - INTERVAL '55 days', 'accepted', NOW() - INTERVAL '68 days'),
    (oid5, jid5, 1, sid5, 2200, 'fixed', '2 weeks', 'Portfolio site: Home, About, Gallery (lightbox), Blog, Contact form. Responsive. Next.js + Vercel hosting setup.', NOW() - INTERVAL '100 days', 'accepted', NOW() - INTERVAL '148 days'),
    (oid6, jid6, 1, sid6, 160, 'fixed', '3 hours', 'Load, transport, unload. Ute + trailer. Kelburn to Newtown. Saturday morning.', NOW() - INTERVAL '35 days', 'accepted', NOW() - INTERVAL '44 days'),
    (oid7, jid7, 1, sid1, 380, 'fixed', '5-6 hours', 'Full deep clean: oven, windows inside, carpet spot-clean, bathroom descale, all surfaces.', NOW() - INTERVAL '45 days', 'accepted', NOW() - INTERVAL '58 days'),
    (oid8, jid8, 1, sid3, 55, 'hourly', '1.5 hours per session', 'Two sessions: Assignment walkthrough + exam revision. MATH 142 calculus focus.', NOW() - INTERVAL '30 days', 'accepted', NOW() - INTERVAL '48 days');

  -- ==========================================
  -- DEALS (all completed)
  -- ==========================================
  INSERT INTO public.deals (id, job_request_id, offer_id, customer_id, seller_id, status, agreed_price, agreed_scope, started_at, completed_at, created_at) VALUES
    (did1, jid1, oid1, bid1, sid1, 'completed', 45, 'Weekly clean: vacuum, mop, kitchen, bathroom.', NOW() - INTERVAL '136 days', NOW() - INTERVAL '131 days', NOW() - INTERVAL '137 days'),
    (did2, jid2, oid2, bid1, sid2, 'completed', 250, 'Install 2x double GPOs + 1 LED batten.', NOW() - INTERVAL '115 days', NOW() - INTERVAL '112 days', NOW() - INTERVAL '116 days'),
    (did3, jid3, oid3, bid2, sid3, 'completed', 40, 'Weekly NCEA L2 calculus tutoring.', NOW() - INTERVAL '85 days', NOW() - INTERVAL '62 days', NOW() - INTERVAL '86 days'),
    (did4, jid4, oid4, bid1, sid4, 'completed', 65, 'Lawn mow + hedge trim.', NOW() - INTERVAL '66 days', NOW() - INTERVAL '65 days', NOW() - INTERVAL '67 days'),
    (did5, jid5, oid5, bid2, sid5, 'completed', 2200, 'Photography portfolio site.', NOW() - INTERVAL '145 days', NOW() - INTERVAL '122 days', NOW() - INTERVAL '146 days'),
    (did6, jid6, oid6, bid2, sid6, 'completed', 160, 'House move Kelburn to Newtown.', NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days', NOW() - INTERVAL '43 days'),
    (did7, jid7, oid7, bid2, sid1, 'completed', 380, 'End of tenancy deep clean.', NOW() - INTERVAL '56 days', NOW() - INTERVAL '55 days', NOW() - INTERVAL '57 days'),
    (did8, jid8, oid8, bid1, sid3, 'completed', 55, 'Two MATH 142 tutoring sessions.', NOW() - INTERVAL '46 days', NOW() - INTERVAL '41 days', NOW() - INTERVAL '47 days');

  -- ==========================================
  -- MESSAGES (first seller response for scoring)
  -- ==========================================
  INSERT INTO public.messages (job_request_id, sender_id, content, message_type, created_at) VALUES
    -- System messages (discussion started)
    (jid1, bid1, 'Discussion started', 'system', NOW() - INTERVAL '140 days'),
    (jid2, bid1, 'Discussion started', 'system', NOW() - INTERVAL '120 days'),
    (jid3, bid2, 'Discussion started', 'system', NOW() - INTERVAL '90 days'),
    (jid4, bid1, 'Discussion started', 'system', NOW() - INTERVAL '70 days'),
    (jid5, bid2, 'Discussion started', 'system', NOW() - INTERVAL '150 days'),
    (jid6, bid2, 'Discussion started', 'system', NOW() - INTERVAL '45 days'),
    (jid7, bid2, 'Discussion started', 'system', NOW() - INTERVAL '60 days'),
    (jid8, bid1, 'Discussion started', 'system', NOW() - INTERVAL '50 days'),
    -- Seller first responses (varied response times for scoring)
    (jid1, sid1, 'Hi Emma! I''d love to help. Wednesdays work great for me. I can start next week.', 'text', NOW() - INTERVAL '139 days' + INTERVAL '2 hours'),
    (jid2, sid2, 'Kia ora Emma. Happy to take a look. I can pop round tomorrow for a quick quote.', 'text', NOW() - INTERVAL '119 days' + INTERVAL '45 minutes'),
    (jid3, sid3, 'Hi David! Differentiation is one of my strengths. When would you like to start?', 'text', NOW() - INTERVAL '89 days' + INTERVAL '3 hours'),
    (jid4, sid4, 'Hey! I can fit this in Saturday. What time suits?', 'text', NOW() - INTERVAL '69 days' + INTERVAL '1 hour'),
    (jid5, sid5, 'Hi David! I love portfolio work. Let me share some examples. When are you free to chat?', 'text', NOW() - INTERVAL '149 days' + INTERVAL '30 minutes'),
    (jid6, sid6, 'Hey mate, Saturday works. I''ll have my trailer. Should be a quick one.', 'text', NOW() - INTERVAL '44 days' + INTERVAL '4 hours'),
    (jid7, sid1, 'Hi David, I can do the deep clean Thursday. Will that work for your landlord inspection?', 'text', NOW() - INTERVAL '59 days' + INTERVAL '1 hour'),
    (jid8, sid3, 'Hi Emma! MATH 142 is right up my alley. Let''s book the first session.', 'text', NOW() - INTERVAL '49 days' + INTERVAL '2 hours');

  -- ==========================================
  -- REVIEWS (bidirectional — buyer reviews seller, seller reviews buyer)
  -- ==========================================
  INSERT INTO public.reviews (deal_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES
    -- Buyers reviewing sellers
    (did1, bid1, sid1, 5, 'Sarah is amazing. Apartment has never been this clean. Booking her weekly!', NOW() - INTERVAL '130 days'),
    (did2, bid1, sid2, 5, 'James was professional, on time, and the work is top quality. Highly recommend.', NOW() - INTERVAL '110 days'),
    (did3, bid2, sid3, 4, 'Priya explains things really well. My grades have improved a lot. Only 4 stars because sometimes hard to schedule.', NOW() - INTERVAL '60 days'),
    (did4, bid1, sid4, 4, 'Good job on the lawns. Neat and tidy. Bit late arriving but work was solid.', NOW() - INTERVAL '64 days'),
    (did5, bid2, sid5, 5, 'Aroha built an incredible site. Fast, responsive, looks professional. Worth every dollar.', NOW() - INTERVAL '120 days'),
    (did6, bid2, sid6, 4, 'Got the job done, nothing damaged. Bit sweaty but that''s moving for you! Would use again.', NOW() - INTERVAL '41 days'),
    (did7, bid2, sid1, 5, 'Perfect deep clean. Got our full bond back. Sarah is thorough and detail-oriented.', NOW() - INTERVAL '54 days'),
    (did8, bid1, sid3, 5, 'Priya really knows her stuff. Got an A on my assignment. Lifesaver!', NOW() - INTERVAL '39 days'),
    -- Sellers reviewing buyers
    (did1, sid1, bid1, 5, 'Emma is lovely to work for. Apartment is always tidy, makes my job easy.', NOW() - INTERVAL '129 days'),
    (did2, sid2, bid1, 5, 'Great communication. Had everything cleared and ready for me. Easy job.', NOW() - INTERVAL '109 days'),
    (did3, sid3, bid2, 4, 'David works hard and does the practice problems. Good student.', NOW() - INTERVAL '59 days'),
    (did4, sid4, bid1, 5, 'Property was easy to access, clear instructions. Perfect customer.', NOW() - INTERVAL '63 days'),
    (did5, sid5, bid2, 5, 'David had a clear vision and gave great feedback. Dream client.', NOW() - INTERVAL '119 days'),
    (did6, sid6, bid2, 5, 'Easy move. David had everything boxed and ready. Quick and smooth.', NOW() - INTERVAL '40 days'),
    (did7, sid1, bid2, 5, 'David left the place in reasonable condition. Easy deep clean.', NOW() - INTERVAL '53 days'),
    (did8, sid3, bid1, 5, 'Emma is motivated and prepared. Great to tutor.', NOW() - INTERVAL '38 days');

  -- ==========================================
  -- UPDATE AGGREGATE RATINGS
  -- ==========================================
  PERFORM public.update_profile_rating(sid1);
  PERFORM public.update_profile_rating(sid2);
  PERFORM public.update_profile_rating(sid3);
  PERFORM public.update_profile_rating(sid4);
  PERFORM public.update_profile_rating(sid5);
  PERFORM public.update_profile_rating(sid6);
  PERFORM public.update_profile_rating(bid1);
  PERFORM public.update_profile_rating(bid2);

END $$;

-- ==========================================
-- RECALCULATE ALL SELLER SCORES
-- ==========================================
SELECT public.recalculate_all_seller_scores();

-- ==========================================
-- VERIFICATION QUERIES (run after seeding)
-- ==========================================
-- Uncomment to verify:
--
-- SELECT display_name, handshake_score, avg_rating, total_reviews, total_completed_deals,
--        avg_response_hours, completion_rate
-- FROM public.profiles WHERE is_seller = TRUE ORDER BY handshake_score DESC;
--
-- SELECT p.display_name, COUNT(l.id) as listing_count
-- FROM profiles p JOIN listings l ON l.seller_id = p.id
-- GROUP BY p.display_name ORDER BY listing_count DESC;
--
-- SELECT COUNT(*) as total_deals FROM deals WHERE status = 'completed';
-- SELECT COUNT(*) as total_reviews FROM reviews;
-- SELECT * FROM public.platform_seller_averages;
