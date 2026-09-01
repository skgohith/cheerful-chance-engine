# Transfer Telugu Toon World to another website

This project can be moved to another domain or subdomain without changing the
application routes. Choose the option that matches what you want.

## Option A: New website, same data (recommended)

Use this when you are moving from the current address to a new Vercel project,
custom domain, or subdomain and want to keep the existing giveaways and admin
account.

1. Push or copy this repository to the account that will host the new website.
2. Import the repository into Vercel and keep the project root at the repository
   root.
3. Add these variables in Vercel under **Settings → Environment Variables**.
   Add them to every environment you will use: **Development**, **Preview**,
   and **Production**.

   ```text
   VITE_SUPABASE_URL=<the existing backend URL>
   VITE_SUPABASE_PUBLISHABLE_KEY=<the existing publishable key>
   SUPABASE_URL=<the existing backend URL>
   SUPABASE_PUBLISHABLE_KEY=<the existing publishable key>
   ```

   Use the same values as the current deployment. Do not put a service-role key
   in the browser or commit any key to this repository.

4. Deploy with the repository's existing settings:
   - Install: `bun install --frozen-lockfile`
   - Build: `bun run build`
5. Add the new full website URL to the backend authentication URL settings.
   Include both the site URL and the reset route, for example:

   ```text
   https://giveaways.example.com
   https://giveaways.example.com/reset-password
   ```

   For a subdomain, use that exact subdomain. Do not use a protected route as
   the callback URL.

6. If using a custom domain, connect it in Vercel and then make one new
   production deployment after the domain is verified.
7. Open the new website and verify `/`, `/past-winners`, `/admin`, and
   `/reset-password`. Sign in at `/admin` with the existing admin account; no
   signup is needed.

This option does not require database exports or imports because both websites
read the same backend.

## Option B: New website and a new backend

Use this only when the new website must have a completely separate database.

1. Create the new backend project.
2. Apply the SQL migrations in this order:

   ```text
   drizzle/migrations/0000_create_giveaway_schema.sql
   drizzle/migrations/0001_add_giveaway_social_links.sql
   drizzle/migrations/0002_preserve_winners_when_deleting_giveaways.sql
   ```

   Apply each file once, in order. The migrations create the tables, public
   views, access rules, duplicate-entry protection, random winner selection,
   and permanent winner snapshots.

3. Export data from the old backend and import it into the new backend in this
   order so foreign keys continue to work:

   ```text
   giveaways
   participants
   winners
   winner_snapshots
   user_roles
   ```

   Preserve the original giveaway IDs when importing. This keeps participant,
   winner, and snapshot relationships intact. Do not import `ip_hash` values
   into any public export or share them outside the backend.

4. Create or invite the admin auth user in the new backend, confirm the email,
   and add an `admin` row for that user's ID in `user_roles`. Auth passwords
   cannot be exported; set a new password through the admin reset flow.
5. Deploy the repository and set all four environment variables to the new
   backend values.
6. Add the new domain and `/reset-password` to the new backend's auth redirect
   allowlist.
7. Test a public entry, admin login, giveaway creation, winner selection, and
   password reset before switching DNS.

## Important transfer notes

- The admin account is intentionally restricted to `germanbro40@gmail.com` in
  the application and server authorization checks. Keep that email when
  transferring, or update the authorization checks together before deploying.
- The public routes are `/`, `/giveaways/<giveaway-id>`, and `/past-winners`.
  The private admin route is `/admin`.
- Do not add SPA rewrite files or a second router. TanStack Start handles direct
  route visits on the supported deployment.
- Never commit `.env`, production keys, exported auth data, or participant
  personal data to the repository.