# Telugu Toon World Giveaways

Giveaway website for the Telugu Toon World Instagram community.

## Local development

This project uses Lovable Cloud for its database and authentication backend.

```sh
bun install
bun run dev
```

## Vercel deployment

The production build is configured for Vercel. Add these environment variables
to the Vercel project for every environment you deploy:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

Use the same backend URL and publishable key configured for this project's
Lovable Cloud backend. Do not add service-role keys to browser or Vercel
environment variables unless a future server-only feature explicitly requires
one.

Vercel settings:

- **Install command:** `bun install`
- **Build command:** `bun run build`
- **Output:** detected automatically by Nitro's Vercel preset