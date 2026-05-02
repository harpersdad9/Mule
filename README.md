# Mule

A mobile marketplace connecting ultra runners with pacers and crew for races.

## Stack

- **React Native + Expo** (Expo Router, file-based routing)
- **Supabase** (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- **Stripe Connect** (marketplace payments, 5% platform fee)
- **Strava OAuth** (profile verification and running stats)
- **UltraSignup API** (race data)

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Fill in your Supabase and Stripe keys
```

### 3. Set up Supabase
- Create a project at [supabase.com](https://supabase.com)
- Install Supabase CLI: `npm install -g supabase`
- Link project: `supabase link --project-ref YOUR_PROJECT_REF`
- Run migrations: `supabase db push`
- Deploy Edge Functions: `supabase functions deploy`
- Set secrets: `supabase secrets set STRIPE_SECRET_KEY=sk_... STRAVA_CLIENT_SECRET=...`

### 4. Run (requires EAS dev build — Stripe needs native modules)
```bash
npx eas build --profile development --platform ios
# Then open the dev build and start the dev server:
npx expo start
```

## Project Structure

```
app/          Expo Router screens
components/   Reusable UI components
hooks/        Custom React hooks
lib/          Supabase, Stripe, Strava, UltraSignup clients
types/        TypeScript types (database + app)
constants/    Theme, colors, config
supabase/     Migrations + Edge Functions
```

## Third-Party Setup Required

| Service | Purpose |
|---|---|
| Supabase | Backend, auth, database |
| Stripe | Marketplace payments (Connect) |
| Strava API | Runner profile verification |
| Expo EAS | iOS + Android builds |
| Apple Developer | App Store distribution |
| Google Play | Android distribution |

See `.env.example` for all required credentials.
