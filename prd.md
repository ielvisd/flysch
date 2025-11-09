# Product Requirements Document (PRD): Flysch – Flight School Marketplace MVP

**Document Version:** 1.3  
**Date:** November 08, 2025  
**Author:** Grok (xAI) – Updated Draft for LLM Implementation Guidance  
**Status:** Final – Incorporating User Feedback

---

## 1. Executive Summary

**Vision:** Flysch is a student-first marketplace that indexes flight schools, normalizes opaque data (e.g., costs, timelines), and builds trust via verification tiers. It empowers prospective pilots to search, compare, match, and convert seamlessly.

**Scope for LLM Build:** This PRD guides an LLM (e.g., Grok or similar) to generate a functional MVP prototype using Nuxt 4 (for SSR/SSG Vue app), Nuxt UI (for accessible, themed components), and Supabase (for auth, DB, realtime). Focus: Core pillars (Search & Compare, School Profiles, Guided Journey) with hybrid data ingestion (real public sources + targeted mocks). Implement AI "training concierge" for smart matching using LLM integration. No full FSP integration or monetization—prioritize demo-ready UI/UX with basic CRUD.

### MVP Goals

- **Indexed ~100 schools** (70% real from FAA/AOPA sources, 30% mocks) with normalized schema.
- **Key flows:** Geo-enabled filter/search → Compare → Profile view → AI-powered matching quiz with debrief.
- **Tech Constraints:** Offline-first where possible; no custom backend beyond Supabase.
- **Success Metrics:** Clickable prototype deployable to Vercel/Netlify; 80% feature coverage per original PRD; mobile-responsive (e.g., touch-friendly filters, stacked cards on small screens).

### Out of Scope (Phase 2)

Financing Hub, full crawling/ETL, school claims dashboard (mock auth only), advanced monetization.

---

## 2. Tech Stack & Setup

### Frontend Framework: Nuxt 4

For hybrid rendering (SSR for SEO on school pages, client-side for interactive filters and AI calls).

#### Directory Structure Best Practices

- **app.vue:** Root layout with Nuxt UI theme wrapper.
- **pages/:** Route-based (e.g., `/` for search, `/schools/[id]` for profiles, `/match` for quiz).
- **components/:** Reusable UI (e.g., `SchoolCard.vue` for comparisons).
- **composables/:** Logic hooks (e.g., `useSchools.ts` for Supabase queries, `useMatching.ts` for AI concierge; `useState` composables for global state like schools cache and matching results).
- **server/api/:** Nitro routes for server-side data fetching (e.g., `/api/schools.ts` for filtered queries) and LLM calls.
- **plugins/:** Supabase client init; optional xAI/Grok API plugin for matching.
- **assets/:** Static assets for aviation icons (e.g., plane SVGs).

### UI Library: Nuxt UI

For rapid, Tailwind-based components.

**Installation:** In `nuxt.config.ts`: `modules: ['@nuxt/ui']`; auto-imports enabled.

**Theming:** Customize in `app.config.ts` (aviation-inspired: `primary: '#1E40AF'` for skies, `secondary: '#F59E0B'` for runways; accents: `#10B981` green for verified tiers. Dark mode toggle for "night ops" feel. Use Heroicons for aviation motifs like compass or wing badges).

#### Key Components

- **Tables** (`Utable`) for multivariate filters/comparisons (sortable, responsive: stack on mobile).
- **Cards** (`Ucard`) for school profiles and comparison views (grid on desktop, vertical stack on mobile).
- **Forms** (`Uform`, `Uinput`, `Uselect`) for guided quiz (stepper for multi-page flow).
- **Badges** (`Ubadge`) for Trust Tiers (e.g., Premier with color-coded variants).
- **Modals** (`Umodal`) for evidence panels or quick inquiries (accessible, full-screen on mobile).
- **Maps:** Integrate `@nuxtjs/leaflet` for geo views (simple markers for school locations).

### Backend: Supabase

For scalable, Postgres-backed services.

**Installation:** `npm i @supabase/supabase-js`; Create plugin: `plugins/supabase.client.ts` with `createClient(supabaseUrl, supabaseKey)`.

#### Services Used

- **Database:** Row Level Security (RLS) for public reads (schools); mock auth for claims.
- **Auth:** Supabase Auth (email/password; mock school logins via seeded users for demo).
- **Realtime:** Subscriptions for live updates (e.g., school claims or tier changes).
- **Storage:** For school photos/fleet images (upload via `Uupload`).
- **Extensions:** Enable PostGIS for geo-queries (e.g., radius searches around user location).

### Other Dependencies

- `@nuxtjs/leaflet` for geo-mapping.
- `@vueuse/nuxt` for utilities (e.g., `useLocalStorage` for quiz state, `useGeolocation` for user location).
- `@xai/grok-sdk` or `openai` for LLM integration (AI matching/debrief).
- **TypeScript:** Full enforcement for schema safety.
- **Dev Tools:** ESLint, Prettier; Testing: Vitest for units (e.g., matching logic); Playwright for E2E (mobile viewport tests).

### Step 0: Upfront Installations (Required for Entire Build Process)

Install the following tools/modules immediately after project init and use them consistently throughout development, testing, and debugging:

- **vue-mcp:** `npm i vue-mcp` – For Vue-specific motion/control primitives (e.g., animations in matching results, transitions for modals).
- **nuxt-ui-mcp:** `npm i nuxt-ui-mcp` – Nuxt UI extension for advanced component props and MCP (Motion Control Primitives) integration (e.g., smooth filter expansions, responsive card flips).
- **playwright:** `npm i -D @playwright/test` – For automated E2E testing (run `npx playwright test` after each feature; include mobile emulation scripts).
- **chrome-devtools:** Ensure Chrome DevTools is available (browser extension or via VS Code; use for real-time debugging of responsive layouts, network calls, and geo-map rendering).
- **supabase-mcp:** `npm i supabase-mcp` – Supabase extension for MCP (Managed Control Plane) features (e.g., enhanced realtime subscriptions with motion-synced UI updates, streamlined auth flows).

**Integrate these in workflows:** e.g., Use `vue-mcp`/`nuxt-ui-mcp` for all animated elements; Playwright for CI/CD tests; Chrome DevTools for manual mobile sim; `supabase-mcp` for all DB interactions.

#### Project Init Command

```bash
npx nuxi@latest init flysch && cd flysch && npm i @nuxt/ui @supabase/supabase-js @vueuse/nuxt @nuxtjs/leaflet openai vue-mcp nuxt-ui-mcp supabase-mcp && npm i -D @playwright/test && npx supabase init && supabase db extension enable postgis
```

---

## 3. Architecture Overview

### High-Level Flow

- **Data Layer:** Supabase Postgres schema (see Section 4). Seed with hybrid data via server route (real fetches + mocks).
- **App Layer:** Nuxt pages fetch via composables (e.g., `const { data: schools } = await $fetch('/api/schools?lat=40.7128&lng=-74.0060&radius=100')`).
- **UI Layer:** Nuxt UI components render normalized data (e.g., cost bands as `Uprogress` bars; geo-map with radius overlay). Leverage `vue-mcp`/`nuxt-ui-mcp` for smooth interactions.
- **Logic Layer:** Composables handle AI matching (LLM prompt for ranking + debrief) and geo-filters, with `supabase-mcp` for optimized queries. Use Vue composables (e.g., `useState`, `ref`/`reactive`) for all state management (e.g., cached schools, matching results).
- **Deployment:** Vercel (auto-deploys from GitHub); Supabase project linked via env vars (add `GROK_API_KEY` or `OPENAI_KEY`).

### Data Flow Diagram (Textual)

```
User Input (Geo-Filters/Quiz) → Composables (useSchools, useMatchAI) → Supabase Queries + LLM Call → Normalized/AI Results → Nuxt UI Render (Cards/Map)
                                  ↕ (Realtime)
               Supabase Realtime (Updates) → Composables State Refresh → UI Re-render
```

### Security

RLS policies: Public `SELECT` on schools; `INSERT`/`UPDATE` requires mock auth. Sanitize LLM inputs to prevent injection.

---

## 4. Data Model (Supabase Schema)

Use Supabase Dashboard or migrations to create tables. Enforce with JSONB for flexible fields (e.g., inclusions array). Enable PostGIS for geo (add geometry column). Use `supabase-mcp` for schema management.

### Core Tables

#### schools (Primary)

```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location GEOMETRY(POINT, 4326),  -- PostGIS point for lat/lng; fallback JSONB {lat: float, lng: float, address: string}
  programs JSONB[],  -- [{type: 'PPL', minCost: 8000, maxCost: 12000, inclusions: ['aircraft'], minMonths: 3, maxMonths: 6, minHours: {part61: 40, part141: 35}}]
  fleet JSONB,  -- {aircraft: [{type: 'Cessna 172', count: 2}], simulators: boolean}
  instructors_count INTEGER,
  trust_tier TEXT CHECK (trust_tier IN ('Premier', 'Verified', 'Community', 'Unverified')),  -- 🥇 etc. as display
  fsp_signals JSONB,  -- {avgHoursToPPL: 62.5, cancellationRate: 8.5, fleetUtilization: 75} (mock for MVP)
  verified_at TIMESTAMP,
  claimed_by UUID REFERENCES auth.users(id),  -- Mock for demo
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schools_location ON schools USING GIST (location);  -- For geo queries
```

**Indexes:** GIN on programs; GIST on location.

**Seed:** ~100 rows (e.g., 50 real from FAA Part 142 and AOPA directories, 50 mocks). Examples: Embry-Riddle Aeronautical University (FL), FlightSafety International (various).

#### users (Supabase Auth Extension)

Extend with profile (`role: 'student' | 'school'`; mock seeded users like `'demo@school.com'`).

#### inquiries (For conversions)

```sql
CREATE TABLE inquiries (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools(id),
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('inquiry', 'tour', 'discovery_flight')),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### match_sessions (For quiz/AI state)

```sql
CREATE TABLE match_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  inputs JSONB,  -- {maxBudget: 15000, goals: ['PPL'], preferredAircraft: 'Cessna', location: {lat: 40.7128, lng: -74.0060, radius: 100}}
  ranked_schools UUID[],
  debrief TEXT,  -- AI-generated plain-English summary
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Normalization Rules

Composables parse JSONB into typed objects (e.g., cost band as `{min, max}`). Geo: Use `ST_DWithin` for radius queries (e.g., 100km).

---

## 5. Feature Implementation Guide

### A. Search & Compare (Priority 1)

**Page:** `/` (`app/pages/index.vue`).

**UI:** `Uinput` for text search; `Uselect` multi for filters (program: PPL/IR/CPL; budget band: <10k/10-15k/>15k; financing: VA/lender; training type: Part 61/141; fleet: Cessna/G1000/sim). Geo: `Uinput` for zip/radius, render `Umap` with markers (zoom to user location via `useGeolocation`). Use `nuxt-ui-mcp` for animated filter transitions.

**Logic:** `Composables/useSchools.ts`: Supabase query with filters + geo (e.g., `.select().ilike('name', '%query%').st_dwithin('location', userPoint, radius * 1000)` via `supabase-mcp`). Render responsive `Utable`/grid of `Ucard` (side-by-side on desktop: name, cost band as `Uchip`, timeline, tier badge, map pin). Manage filtered schools state via reactive `ref` in composable.

**Nuxt UI Tip:** `Utable` with pagination; mobile: Accordion for filters, swipeable cards (test with Playwright/Chrome DevTools).

### B. School Profiles (Priority 1)

**Page:** `/schools/[id].vue` (dynamic route).

**UI:** Hero `Ucard` with name/geo-map (Leaflet cluster for fleet). Sections: Programs (`Ucollapse` accordion), Fleet (`Ulist` with icons), Evidence Panel (`Ualert variant="info"` with tier, verified facts, timestamp). Reviews: Mock `Uavatar` list. Apply `vue-mcp` for scroll-triggered reveals.

**Logic:** Fetch single school; mock claim button (auth guard, logs "claimed" to console). Cache profile in composable state.

**Realtime:** Subscribe to school for live tier refreshes via `supabase-mcp`.

### C. Guided Journey (Priority 1 – AI-Enhanced)

**Page:** `/match` (multi-step form).

**UI:** `Uform` wizard (steps: 1. Goals (`Ucheckbox`: PPL/IR/CPL); 2. Budget/Schedule (`Uinput` sliders: maxBudget 5k-50k, flexibility: full/part-time); 3. Location (`Uinput` zip + radius slider; auto-detect via geolocation); 4. Preferences (`Uselect`: aircraft/sim). Results: Ranked `Ulist` of `Ucard` with scores; `Umodal` for AI debrief. Use `nuxt-ui-mcp` for stepper animations.

**Logic:** `Composables/useMatching.ts`: Candidate pool: Filter Supabase by hard constraints (budget, location radius, goals match) with `supabase-mcp`.

**AI Concierge:** LLM call (e.g., OpenAI/Grok API) with prompt: "Rank these [schools JSON] for user [inputs JSON]. Output: ranked IDs array + plain-English debrief (e.g., 'School A is 12–18% faster for PPL due to weekday slots and G1000 fleet')." Score via embeddings (cosine sim on goals/preferences) + rules (budget fit × 0.4, geo dist × 0.3, schedule match × 0.3).

Save session to Supabase; display debrief as generated text. Persist quiz state and results via reactive composables (e.g., `useState('matchResults')`).

**AI Match Factors (Per Original PRD):** Inputs: `maxBudget`, `trainingGoals` ['PPL'], `preferredAircraft` ['Cessna'], `scheduleFlexibility` ['weekday'], `locationRadius`. Map to schools: e.g., if `school.programs[0].minCost <= maxBudget && ST_DWithin(location, userLoc, radius)`.

### D. Data Integrity & Seeding (Setup Task)

**Server Route:** `/server/api/seed.ts` – POST to insert hybrid data. Fetch reals via `fetch()` from sources (e.g., parse FAA Part 142 PDF text or AOPA CSV if available; examples: Embry-Riddle (Daytona Beach, FL; programs: PPL/IR; est. cost 10k-15k); FlightSafety (various; simulators: yes)). Augment with mocks (vary per PRD: costs 8k-15k bands, hours 40-70, FSP signals 60-80% util). Normalize on insert (e.g., parse inclusions) using `supabase-mcp`.

**Tiers Logic:** `Composables/useTiers.ts`: Rule-based for MVP (e.g., if `fsp_signals.utilization > 75`, 'Premier'; if `programs.length > 3`, 'Verified'). Timestamp all fields.

**Anomaly Check:** Validate on insert (e.g., `cost > 5000 && cost < 50000`; flag outliers).

### E. Auth & Claims (Mock – Priority 2)

**Pages:** `/login` (simple `Uform` for demo creds: `student@flysch.com` / `school@flysch.com`).

**UI:** `Ubutton` for "Sign in as Demo"; mock claim flow (`Umodal` upload placeholder, updates `claimed_by`).

**Logic:** Supabase auth; seeded mock users. No real verification—console-log actions (debug with Chrome DevTools). Track auth state via composable `ref`.

### Global Features

- **Layout:** `layouts/default.vue` with `Unavbar` (logo: Flysch wing icon, links: Home/Match/Schools; mobile hamburger). Animate nav with `vue-mcp`.
- **Error Handling:** Global `Utoast` (e.g., "No matches—try wider radius"); 404 for invalid schools.
- **SEO:** Nuxt meta (title: `${school.name} – Flysch Profile | Trusted Flight Training`).
- **Mobile:** Test via Chrome DevTools/Playwright; ensure `Ucomponents` responsive (e.g., `Uselect` dropdown full-width).

---

## 6. Development & Testing Guidelines for LLM

**Code Gen Style:** TypeScript-first; Single-file components (<200 LOC); JSDoc for composables (e.g., `/** @param radiusKm number */`). Use Vue composables exclusively for state (e.g., `const schools = useState('schools', () => ref([]))`; `reactive` for local, `useState` for global).

**Phased Build:**
1. Scaffold + Seed
2. Search/Profiles + Geo
3. AI Matching + Auth Mock

Use Playwright after each phase; debug with Chrome DevTools.

**Testing:** Vitest for units (e.g., test AI prompt output, geo query); Playwright for E2E (e.g., mobile filter flow, debrief render; include `vue-mcp` animation assertions).

**Performance:** `<ClientOnly>` for maps/AI; Paginate lists (10/school page); Cache LLM responses in composable state (e.g., `ref` for memoized results).

**Output Format:** LLM should generate individual code files (e.g., `app/pages/index.vue`, `composables/useSchools.ts`) suitable for direct pasting into Cursor editor within the existing project folder. Include a README snippet with setup/run instructions.

---

## 7. Deployment & Next Steps

**Deploy:** `vercel --prod`; Env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY` (or `GROK_API_KEY`).

**Monitoring:** Supabase logs; Vercel analytics for CTR/inquiries/match completions.

**Iteration:** Post-MVP: Real FSP API, advanced embeddings for matching, full claims with doc uploads.

---

This PRD aligns with the original marketplace spec, emphasizing smart AI matching, real-data seeding, and mobile/geo polish for a robust MVP. Ready for LLM code gen—let's build!

