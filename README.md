# Tenzan Connect

Member profiles, attendance, and communication for Tenzan Jiu-Jitsu.

Originally built in Base44, now running independently on **Supabase**
(database, auth, file storage) and **Netlify** (hosting). See
`MIGRATION_NOTES.md` for the history of that migration and remaining
follow-up items.

## Setup

```
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project's URL and anon/public key
(Supabase dashboard → Settings → API).

## Local development

```
npm run dev
```

## Database

The schema (tables + Row Level Security policies) lives in
`supabase/schema.sql`. Run it in your Supabase project's SQL Editor to set
up a fresh database.

## Deployment

This deploys to Netlify. Build settings live in `netlify.toml`. Set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Netlify's Site
settings → Environment variables.

## Project structure notes

- `src/api/base44Client.js` — a compatibility shim, not the real Base44 SDK.
  See `AGENTS.md` for why this exists and why it's intentional.
- `legacy-schema-reference/entities/*.jsonc` — kept as reference documentation of the
  original data model; not used at runtime.
