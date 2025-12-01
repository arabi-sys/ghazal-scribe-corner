create table public.exchange_books (
  id uuid not null default gen_random_uuid() primary key,
  depositor_id uuid not null,
  title text not null,
  author text not null,
  isbn text,
  condition text not null,
  description text,
  image_url text,
  status text not null default 'pending_approval',
  price numeric not null default 5.00,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.exchange_transactions (
  id uuid not null default gen_random_uuid() primary key,
  book_id uuid not null references public.exchange_books(id) on delete cascade,
  user_id uuid not null,
  transaction_type text not null,
  status text not null default 'pending_approval',
  loan_due_date timestamp with time zone,
  returned_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.exchange_books enable row level security;
alter table public.exchange_transactions enable row level security;