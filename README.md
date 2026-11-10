# ClientDesk

A freelance business management workspace for independent professionals and small service businesses.

ClientDesk brings client records, invoices, expenses, and cash-flow visibility into one focused workspace.

## Product goals

- Manage client relationships and contact details
- Create and track invoices, line items, due dates, and payment status
- Record business expenses and categories
- Review revenue, outstanding invoices, expenses, and net profit
- Keep each account's business data private through Supabase Row Level Security

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL
- Vercel deployment
- Vitest for unit tests

## Local setup

1. Install Node.js 20.9+.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env.local` and add your Supabase project URL and anon key.
4. Run the SQL in `supabase/schema.sql` in the Supabase SQL editor.
5. Start the app: `npm run dev`.

Without Supabase credentials, the app displays a clearly labelled demo workspace. Demo data is local to the browser and is not a substitute for account-backed persistence.

## Environment variables

See `.env.example`. Never commit real credentials.

## Quality checks

- `npm run lint`
- `npm run test`
- `npm run build`

## Security

Database tables use owner-scoped Row Level Security. All production records must be accessed through an authenticated Supabase session. Do not disable RLS.

## Roadmap

- [x] Product foundation and dashboard concept
- [x] Supabase schema with tenant isolation
- [ ] Authentication and persistent CRUD workflows
- [ ] Invoice PDF generation
- [ ] Automated tests and production deployment

## License

MIT
