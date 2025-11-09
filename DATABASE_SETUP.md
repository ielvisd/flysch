# Database Setup Guide

Your Supabase database needs the schema to be created before you can use the application. Follow these steps:

## Step 1: Run the Migration

### Option A: Using Supabase Dashboard (Recommended - Easiest)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project (dbgdtyxcfcbdflabmgnf)
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `supabase/migrations/20250109000001_initial_schema.sql` in your code editor
6. Copy **ALL** the contents of that file
7. Paste it into the SQL Editor in Supabase
8. Click **Run** (or press Cmd/Ctrl + Enter)
9. Wait for it to complete - you should see "Success. No rows returned"

### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link your project (replace with your project ref)
npx supabase link --project-ref dbgdtyxcfcbdflabmgnf

# Run migrations
npx supabase db push
```

## Step 2: Verify Tables Were Created

1. In Supabase Dashboard, go to **Table Editor**
2. You should see these tables:
   - `schools`
   - `user_profiles`
   - `inquiries`
   - `match_sessions`

## Step 3: Seed the Database (Add Sample Schools)

After the migration is complete, seed the database with sample flight school data:

```bash
# Make sure your dev server is running
npm run dev

# In another terminal, run:
curl -X POST http://localhost:3000/api/seed
```

Or use your browser/Postman to POST to: `http://localhost:3000/api/seed`

This will add ~100 flight schools (70 real schools + 30 mock schools).

## Troubleshooting

### Error: "Could not find the table 'public.schools'"
- This means the migration hasn't been run yet
- Follow Step 1 above to run the migration

### Error: "permission denied for schema public"
- Make sure you're using the SQL Editor in Supabase Dashboard (not a restricted user)
- The SQL Editor runs with full admin privileges

### Error: "extension postgis does not exist"
- PostGIS should be enabled automatically, but if not:
  1. Go to Supabase Dashboard → Database → Extensions
  2. Enable "PostGIS" extension
  3. Then run the migration again

## Next Steps

After completing the setup:
1. ✅ Migration run successfully
2. ✅ Tables created
3. ✅ Database seeded with schools
4. Your app should now work! Try fetching schools in the UI



