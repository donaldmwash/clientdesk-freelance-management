# ClientDesk

A web workspace for freelancers and independent service businesses to keep client records, invoices, and expenses in one place.

**Live application:** https://clientdesk-freelance-management.vercel.app  
**Repository:** https://github.com/donaldmwash/clientdesk-freelance-management

> ClientDesk is an actively developed portfolio project. Review the current limitations below before using it for real business records.

## What it currently does

- Email/password sign-up and sign-in through Supabase Auth
- Authenticated dashboard backed by Supabase PostgreSQL
- Create and view client records
- Create and view invoices linked to an existing client
- Mark an invoice as paid
- Record and view business expenses
- Search the client list
- Display basic collected-revenue, outstanding-invoice, and expense totals
- Isolate account data with PostgreSQL Row Level Security (RLS)

## Technology

- Next.js 15 App Router and React 19
- TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, and `@supabase/ssr`
- Vitest
- GitHub Actions
- Vercel

## Run locally

### Requirements

- Node.js 20 or newer
- npm
- A Supabase project

### 1. Install dependencies

```bash
git clone https://github.com/donaldmwash/clientdesk-freelance-management.git
cd clientdesk-freelance-management
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and provide the public Supabase project URL and anon/publishable key:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
```

Never place a Supabase service-role key in a `NEXT_PUBLIC_*` variable or commit private credentials.

### 3. Set up the database

Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor. This creates the application tables, indexes, and owner-scoped RLS policies.

Keep RLS enabled. For an existing database, review and apply schema changes as migrations rather than blindly rerunning table definitions.

### 4. Configure authentication redirects

In Supabase Authentication URL Configuration:

- Set the Site URL to your local development URL while developing, for example `http://localhost:3000`.
- Add `http://localhost:3000/auth/callback` to the allowed Redirect URLs.
- Add your deployed application's callback URL when configuring the production environment.

### 5. Start the development server

```bash
npm run dev
```

Open http://localhost:3000.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the Vitest suite once |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |

GitHub Actions runs linting, unit tests, and a production build for pushes and pull requests targeting `main`.

## Project structure

```
app/
  auth/callback/       Supabase authentication callback
  dashboard/           Authenticated workspace
  login/               Sign-in and registration
  globals.css          Global styles
  layout.tsx           Root layout and metadata
lib/
  finance.ts           Financial calculation helpers
  finance.test.ts      Unit tests for calculation helpers
  supabase/            Browser and server Supabase clients
supabase/
  schema.sql           Database tables, indexes, and RLS policies
.github/workflows/
  ci.yml               Continuous integration workflow
middleware.ts           Supabase session refresh
```

## Security notes

- The browser uses the Supabase public anon/publishable key; access control must be enforced by database RLS policies.
- Each user's records are intended to be scoped to their authenticated Supabase user ID.
- Do not disable RLS or expose service-role credentials in browser code.
- Before production use, validate tenant ownership across related records, review authorization policies, and test access using separate user accounts.

## Current limitations

- Invoice PDF generation and email delivery are not implemented.
- Editing and deleting client, invoice, and expense records are not yet available in the interface.
- Payment collection and payment-provider integrations are not implemented; marking an invoice paid is a manual record update, not proof of a payment.
- Currency is currently presented as USD in the dashboard.
- Automated end-to-end tests and a full production security review are still required.
- The live deployment depends on correctly configured Supabase environment variables and redirect settings.

## Roadmap

- [ ] Complete tenant-isolation and related-record authorization tests
- [ ] Add editable and deletable records with validation
- [ ] Add invoice line items, PDF generation, and email delivery
- [ ] Add currency-aware reporting and date-range filters
- [ ] Add end-to-end tests for authentication and core workflows
- [ ] Complete production security, accessibility, and deployment verification

## License

MIT
