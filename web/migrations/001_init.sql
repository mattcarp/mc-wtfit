create table users (
  id text primary key,
  email text,
  created_at timestamptz not null default now(),
  server_ai_day date,
  server_ai_count int not null default 0
);

-- Everything a person tells us about themselves lives in one encrypted blob.
create table profiles (
  user_id text primary key references users(id) on delete cascade,
  data_enc text not null,
  sensitive_consent_at timestamptz,
  updated_at timestamptz not null default now()
);

create table settings (
  user_id text primary key references users(id) on delete cascade,
  beneficiary_kind text not null default 'default' check (beneficiary_kind in ('default','charity','self')),
  beneficiary_name text,
  beneficiary_url text,
  currency text not null default 'EUR',
  ai_provider text not null default 'server' check (ai_provider in ('server','anthropic','openai','google','openai-compatible')),
  ai_model text,
  ai_base_url text,
  ai_key_enc text,
  updated_at timestamptz not null default now()
);

create table items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  photo_path text,
  photo_mime text,
  name text,
  category text,
  era text,
  confidence int,
  value_low numeric,
  value_high numeric,
  currency text not null default 'EUR',
  verdict text check (verdict in ('keep','build','let_go','retake')),
  headline text,
  reason text,
  result jsonb,
  model text,
  status text not null default 'new' check (status in ('new','kept','listed','sold','donated','discarded')),
  sold_amount numeric,
  beneficiary_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index items_user_created on items (user_id, created_at desc);

create table waitlist (
  email text primary key,
  token text not null,
  source text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
