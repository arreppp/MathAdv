-- Auth provisioning: every new auth.users row gets a public.users profile and,
-- by default, a public.students row (public self-registration is always a
-- student in the original app - see AuthController@register). Teacher/admin
-- accounts are provisioned separately via public.provision_teacher /
-- direct role_id updates, same as the Laravel side (seeded or admin-created).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_role_id bigint;
begin
  select id into student_role_id from public.roles where name = 'student';

  insert into public.users (id, role_id, name)
  values (
    new.id,
    student_role_id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );

  insert into public.students (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Promotes an existing user (already provisioned as a student by the trigger
-- above) to a teacher: flips role_id and creates the teachers row. Intended
-- to be called with the service role key from an admin script, matching how
-- the Laravel app has no public teacher self-registration route either.
create or replace function public.provision_teacher(p_user_id uuid, p_school text default null, p_bio text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  teacher_role_id bigint;
begin
  select id into teacher_role_id from public.roles where name = 'teacher';

  update public.users set role_id = teacher_role_id where id = p_user_id;
  delete from public.students where user_id = p_user_id;

  insert into public.teachers (user_id, school, bio)
  values (p_user_id, p_school, p_bio)
  on conflict (user_id) do update set school = excluded.school, bio = excluded.bio;
end;
$$;
