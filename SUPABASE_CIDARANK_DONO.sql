-- CIDARANK V5 - PAINEL DO DONO / ADMIN + BANNER NACIONAL
-- Execute este arquivo UMA VEZ no Supabase > SQL Editor.
-- Ele e idempotente: pode ser executado novamente sem duplicar tabelas/colunas.

begin;

-- 1) Campos administrativos dos perfis
alter table if exists public.profiles add column if not exists role text default 'user';
alter table if exists public.profiles add column if not exists verified boolean default false;
alter table if exists public.profiles add column if not exists is_suspended boolean default false;

-- 2) Campos usados pelo painel de suporte
alter table if exists public.daquitop_support_tickets add column if not exists admin_response text;
alter table if exists public.daquitop_support_tickets add column if not exists status text default 'aberto';
alter table if exists public.daquitop_support_tickets add column if not exists updated_at timestamptz default now();

-- 3) Configuração global do CIDARANK (banner nacional)
create table if not exists public.cidarank_site_settings (
  key text primary key,
  value text not null,
  updated_by uuid null references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.cidarank_site_settings(key,value)
values ('national_banner','/cidarank-national-banner.png')
on conflict (key) do nothing;

-- 4) Funções de segurança: dono e administradores
create or replace function public.cidarank_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt()->>'email','')) = 'joaopedrorodriguesdasilvagomes@gmail.com';
$$;

create or replace function public.cidarank_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.cidarank_is_owner()
     or exists (
       select 1 from public.profiles p
       where p.id = auth.uid()
         and lower(coalesce(p.role,'user')) in ('owner','admin')
         and coalesce(p.is_suspended,false) = false
     );
$$;

grant execute on function public.cidarank_is_owner() to authenticated, anon;
grant execute on function public.cidarank_is_admin() to authenticated;

-- 5) RLS da configuração global
alter table public.cidarank_site_settings enable row level security;
drop policy if exists "cidarank_settings_public_read" on public.cidarank_site_settings;
create policy "cidarank_settings_public_read"
on public.cidarank_site_settings for select
using (true);

drop policy if exists "cidarank_settings_owner_insert" on public.cidarank_site_settings;
create policy "cidarank_settings_owner_insert"
on public.cidarank_site_settings for insert
to authenticated
with check (public.cidarank_is_owner());

drop policy if exists "cidarank_settings_owner_update" on public.cidarank_site_settings;
create policy "cidarank_settings_owner_update"
on public.cidarank_site_settings for update
to authenticated
using (public.cidarank_is_owner())
with check (public.cidarank_is_owner());

-- 6) Permissões administrativas adicionais.
-- As políticas abaixo SOMAM às políticas que o seu projeto já possui.
alter table if exists public.profiles enable row level security;
drop policy if exists "cidarank_admin_profiles_select" on public.profiles;
create policy "cidarank_admin_profiles_select"
on public.profiles for select
to authenticated
using (public.cidarank_is_admin());

drop policy if exists "cidarank_admin_profiles_update" on public.profiles;
create policy "cidarank_admin_profiles_update"
on public.profiles for update
to authenticated
using (public.cidarank_is_admin())
with check (public.cidarank_is_admin());

alter table if exists public.posts enable row level security;
drop policy if exists "cidarank_admin_posts_select" on public.posts;
create policy "cidarank_admin_posts_select"
on public.posts for select
to authenticated
using (public.cidarank_is_admin());

drop policy if exists "cidarank_admin_posts_delete" on public.posts;
create policy "cidarank_admin_posts_delete"
on public.posts for delete
to authenticated
using (public.cidarank_is_admin());

alter table if exists public.businesses enable row level security;
drop policy if exists "cidarank_admin_businesses_select" on public.businesses;
create policy "cidarank_admin_businesses_select"
on public.businesses for select
to authenticated
using (public.cidarank_is_admin());

alter table if exists public.daquitop_support_tickets enable row level security;
drop policy if exists "cidarank_admin_tickets_select" on public.daquitop_support_tickets;
create policy "cidarank_admin_tickets_select"
on public.daquitop_support_tickets for select
to authenticated
using (public.cidarank_is_admin());

drop policy if exists "cidarank_admin_tickets_update" on public.daquitop_support_tickets;
create policy "cidarank_admin_tickets_update"
on public.daquitop_support_tickets for update
to authenticated
using (public.cidarank_is_admin())
with check (public.cidarank_is_admin());

commit;
