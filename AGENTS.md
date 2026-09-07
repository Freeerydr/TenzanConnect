# Agent instructions for this repository

This app was originally built in Base44 and has since been migrated off it.
It now runs on **Supabase** (database, auth, file storage) and deploys to
**Netlify** (frontend hosting). There is no live Base44 backend behind this
app anymore — treat any reference to Base44 you find in old comments or the
`legacy-schema-reference/` directory as historical documentation of the original schema, not
as something this app still depends on.

## Architecture

- `src/api/base44Client.js` — kept only as a stable import path (`{ base44 }`)
  for the ~46 files that call `base44.auth.*` / `base44.entities.X.*`. It
  re-exports `src/lib/supabaseCompat.js`, which implements that same
  interface backed by Supabase. This is intentional — don't "fix" it by
  reintroducing the real Base44 SDK.
- `src/lib/supabaseClient.js` / `src/lib/supabaseConfig.js` — the real
  Supabase client and its URL/anon key.
- `src/lib/entityFactory.js` — generic CRUD (list/filter/get/create/update/
  delete/bulkUpdate/subscribe) against any Supabase table, used to build
  each entity in `supabaseCompat.js`.
- `src/lib/AuthContext.jsx` — auth state driven by Supabase Auth sessions.
- `supabase/schema.sql` — the Postgres schema (tables + Row Level Security
  policies), generated from the original `legacy-schema-reference/entities/*.jsonc`
  definitions. Run this in the Supabase SQL Editor to provision a fresh
  project; it is not applied automatically.
- `legacy-schema-reference/entities/*.jsonc` — left in place as reference documentation of
  the original data model and access rules. Not read by the running app.

## Local development

```
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

## Deployment

Deploys to Netlify. `netlify.toml` has the build settings. Set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify's site
environment variables (Site settings → Environment variables) — the app
also has these hardcoded as a fallback in `supabaseConfig.js`, but prefer
env vars for anything beyond this one project.

## Working in this repo

- Keep changes focused on the user's request and preserve existing
  conventions (the `base44.entities.X.method()` call pattern throughout the
  app, Tailwind + shadcn/ui components, etc.).
- If you add a new entity/table, add it to both `supabase/schema.sql` and
  the `ENTITY_TABLES` map in `src/lib/supabaseCompat.js` (or equivalent).
- Do not reintroduce `@base44/sdk` or `@base44/vite-plugin` — both were
  removed as part of the migration.
