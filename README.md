<!-- taskers/README.md -->
# Taskers

Location-based marketplace for small physical errands (Bangladesh first). Next.js 15 (App Router) + TypeScript + Tailwind + Supabase (Auth, Postgres, PostGIS).

## Status

Working: email signup (real name + birth date, 18+), profile + private address, Saved Places (max 3) with Google Maps picker,
post task (fee + expenses, city 1 km / village 5 km), nearby notifications, poster searches helpers (radius or area) and
notifies all/selected, offers (accept price or counter), auto-decline of other offers, chat (realtime), terms (expenses + time),
prepay with screenshot, helper confirms payment, timer, extension requests, completion proof photos, poster confirmation,
reviews, reports + admin warn/ban, in-app notifications.

Not built yet: phone OTP, NID verification, web push (in-app notifications only), full upazila list (typed as text for now), escrow.

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

## Make yourself admin (once)

Supabase SQL editor: `insert into public.user_roles(user_id, role) select id, 'admin' from auth.users where email = 'YOUR_EMAIL';`
Then open Profile > Reports.

## Security notes

- Every write goes through audited Postgres functions (`create_task`, `submit_offer`, `mark_paid`, ...). Browsers cannot insert/update tasks, offers, chats or ratings directly.
- Chats are readable by the two people only. An admin can read a chat only after a report exists for it.
- Proof photos live in the private `task-proofs` bucket; only the two parties (or admin with a report) can open them.
- Helpers' exact coordinates are never returned; posters only see distance bands (500 m, 1 km, ...).

- Only the public URL and publishable key are used in the app. Never commit a service_role/secret key.
- Authorization is enforced by Row Level Security and database triggers, not only by UI checks.
- Saved coordinates are readable only by their owner.

## Posting a task: location

Posters do not use GPS or a map. They paste what Google Maps gives them (coordinates, a Plus Code like `H9MV+4W5`, or a Maps link) into one box;
`lib/location-parse.ts` reads it (short Plus Codes use the chosen district's `bd_districts.lat/lng` as reference). Only division, district and upazila are asked.
"Other" in the task type asks for a typed type (`tasks.custom_category`). Migration: `supabase/migrations/20261030000000_post_location_paste_and_custom_category.sql` (already applied).
