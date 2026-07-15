-- Minimal stand-in for the parts of Supabase's platform schema (`auth.*`)
-- that the migrations in supabase/migrations/ depend on. This lets CI (and
-- local development, if you don't want the full Supabase CLI/Docker stack)
-- validate the SQL against a plain Postgres instance. Not used in a real
-- Supabase project - there, the real `auth` schema is already provided by
-- the platform.

create extension if not exists pgcrypto;

create schema if not exists auth;

create table auth.users (
  instance_id uuid,
  id uuid primary key default gen_random_uuid(),
  aud text,
  role text,
  email text unique,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  confirmation_token text,
  email_change text,
  email_change_token_new text,
  recovery_token text
);

create table auth.identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  provider_id text,
  identity_data jsonb,
  provider text,
  last_sign_in_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.role() returns text
language sql stable as $$
  select coalesce(current_setting('request.jwt.claim.role', true), 'anon');
$$;

do $$ begin
  create role anon;
  create role authenticated;
  create role service_role;
exception when duplicate_object then null;
end $$;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
