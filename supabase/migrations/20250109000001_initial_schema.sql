-- Enable PostGIS extension for geo-queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schools table
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),  -- PostGIS geography for lat/lng
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  programs JSONB[] DEFAULT '{}',  -- Array of program objects
  fleet JSONB DEFAULT '{}'::jsonb,
  instructors_count INTEGER DEFAULT 0,
  trust_tier TEXT CHECK (trust_tier IN ('Premier', 'Verified', 'Community', 'Unverified')) DEFAULT 'Unverified',
  fsp_signals JSONB DEFAULT '{}'::jsonb,  -- Flight school performance signals
  verified_at TIMESTAMP WITH TIME ZONE,
  claimed_by UUID REFERENCES auth.users(id),
  website TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for schools
CREATE INDEX IF NOT EXISTS idx_schools_location ON public.schools USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_schools_programs ON public.schools USING GIN (programs);
CREATE INDEX IF NOT EXISTS idx_schools_trust_tier ON public.schools (trust_tier);
CREATE INDEX IF NOT EXISTS idx_schools_name ON public.schools USING GIN (to_tsvector('english', name));

-- Create user profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('student', 'school', 'admin')) DEFAULT 'student',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('inquiry', 'tour', 'discovery_flight')) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'cancelled')),
  message TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  preferred_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for inquiries
CREATE INDEX IF NOT EXISTS idx_inquiries_school_id ON public.inquiries (school_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON public.inquiries (user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries (status);

-- Create match_sessions table
CREATE TABLE IF NOT EXISTS public.match_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_data JSONB DEFAULT '{}'::jsonb,  -- User inputs from quiz
  inputs JSONB DEFAULT '{}'::jsonb,  -- Normalized inputs for matching
  ranked_schools UUID[] DEFAULT '{}',  -- Array of school IDs in ranked order
  match_scores JSONB DEFAULT '{}'::jsonb,  -- Scores per school
  debrief TEXT,  -- AI-generated summary
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for match_sessions
CREATE INDEX IF NOT EXISTS idx_match_sessions_user_id ON public.match_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_match_sessions_created_at ON public.match_sessions (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schools
-- Allow public read access to all schools
CREATE POLICY "Schools are publicly readable"
  ON public.schools FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert schools (for demo)
CREATE POLICY "Authenticated users can insert schools"
  ON public.schools FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow school owners or admins to update their schools
CREATE POLICY "School owners can update their schools"
  ON public.schools FOR UPDATE
  TO authenticated
  USING (
    claimed_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user_profiles
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- RLS Policies for inquiries
-- Public can insert inquiries (for contact forms)
CREATE POLICY "Anyone can create inquiries"
  ON public.inquiries FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can read their own inquiries
CREATE POLICY "Users can read own inquiries"
  ON public.inquiries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- School owners can read inquiries for their schools
CREATE POLICY "School owners can read their inquiries"
  ON public.inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = inquiries.school_id
      AND schools.claimed_by = auth.uid()
    )
  );

-- School owners can update inquiries for their schools
CREATE POLICY "School owners can update their inquiries"
  ON public.inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.schools
      WHERE schools.id = inquiries.school_id
      AND schools.claimed_by = auth.uid()
    )
  );

-- RLS Policies for match_sessions
-- Users can read their own match sessions
CREATE POLICY "Users can read own match sessions"
  ON public.match_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Anyone can create match sessions (anonymous matching allowed)
CREATE POLICY "Anyone can create match sessions"
  ON public.match_sessions FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can update their own match sessions
CREATE POLICY "Users can update own match sessions"
  ON public.match_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at_schools
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_inquiries
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_match_sessions
  BEFORE UPDATE ON public.match_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create demo users function (for seeding)
CREATE OR REPLACE FUNCTION public.create_demo_users()
RETURNS void AS $$
BEGIN
  -- Note: This function should be called after users are created via Supabase Auth
  -- It just ensures user profiles exist
  INSERT INTO public.user_profiles (id, role, full_name)
  SELECT id, 'student', 'Demo Student'
  FROM auth.users
  WHERE email = 'student@flysch.com'
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_profiles (id, role, full_name)
  SELECT id, 'school', 'Demo School'
  FROM auth.users
  WHERE email = 'school@flysch.com'
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

