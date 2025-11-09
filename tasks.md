# Flysch MVP - Implementation Tasks

## Phase 0: Setup & Configuration

- [ ] Initialize Nuxt 4 project with `npx nuxi@latest init flysch`
- [ ] Install Nuxt UI: `npm i @nuxt/ui`
- [ ] Install Supabase client: `npm i @supabase/supabase-js`
- [ ] Install VueUse utilities: `npm i @vueuse/nuxt`
- [ ] Install Leaflet for maps: `npm i @nuxtjs/leaflet`
- [ ] Install OpenAI SDK: `npm i openai`
- [ ] Install MCP packages: `npm i vue-mcp nuxt-ui-mcp supabase-mcp`
- [ ] Install Playwright for E2E testing: `npm i -D @playwright/test`
- [ ] Initialize Supabase CLI: `npx supabase init`
- [ ] Enable PostGIS extension: `supabase db extension enable postgis`
- [ ] Create `.env` file with Supabase credentials
- [ ] Add `SUPABASE_URL` environment variable
- [ ] Add `SUPABASE_ANON_KEY` environment variable
- [ ] Add `OPENAI_API_KEY` or `GROK_API_KEY` environment variable
- [ ] Configure `nuxt.config.ts` with `@nuxt/ui` module
- [ ] Create `app.config.ts` with aviation theme colors
- [ ] Set up ESLint and Prettier configuration

## Phase 1: Database & Data Layer

### Database Schema

- [ ] Create `schools` table with UUID primary key
- [ ] Add `name` TEXT column (NOT NULL)
- [ ] Add `location` GEOMETRY(POINT, 4326) for PostGIS
- [ ] Add `programs` JSONB[] array column
- [ ] Add `fleet` JSONB column
- [ ] Add `instructors_count` INTEGER column
- [ ] Add `trust_tier` TEXT with CHECK constraint
- [ ] Add `fsp_signals` JSONB column
- [ ] Add `verified_at` TIMESTAMP column
- [ ] Add `claimed_by` UUID foreign key to auth.users
- [ ] Add `created_at` TIMESTAMP with DEFAULT NOW()
- [ ] Create GIN index on `programs` column
- [ ] Create GIST index on `location` column for geo queries
- [ ] Create `inquiries` table with UUID primary key
- [ ] Add foreign keys for `school_id` and `user_id` in inquiries
- [ ] Add `type` CHECK constraint for inquiry types
- [ ] Create `match_sessions` table with UUID primary key
- [ ] Add `inputs` JSONB column for quiz responses
- [ ] Add `ranked_schools` UUID[] array column
- [ ] Add `debrief` TEXT column for AI summary
- [ ] Extend `auth.users` with profile table
- [ ] Add `role` field (student/school) to user profiles

### RLS Policies & Security

- [ ] Enable RLS on `schools` table
- [ ] Create policy: Public SELECT on schools
- [ ] Create policy: INSERT/UPDATE requires auth for schools
- [ ] Enable RLS on `inquiries` table
- [ ] Create policy: Users can only see their own inquiries
- [ ] Enable RLS on `match_sessions` table
- [ ] Create policy: Users can only see their own match sessions

### Data Seeding

- [ ] Create `/server/api/seed.ts` POST endpoint
- [ ] Implement FAA Part 142 data fetcher
- [ ] Implement AOPA directory data fetcher
- [ ] Parse and normalize real school data (70 schools target)
- [ ] Generate mock school data (30 schools target)
- [ ] Add Embry-Riddle Aeronautical University (Daytona Beach, FL)
- [ ] Add FlightSafety International locations
- [ ] Normalize cost bands (8k-15k ranges)
- [ ] Normalize training hours (40-70 range)
- [ ] Add mock FSP signals (60-80% utilization)
- [ ] Validate data on insert (cost > 5000 && cost < 50000)
- [ ] Flag outliers during seeding
- [ ] Implement error handling for seed failures

### Composables - Data Layer

- [ ] Create `composables/useTiers.ts`
- [ ] Implement tier logic: Premier (utilization > 75%)
- [ ] Implement tier logic: Verified (programs.length > 3)
- [ ] Implement tier logic: Community (default)
- [ ] Add timestamp to all tier calculations
- [ ] Export tier badge display helpers

## Phase 2: Core Features - Search & Compare

### Page Setup

- [ ] Create `app/pages/index.vue`
- [ ] Add page meta tags for SEO
- [ ] Set up page layout structure

### Search & Filter UI

- [ ] Add `UInput` for text search
- [ ] Add `USelect` multi-select for program filter (PPL/IR/CPL)
- [ ] Add `USelect` for budget band filter (<10k/10-15k/>15k)
- [ ] Add `USelect` for financing options (VA/lender)
- [ ] Add `USelect` for training type (Part 61/141)
- [ ] Add `USelect` for fleet preferences (Cessna/G1000/sim)
- [ ] Add `UInput` for zip code entry
- [ ] Add radius slider for geo-search
- [ ] Implement `useGeolocation` for auto-detect location
- [ ] Add `nuxt-ui-mcp` animations for filter transitions
- [ ] Create mobile accordion for filters
- [ ] Make filters collapsible on mobile

### Map Integration

- [ ] Integrate Leaflet map with `@nuxtjs/leaflet`
- [ ] Add school location markers
- [ ] Implement zoom to user location
- [ ] Add radius overlay visualization
- [ ] Handle map click events

### Composables - Search

- [ ] Create `composables/useSchools.ts`
- [ ] Implement Supabase client initialization
- [ ] Add text search query with `ilike`
- [ ] Add geo-filter with `st_dwithin`
- [ ] Implement program filter
- [ ] Implement budget filter
- [ ] Implement training type filter
- [ ] Implement fleet filter
- [ ] Add pagination (10 schools per page)
- [ ] Manage filtered schools state with reactive `ref`
- [ ] Cache query results using `useState`
- [ ] Add error handling for failed queries

### Results Display

- [ ] Create `components/SchoolCard.vue`
- [ ] Display school name in card
- [ ] Add cost band with `UChip` component
- [ ] Display timeline information
- [ ] Add trust tier badge
- [ ] Include map pin indicator
- [ ] Create grid layout for desktop (side-by-side cards)
- [ ] Create vertical stack for mobile
- [ ] Implement `UTable` for comparison view
- [ ] Add sortable columns to table
- [ ] Make table stack on mobile
- [ ] Add swipeable card functionality for mobile

### Testing

- [ ] Test search functionality
- [ ] Test all filter combinations
- [ ] Test geo-location features
- [ ] Test mobile responsive layout with Playwright
- [ ] Test with Chrome DevTools mobile emulation

## Phase 3: School Profiles

### Page Setup

- [ ] Create `app/pages/schools/[id].vue` dynamic route
- [ ] Add dynamic page meta tags with school name
- [ ] Implement 404 handling for invalid school IDs

### Hero Section

- [ ] Create hero `UCard` component
- [ ] Display school name prominently
- [ ] Add Leaflet map with school location
- [ ] Implement Leaflet cluster for fleet visualization
- [ ] Add school address display

### Programs Section

- [ ] Create programs accordion with `UCollapse`
- [ ] Display each program type (PPL/IR/CPL)
- [ ] Show min/max costs per program
- [ ] Display training hours (Part 61/Part 141)
- [ ] List inclusions (aircraft, materials, etc.)
- [ ] Show estimated timeline (months)

### Fleet Section

- [ ] Create fleet display with `UList`
- [ ] Add aircraft type icons
- [ ] Display aircraft count per type
- [ ] Show simulator availability
- [ ] Add G1000 equipment badges

### Evidence Panel

- [ ] Create evidence panel with `UAlert variant="info"`
- [ ] Display trust tier with badge
- [ ] Show verified facts list
- [ ] Display verification timestamp
- [ ] Add FSP signals (avg hours, cancellation rate, utilization)

### Reviews Section

- [ ] Create mock reviews display
- [ ] Use `UAvatar` for reviewer profile pics
- [ ] Display reviewer name and date
- [ ] Show mock review text
- [ ] Add star ratings (mock data)

### Animations & UX

- [ ] Apply `vue-mcp` for scroll-triggered reveals
- [ ] Animate section entries on scroll
- [ ] Add smooth transitions between sections

### Composables - Profiles

- [ ] Implement single school fetch in `useSchools.ts`
- [ ] Cache profile data in composable state
- [ ] Implement error handling for 404s

### Realtime Features

- [ ] Subscribe to school changes via `supabase-mcp`
- [ ] Listen for trust tier updates
- [ ] Auto-refresh tier badge on changes
- [ ] Handle subscription cleanup on unmount

### Mock Claims

- [ ] Add "Claim School" button
- [ ] Implement auth guard for claim button
- [ ] Log "claimed" action to console
- [ ] Show `UModal` for claim flow
- [ ] Add upload placeholder in modal
- [ ] Update `claimed_by` field (mock)

### Testing

- [ ] Test profile loading
- [ ] Test 404 handling
- [ ] Test realtime subscriptions
- [ ] Test mobile responsive layout
- [ ] Test scroll animations

## Phase 4: AI Matching Journey

### Page Setup

- [ ] Create `app/pages/match.vue`
- [ ] Add page meta tags for SEO
- [ ] Set up multi-step form structure

### Wizard UI

- [ ] Create `UForm` wizard component
- [ ] Implement step navigation
- [ ] Add `nuxt-ui-mcp` stepper animations
- [ ] Create progress indicator

### Step 1: Goals

- [ ] Add `UCheckbox` group for goals (PPL/IR/CPL)
- [ ] Implement multi-select functionality
- [ ] Add validation for at least one goal
- [ ] Add "Next" button navigation

### Step 2: Budget & Schedule

- [ ] Add `UInput` slider for maxBudget (5k-50k range)
- [ ] Display current budget value
- [ ] Add schedule flexibility selector (full-time/part-time)
- [ ] Add weekday/weekend availability options
- [ ] Validate budget range

### Step 3: Location

- [ ] Add `UInput` for zip code entry
- [ ] Add radius slider (10-500 miles)
- [ ] Implement auto-detect via `useGeolocation`
- [ ] Show user location on mini-map
- [ ] Validate zip code format

### Step 4: Preferences

- [ ] Add `USelect` for preferred aircraft
- [ ] Add simulator preference toggle
- [ ] Add G1000 preference toggle
- [ ] Add financing preference options

### Composables - Matching

- [ ] Create `composables/useMatching.ts`
- [ ] Implement candidate pool filtering
- [ ] Filter by budget constraints
- [ ] Filter by location radius with `ST_DWithin`
- [ ] Filter by program goals match
- [ ] Use `useState` for match results persistence

### AI Integration

- [ ] Create `/server/api/match.ts` endpoint
- [ ] Initialize OpenAI/Grok API client
- [ ] Build AI prompt template
- [ ] Pass schools JSON to LLM
- [ ] Pass user inputs JSON to LLM
- [ ] Request ranked IDs array from LLM
- [ ] Request plain-English debrief from LLM
- [ ] Implement scoring algorithm (budget fit × 0.4, geo × 0.3, schedule × 0.3)
- [ ] Handle API errors gracefully
- [ ] Implement fallback ranking logic
- [ ] Sanitize LLM inputs to prevent injection

### Results Display

- [ ] Create ranked results view with `UList`
- [ ] Use `UCard` for each school result
- [ ] Display match score per school
- [ ] Show key matching factors
- [ ] Add "View Profile" links
- [ ] Create `UModal` for AI debrief
- [ ] Display debrief as formatted text
- [ ] Add insights highlighting

### Session Management

- [ ] Save match session to Supabase
- [ ] Store user inputs in JSONB
- [ ] Store ranked school IDs array
- [ ] Store AI debrief text
- [ ] Cache session in composable state
- [ ] Implement session retrieval

### Testing

- [ ] Test wizard navigation
- [ ] Test form validation
- [ ] Test AI API integration
- [ ] Test results display
- [ ] Test session saving
- [ ] Test mobile wizard flow with Playwright

## Phase 5: Auth & Global Features

### Authentication

- [ ] Create `app/pages/login.vue`
- [ ] Create simple `UForm` for credentials
- [ ] Add email input field
- [ ] Add password input field
- [ ] Add "Sign in as Demo" `UButton`
- [ ] Implement Supabase Auth integration
- [ ] Seed demo users in Supabase
- [ ] Add `student@flysch.com` demo user
- [ ] Add `school@flysch.com` demo user
- [ ] Create `plugins/supabase.client.ts`
- [ ] Initialize Supabase client in plugin
- [ ] Track auth state via composable `ref`
- [ ] Implement logout functionality
- [ ] Add auth state persistence

### Global Layout

- [ ] Create `layouts/default.vue`
- [ ] Add `UNavbar` component
- [ ] Create Flysch wing logo/icon
- [ ] Add navigation links (Home/Match/Schools)
- [ ] Implement mobile hamburger menu
- [ ] Animate navigation with `vue-mcp`
- [ ] Add user profile dropdown
- [ ] Display login/logout button
- [ ] Make navbar sticky on scroll

### Theming

- [ ] Configure `app.config.ts` theme
- [ ] Set primary color: `#1E40AF` (sky blue)
- [ ] Set secondary color: `#F59E0B` (runway orange)
- [ ] Set accent color: `#10B981` (verified green)
- [ ] Enable dark mode toggle
- [ ] Style dark mode for "night ops" feel
- [ ] Add Heroicons for aviation motifs
- [ ] Add compass icon
- [ ] Add wing badge icons

### Error Handling

- [ ] Implement global `UToast` system
- [ ] Add "No matches" toast message
- [ ] Add "Try wider radius" suggestion
- [ ] Add error toast for API failures
- [ ] Add success toast for actions
- [ ] Handle network errors
- [ ] Handle auth errors

### 404 Page

- [ ] Create `app/pages/404.vue`
- [ ] Add custom 404 message
- [ ] Add "Return Home" button
- [ ] Style 404 page consistently

### SEO Configuration

- [ ] Add Nuxt meta plugin configuration
- [ ] Create dynamic title template
- [ ] Add school-specific titles: `${school.name} – Flysch Profile`
- [ ] Add meta descriptions
- [ ] Add Open Graph tags
- [ ] Add Twitter Card tags
- [ ] Create sitemap generation

### Mobile Optimization

- [ ] Test all pages with Chrome DevTools
- [ ] Ensure `USelect` full-width on mobile
- [ ] Test touch interactions
- [ ] Verify swipeable cards work
- [ ] Test hamburger menu
- [ ] Optimize tap target sizes
- [ ] Test landscape orientation

## Phase 6: Testing & Optimization

### Unit Tests (Vitest)

- [ ] Set up Vitest configuration
- [ ] Write tests for `useSchools.ts`
- [ ] Test school filtering logic
- [ ] Test geo-query functions
- [ ] Write tests for `useMatching.ts`
- [ ] Test AI prompt generation
- [ ] Test ranking algorithm
- [ ] Write tests for `useTiers.ts`
- [ ] Test tier assignment logic
- [ ] Achieve >80% code coverage on composables

### E2E Tests (Playwright)

- [ ] Set up Playwright configuration
- [ ] Configure mobile viewport emulation
- [ ] Write test: Search and filter flow
- [ ] Write test: School profile navigation
- [ ] Write test: AI matching wizard completion
- [ ] Write test: Login flow
- [ ] Write test: Mobile filter accordion
- [ ] Write test: Swipeable cards
- [ ] Write test: Map interactions
- [ ] Test animation assertions with `vue-mcp`
- [ ] Run tests in CI/CD pipeline

### Performance Optimization

- [ ] Wrap Leaflet maps in `<ClientOnly>`
- [ ] Wrap AI components in `<ClientOnly>`
- [ ] Implement pagination (10 schools per page)
- [ ] Add infinite scroll option
- [ ] Cache LLM responses in composable
- [ ] Use `ref` for memoized results
- [ ] Optimize images with Nuxt Image
- [ ] Lazy load school cards
- [ ] Implement virtual scrolling for large lists
- [ ] Optimize bundle size

### Mobile Testing

- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test filter interactions
- [ ] Test map on mobile
- [ ] Test wizard on mobile
- [ ] Verify touch gestures
- [ ] Test network throttling (Slow 3G)
- [ ] Verify offline behavior

### Accessibility

- [ ] Run Lighthouse accessibility audit
- [ ] Ensure keyboard navigation works
- [ ] Verify screen reader compatibility
- [ ] Add ARIA labels where needed
- [ ] Check color contrast ratios
- [ ] Test with VoiceOver/TalkBack

## Phase 7: Deployment

### Vercel Configuration

- [ ] Connect GitHub repository to Vercel
- [ ] Configure build settings
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `.output`
- [ ] Configure Node.js version

### Environment Variables

- [ ] Add `SUPABASE_URL` to Vercel
- [ ] Add `SUPABASE_ANON_KEY` to Vercel
- [ ] Add `OPENAI_API_KEY` or `GROK_API_KEY` to Vercel
- [ ] Verify environment variables in preview
- [ ] Test environment variables in production

### Production Deployment

- [ ] Deploy to Vercel production: `vercel --prod`
- [ ] Verify deployment successful
- [ ] Test production URL
- [ ] Check all features work in production
- [ ] Verify API routes functioning
- [ ] Test Supabase connection
- [ ] Verify LLM API integration

### Monitoring Setup

- [ ] Enable Supabase logs
- [ ] Monitor database queries
- [ ] Track slow queries
- [ ] Set up Vercel Analytics
- [ ] Track CTR (click-through rate)
- [ ] Track inquiry conversions
- [ ] Track match completion rate
- [ ] Set up error tracking
- [ ] Configure alert notifications

### Documentation

- [ ] Create setup instructions in README
- [ ] Document environment variables
- [ ] Add local development guide
- [ ] Document API endpoints
- [ ] Create deployment guide
- [ ] Add troubleshooting section

## Phase 8: Post-MVP Iteration (Future)

- [ ] Integrate real FSP API
- [ ] Implement advanced embeddings for matching
- [ ] Build full school claims dashboard
- [ ] Add document upload for verification
- [ ] Implement real financing options
- [ ] Add ETL pipeline for school data
- [ ] Build advanced analytics dashboard
- [ ] Implement revenue/monetization features

