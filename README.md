# Flysch - Flight School Marketplace MVP

A student-first marketplace that indexes flight schools, normalizes training data, and uses AI to match prospective pilots with their perfect school.

## 🚀 Features

- **Smart Search & Compare** - Filter schools by programs, budget, location, fleet, and trust tier
- **AI-Powered Matching** - Intelligent school recommendations based on your goals, budget, and preferences
- **Verified School Data** - ~100 flight schools with normalized pricing, programs, and performance metrics
- **Trust Tier System** - Premier, Verified, Community, and Unverified schools with transparent criteria
- **Real-time Updates** - Live school information updates via Supabase
- **Mobile-First Design** - Fully responsive with optimized touch interactions
- **Geo-Location Search** - Find schools within your desired radius

## 🛠️ Tech Stack

- **Framework**: Nuxt 4 (Vue 3, SSR/SSG)
- **UI Library**: Nuxt UI (Tailwind CSS)
- **Backend**: Supabase (PostgreSQL + PostGIS)
- **AI**: OpenAI GPT-4 / Grok API
- **Maps**: Leaflet
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18.x or higher
- npm/pnpm/yarn
- Supabase account with a project created
- OpenAI or Grok API key (for AI matching)

## 🏗️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd flysch
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be provisioned
4. Get your project URL and anon key from Settings → API

#### Apply Database Schema

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20250109000001_initial_schema.sql`
3. Paste and execute the SQL
4. Verify tables were created in the Table Editor

See `supabase/README.md` for detailed database setup instructions.

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI API Key (OpenAI or Grok)
OPENAI_API_KEY=your_openai_api_key_here
# OR
# GROK_API_KEY=your_grok_api_key_here
```

⚠️ **Important**: Never commit your `.env` file to version control!

### 4. Seed the Database

Start the development server:

```bash
npm run dev
```

In another terminal, seed the database with flight school data:

```bash
curl -X POST http://localhost:3000/api/seed
```

This will populate ~100 schools (70 real from FAA/AOPA, 30 mocks).

### 5. Create Demo Users (Optional)

In Supabase Dashboard → Authentication → Users:

1. Create user: `student@flysch.com` / `demo123`
2. Create user: `school@flysch.com` / `demo123`

Or use the "Sign in as Demo" buttons on the login page (they auto-create accounts).

## 🧪 Development

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Run Tests

```bash
# Unit tests
npm run test:unit

# E2E tests (requires dev server running)
npm run test:e2e

# E2E with UI
npm run test:e2e:ui

# Coverage report
npm run test:coverage
```

### Build for Production

```bash
npm run build
npm run preview
```

## 🚢 Deployment to Vercel

### Option 1: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Option 2: Via GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Configure environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` or `GROK_API_KEY`
5. Deploy!

### Environment Variables in Vercel

In your Vercel project settings:

1. Go to Settings → Environment Variables
2. Add all variables from your `.env` file:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for seeding)
   - `OPENAI_API_KEY` or `GROK_API_KEY` - Your AI API key
3. Make sure to add them for Production, Preview, and Development environments

**Note**: The `vercel.json` file is configured for automatic deployment. The build command and output directory are already set..

## 📁 Project Structure

```
flysch/
├── app/
│   ├── pages/              # Route pages
│   │   ├── index.vue       # Search & compare
│   │   ├── match.vue       # AI matching wizard
│   │   ├── login.vue       # Authentication
│   │   ├── schools/[id].vue # School profiles
│   │   └── 404.vue         # Error page
│   └── app.vue             # Root component
├── components/
│   └── SchoolCard.vue      # Reusable school card
├── composables/
│   ├── useSchools.ts       # School data management
│   ├── useMatching.ts      # AI matching logic
│   └── useTiers.ts         # Trust tier calculations
├── layouts/
│   └── default.vue         # Global layout with navbar
├── server/
│   └── api/
│       ├── seed.post.ts    # Database seeding
│       └── match.post.ts   # AI matching endpoint
├── plugins/
│   └── supabase.client.ts  # Supabase initialization
├── supabase/
│   ├── migrations/         # Database schema
│   └── README.md           # Database setup guide
├── test/
│   ├── unit/               # Vitest unit tests
│   └── e2e/                # Playwright E2E tests
├── types/
│   └── database.ts         # TypeScript types
├── assets/
│   └── css/
│       └── main.css        # Global styles
├── nuxt.config.ts          # Nuxt configuration
├── app.config.ts           # Theme configuration
├── vitest.config.ts        # Vitest configuration
└── playwright.config.ts    # Playwright configuration
```

## 🔑 Key Features Guide

### Search & Compare

- Navigate to homepage (`/`)
- Use filters: programs, budget, location, training type, fleet
- View results on map or in grid
- Click any school card to see full profile

### AI Matching

- Navigate to `/match`
- Complete 4-step wizard:
  1. Select training goals (PPL, IR, CPL, etc.)
  2. Set budget and schedule flexibility
  3. Choose location and radius
  4. Pick aircraft and training preferences
- Get AI-ranked results with personalized debrief
- View match scores and detailed school profiles

### School Profiles

- View comprehensive school information
- See programs, costs, fleet, instructors
- Check trust tier and verification status
- View performance metrics (FSP signals)
- Read student reviews (mock data)

### Authentication

- Sign in at `/login`
- Use demo accounts or create your own
- Access saved matches and preferences

## 🎨 Customization

### Theme Colors

Edit `app.config.ts` to customize the aviation theme:

- **Primary** (Sky Blue): `#1E40AF`
- **Secondary** (Runway Orange): `#F59E0B`
- **Success** (Verified Green): `#10B981`

### Trust Tier Logic

Customize tier calculations in `composables/useTiers.ts`:

- Premier: High performance across all metrics
- Verified: Good performance in key areas
- Community: Basic criteria met
- Unverified: Limited data available

## 🐛 Troubleshooting

### Database Connection Issues

- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- Check that RLS policies are enabled in Supabase
- Ensure PostGIS extension is enabled

### AI Matching Not Working

- Verify `OPENAI_API_KEY` or `GROK_API_KEY` in `.env`
- Check server logs for API errors
- Fallback to rule-based ranking if API fails

### No Schools Showing

- Run the seed API: `curl -X POST http://localhost:3000/api/seed`
- Check Supabase Table Editor for data
- Verify database schema was applied correctly

### Build Errors

- Clear `.nuxt` folder: `rm -rf .nuxt`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`

## 📊 Monitoring & Analytics

### Vercel Analytics

Enable in your Vercel project:
- Track page views
- Monitor Core Web Vitals
- Analyze user flows

### Supabase Logs

Monitor in Supabase Dashboard:
- Query performance
- Slow queries
- Error logs

## 🔮 Future Enhancements (Post-MVP)

- [ ] Real FSP API integration
- [ ] Advanced embeddings for matching
- [ ] Full school claims dashboard
- [ ] Document upload for verification
- [ ] Financing options integration
- [ ] ETL pipeline for school data
- [ ] Revenue/monetization features

## 📄 License

This is an MVP demo project. See LICENSE for details.

## 🤝 Contributing

This is a demo project. For production use, implement:
- Enhanced security (rate limiting, input validation)
- Production-grade error handling
- Comprehensive test coverage
- Performance optimization
- Accessibility audits

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `supabase/README.md` for database issues
3. Check Vercel deployment logs
4. Review Supabase project logs

---

Built with ❤️ using Nuxt 4, Supabase, and OpenAI
