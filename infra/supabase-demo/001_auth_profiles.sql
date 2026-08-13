begin;

create table if not exists public.demo_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Usuario SANA',
  demo_role text not null default 'new_user'
    check (demo_role in ('new_user','producer','technical','investor','admin','visitor')),
  environment text not null default 'DEMO' check (environment = 'DEMO'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.demo_profiles enable row level security;

create policy "demo profile read own"
on public.demo_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "demo profile update own"
on public.demo_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and environment = 'DEMO');

create or replace function public.handle_demo_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.demo_profiles (user_id, display_name, demo_role, environment)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, 'Usuario SANA'), '@', 1)),
    case
      when new.raw_user_meta_data ->> 'demo_role' in ('new_user','producer','technical','investor','admin','visitor')
        then new.raw_user_meta_data ->> 'demo_role'
      else 'new_user'
    end,
    'DEMO'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_demo_user_created() from public;

create or replace trigger on_demo_auth_user_created
after insert on auth.users
for each row execute function public.handle_demo_user_created();

commit;
