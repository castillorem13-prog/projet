-- Devoirs importés depuis ÉcoleDirecte (Pronote plus tard).
-- RÈGLE : aucun identifiant ni mot de passe ÉcoleDirecte n'est jamais stocké ici, ni nulle part côté LearnWard.
-- On garde seulement le cahier de textes utile pour réviser : date, matière, contrôle ou pas, texte du devoir.

create table public.homework (
  id            bigint generated always as identity primary key,
  student_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  source        text not null default 'ecoledirecte' check (source in ('ecoledirecte', 'pronote', 'eleve')),
  -- Identifiant du devoir chez la source : réimporter met à jour la même ligne au lieu de la dupliquer.
  source_id     text not null check (char_length(source_id) <= 100),
  due_date      date not null,
  subject_label text not null check (char_length(subject_label) <= 100),  -- nom de la matière tel qu'écrit par l'école
  subject       text check (char_length(subject) <= 30),                  -- matière de l'appli (SubjectId), vide si inconnue
  unit_id       text check (char_length(unit_id) <= 100),                 -- chapitre reconnu dans la banque, vide sinon
  is_test       boolean not null default false,                           -- contrôle, DS, interrogation
  text          text check (char_length(text) <= 2000),
  done          boolean not null default false,
  imported_at   timestamptz not null default now(),
  unique (student_id, source, source_id)
);
create index homework_student_date on public.homework (student_id, due_date);

-- Tentatives de connexion à ÉcoleDirecte : sert seulement à limiter les essais (5 par quart d'heure),
-- pour ne pas faire bloquer le compte de l'élève et pour qu'on ne puisse pas se servir de LearnWard pour deviner un mot de passe.
create table public.ecoledirecte_attempts (
  id         bigint generated always as identity primary key,
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  at         timestamptz not null default now()
);
create index ecoledirecte_attempts_student_at on public.ecoledirecte_attempts (student_id, at);

alter table public.homework enable row level security;
alter table public.ecoledirecte_attempts enable row level security;

grant select, insert, update, delete on public.homework to authenticated;
grant select, insert on public.ecoledirecte_attempts to authenticated;

create policy "Un élève lit ses devoirs" on public.homework for select to authenticated
  using ((select auth.uid()) = student_id);
create policy "Un élève ajoute ses devoirs" on public.homework for insert to authenticated
  with check ((select auth.uid()) = student_id);
create policy "Un élève modifie ses devoirs" on public.homework for update to authenticated
  using ((select auth.uid()) = student_id) with check ((select auth.uid()) = student_id);
create policy "Un élève supprime ses devoirs" on public.homework for delete to authenticated
  using ((select auth.uid()) = student_id);

create policy "Un élève lit ses tentatives" on public.ecoledirecte_attempts for select to authenticated
  using ((select auth.uid()) = student_id);
create policy "Un élève note ses tentatives" on public.ecoledirecte_attempts for insert to authenticated
  with check ((select auth.uid()) = student_id);

-- Enregistre un import en une seule fois : les devoirs (mis à jour s'ils existent déjà) et, pour chaque contrôle
-- dont le chapitre est reconnu, un rappel de révision deux jours avant (sans repousser un rappel déjà plus proche).
create function public.import_homework(items jsonb, today date)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  n_items int;
  n_reviews int;
begin
  if me is null then
    raise exception 'Il faut être connecté.' using errcode = '28000';
  end if;
  if jsonb_array_length(items) > 300 then
    raise exception 'Trop de devoirs dans un seul import.' using errcode = '22023';
  end if;

  insert into public.homework (student_id, source, source_id, due_date, subject_label, subject, unit_id, is_test, text, done, imported_at)
  select me, 'ecoledirecte', i ->> 'sourceId', (i ->> 'dueDate')::date, i ->> 'subjectLabel', i ->> 'subject', i ->> 'unitId',
         coalesce((i ->> 'isTest')::boolean, false), i ->> 'text', coalesce((i ->> 'done')::boolean, false), now()
  from jsonb_array_elements(items) as i
  on conflict (student_id, source, source_id) do update set
    due_date = excluded.due_date, subject_label = excluded.subject_label, subject = excluded.subject,
    unit_id = excluded.unit_id, is_test = excluded.is_test, text = excluded.text, done = excluded.done,
    imported_at = excluded.imported_at;
  get diagnostics n_items = row_count;

  insert into public.reviews (student_id, unit_id, due, reason)
  select me, t.unit_id, greatest(today, t.due_date - 2),
         left(format('Contrôle de %s le %s : on révise avant.', t.subject_label, to_char(t.due_date, 'DD/MM')), 300)
  from (
    select distinct on (i ->> 'unitId') i ->> 'unitId' as unit_id, (i ->> 'dueDate')::date as due_date, i ->> 'subjectLabel' as subject_label
    from jsonb_array_elements(items) as i
    where coalesce((i ->> 'isTest')::boolean, false) and i ->> 'unitId' is not null and (i ->> 'dueDate')::date >= today
    order by i ->> 'unitId', (i ->> 'dueDate')::date
  ) t
  on conflict (student_id, unit_id) do update set due = excluded.due, reason = excluded.reason
    where public.reviews.due > excluded.due;
  get diagnostics n_reviews = row_count;

  return jsonb_build_object('homework', n_items, 'reviews', n_reviews);
end;
$$;

revoke execute on function public.import_homework(jsonb, date) from public, anon;
grant execute on function public.import_homework(jsonb, date) to authenticated;
