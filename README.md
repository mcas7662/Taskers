# Taskers

Location-based marketplace for small physical errands (Bangladesh first). Next.js 15 (App Router) + TypeScript + Tailwind + Supabase (Auth, Postgres, PostGIS).

## Status

Working now: email signup/login/logout, session refresh middleware, profile (name, private date of birth),
Saved Places (max 3, enforced in the database), Bangla/English toggle, mobile bottom navigation, PWA manifest.

Not built yet (pages show "Coming soon"): posting tasks, task discovery, offers, chat, payments, reviews,
notifications, admin dashboard, phone OTP, map picker, service worker / web push.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
npm run typecheck
```

## Supabase

Project ref: `niqvzebaymfrnmsqbksc`. The schema was applied as migration `taskers_foundation_v1`
(profiles, profile_private, user_roles, user_saved_locations, locality tables, categories, app_settings, audit log, RLS).
To keep SQL in git: `npx supabase login && npx supabase link --project-ref niqvzebaymfrnmsqbksc && npx supabase db pull`.

In the Supabase dashboard (Authentication > URL Configuration) set Site URL to your deployed URL
and add `http://localhost:3000/auth/callback` and `<your-url>/auth/callback` to Redirect URLs.
If email confirmation is on, users must click the emailed link before they can log in.

## Security notes

- Only the public URL and publishable key are used in the app. Never commit a service_role/secret key.
- Authorization is enforced by Row Level Security and database triggers, not only by UI checks.
- Saved coordinates are readable only by their owner.
