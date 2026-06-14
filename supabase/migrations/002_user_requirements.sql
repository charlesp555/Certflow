create table if not exists user_requirements (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  requirements jsonb not null default '[]'::jsonb,
  updated_at timestamp default now()
);
