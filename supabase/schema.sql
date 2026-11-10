-- ClientDesk database foundation
create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  company text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date not null,
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue','cancelled')),
  currency char(3) not null default 'USD',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  tax numeric(12,2) not null default 0 check (tax >= 0),
  total numeric(12,2) generated always as (subtotal + tax) stored,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, invoice_number)
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  category text not null default 'General',
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'USD',
  expense_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.expenses enable row level security;

create policy "Clients are private to their owner" on public.clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Invoices are private to their owner" on public.invoices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Expenses are private to their owner" on public.expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Invoice items follow invoice ownership" on public.invoice_items for all
using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()))
with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));

create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists invoices_user_id_due_date_idx on public.invoices(user_id, due_date);
create index if not exists expenses_user_id_expense_date_idx on public.expenses(user_id, expense_date);
