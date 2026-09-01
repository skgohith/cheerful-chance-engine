# Telugu Toon World Giveaways

Giveaway website for the Telugu Toon World Instagram community.

## Move the site to another website

The complete transfer checklist is in [`TRANSFER.md`](./TRANSFER.md). In short,
deploy this same repository to the new website, copy the four backend
environment variables, and add the new website URL to the authentication
redirect allowlist. Keeping the same backend preserves all giveaways,
participants, winners, and admin access automatically.

## Local development

This project uses Lovable Cloud for its database and authentication backend.

```sh
bun install
bun run dev
```

## Vercel deployment

The repository includes a Vercel configuration that installs the locked Bun
dependencies and runs the production build. In Vercel, add these environment
variables to **Development**, **Preview**, and **Production** as needed:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

Use the same backend URL and publishable key configured for this project's
Lovable Cloud backend. The `VITE_*` pair is used by the browser; the
`SUPABASE_*` pair is used by server functions, so configure both pairs with
the same values. Do not add service-role keys to browser or Vercel environment
variables unless a future server-only feature explicitly requires one.

Vercel settings:

- **Framework preset:** Vite (or leave it as automatically detected)
- **Install command:** detected from `vercel.json` as `bun install --frozen-lockfile`
- **Build command:** `bun run build`
- **Output:** detected automatically by Nitro's Vercel preset

After saving environment variables, create a new deployment so the server
functions receive the updated values. If a deployment reports a missing
environment variable, check that it was added to the environment selected for
that deployment rather than only to another Vercel environment.

The app uses the browser's current origin for password recovery, so the reset
link automatically points to whichever domain is currently hosting the app.