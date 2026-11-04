-- Phase 1 : profil de chaque élève.
-- Reprend le type `Profile` de src/lib/content/mock.ts (sauf `levels`, `streak`, `under15`, `parentEmail`, `entLinked` :
-- ils seront calculés ou gérés par d'autres tables plus tard).
-- Un profil = un compte Supabase Auth. Supprimer le compte supprime le profil.

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  pseudo          text not null check (char_length(pseudo) between 2 and 20),
  grade           text not null check (grade in ('6e', '5e', '4e', '3e', '2nde', '1re', 'Tle')),
  -- Seulement l'année : sert à savoir si l'élève a moins de 15 ans (accord parental). Pas de date complète.
  birth_year      integer check (birth_year between 2000 and 2025),
  -- Langue vivante B, spécialités, options (type `Track` de la V1).
  track           jsonb not null default '{"lvb": "espagnol", "specialties": [], "options": []}'::jsonb,
  passions        text[] not null default '{}',
  muted_passions  text[] not null default '{}',
  custom_passions jsonb not null default '[]'::jsonb,
  vary            boolean not null default true,
  -- Thème, couleur, son... (type `Settings` de la V1), synchronisés entre les appareils de l'élève.
  settings        jsonb not null default '{}'::jsonb,
  onboarded       boolean not null default false,
  created_at      timestamptz not null default now()
);

comment on table public.profiles is 'Profil élève. Une ligne par compte. Données minimales : pas de nom réel, pas de date de naissance complète.';

-- Sécurité : la RLS bloque tout par défaut, puis on autorise seulement ce qui suit.
alter table public.profiles enable row level security;

-- Les nouvelles tables ne sont pas exposées automatiquement (réglage du projet) : on donne l'accès explicitement,
-- et seulement aux utilisateurs connectés. Pas de suppression depuis l'appli (elle passera par le serveur).
grant select, insert, update on public.profiles to authenticated;

create policy "Un élève lit son propre profil"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Un élève crée son propre profil"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Un élève modifie son propre profil"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
