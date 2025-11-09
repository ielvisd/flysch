# Supabase Database Setup

This directory contains the database schema and migrations for the Flysch project.

## Quick Start

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `migrations/20250109000001_initial_schema.sql`
4. Paste and run the SQL in the editor
5. Verify tables were created in the Table Editor

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link your project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push
```

### Option 3: Using the Seed API

After setting up your environment variables, you can also create the schema via:

```bash
# Make sure your .env has SUPABASE_URL and SUPABASE_ANON_KEY
npm run dev

# In another terminal, call the setup endpoint
curl -X POST http://localhost:3000/api/db/setup
```

## Database Schema Overview

### Tables Created

1. **schools** - Main table for flight school data
   - Includes PostGIS geography for location queries
   - JSONB arrays for flexible program data
   - Trust tier system with enum constraint

2. **user_profiles** - Extends Supabase auth.users
   - Roles: student, school, admin
   - Additional profile information

3. **inquiries** - Contact requests and tour bookings
   - Links users to schools
   - Tracks inquiry status

4. **match_sessions** - AI matching results
   - Stores user inputs from quiz
   - Ranked school results with scores
   - AI-generated debrief text

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **schools**: Public read, authenticated write
- **user_profiles**: Users can only access their own
- **inquiries**: Users see their own, schools see theirs
- **match_sessions**: Users see their own sessions

### PostGIS Enabled

The schema enables PostGIS for geo-spatial queries:

```sql
-- Example: Find schools within 100km of a location
SELECT * FROM schools
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography,
  100000  -- 100km in meters
);
```

## Seeding Data

After creating the schema, run the seed API to populate with flight school data:

```bash
# Start the dev server
npm run dev

# In another terminal
curl -X POST http://localhost:3000/api/seed
```

This will:
- Fetch real FAA Part 142 school data
- Fetch AOPA directory schools
- Generate mock schools with realistic data
- Target: ~100 total schools (70 real, 30 mocks)

## Demo Users

Create demo users in Supabase Auth dashboard:

1. **Student Demo**: `student@flysch.com` / `demo123`
2. **School Demo**: `school@flysch.com` / `demo123`

After creating these users, their profiles will be automatically created via the schema's trigger function.

