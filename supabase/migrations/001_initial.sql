create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  company_name text,
  plan text default 'free',
  created_at timestamp default now()
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  type text,
  status text default 'pending',
  expiration_date date,
  created_at timestamp default now()
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  status text,
  issues_count integer default 0,
  risk_score integer,
  analysis_result jsonb,
  created_at timestamp default now()
);

create table requirements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  coverage_type text,
  minimum_amount text,
  required boolean default true,
  created_at timestamp default now()
);
