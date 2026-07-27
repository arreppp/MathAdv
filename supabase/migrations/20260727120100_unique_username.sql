-- Registration no longer collects a real email (the frontend derives a
-- synthetic one from the chosen username for Supabase Auth's benefit only),
-- so the username - public.users.name - is now the user-facing identity and
-- needs to be unique. Case-insensitive so "Alex" and "alex" can't coexist.

create unique index users_name_lower_idx on public.users (lower(name));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_role_id bigint;
  v_name text;
begin
  select id into student_role_id from public.roles where name = 'student';

  v_name := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1));

  if exists (select 1 from public.users where lower(name) = lower(v_name)) then
    raise exception 'Username already taken.' using errcode = '23505';
  end if;

  insert into public.users (id, role_id, name)
  values (new.id, student_role_id, v_name);

  insert into public.students (user_id) values (new.id);

  return new;
end;
$$;
