# KnowMe – Phase 1
1. Supabase: create project > SQL Editor > run `supabase/schema.sql`.
2. Authentication > Providers: Email on; Google on (needs a Google Cloud OAuth client; add the Supabase callback URL it shows).
3. Authentication > URL Configuration: add http://localhost:3000 and your Vercel URL as redirect URLs.
4. Copy `.env.example` to `.env.local` and fill in the values.
5. `npm install` then `npm run dev` and open http://localhost:3000
6. Deploy: push to GitHub, import into Vercel, add the same 3 env vars.
