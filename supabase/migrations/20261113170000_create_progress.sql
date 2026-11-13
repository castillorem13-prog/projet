-- Phase 2 : sauvegarde de la progression de l'élève.
-- Reprend les types de la V1 : `Evidence` et `Review` (src/lib/curriculum/types.ts), `SessionResult` (src/lib/session-result.ts).
-- Pas de points ici : ils viendront en Phase 3, calculés uniquement par le serveur.

-- 1. Une ligne par séance, contrôle blanc ou entraînement terminé.
create table public.session_attempts (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Identifiant tiré au hasard par l'appli pour cette tentative : si l'envoi est répété (réseau coupé,
  -- double clic), la même tentative n'est jamais enregistrée deux fois.
  client_id    uuid not null,
  kind         text not null check (kind in ('session', 'exam', 'entrainement')),
  session_id   text,             -- identifiant de la séance dans le code (vide pour un entraînement)
  unit_id      text not null,    -- chapitre principal
  avg_seconds  numeric(7, 1) check (avg_seconds >= 0),
  completed_at timestamptz not null default now(),
  unique (student_id, client_id)
);

-- 2. Une ligne par exercice fait. Ne se modifie jamais : c'est l'historique de l'élève.
create table public.evidence (
  id            bigint generated always as identity primary key,
  student_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Vide quand l'exercice n'est pas fait dans une séance (automatismes par exemple).
  attempt_id    uuid references public.session_attempts (id) on delete cascade,
  unit_id       text not null,
  item_id       text not null,
  at            timestamptz not null,
  stage         text not null check (stage in ('rappel', 'application', 'transfert', 'extension')),
  result        text not null check (result in ('success', 'partial', 'fail')),
  assistance    smallint not null check (assistance between 0 and 4),
  self_assessed boolean not null default false,
  error_type    text check (error_type in ('conceptuelle', 'procedurale', 'calcul', 'strategique', 'redaction')),
  methods       text[] not null default '{}'
);
create index evidence_student_unit on public.evidence (student_id, unit_id);

-- 3. Le prochain rappel de révision : un seul par élève et par chapitre, remplacé à chaque séance.
create table public.reviews (
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  unit_id    text not null,
  due        date not null,
  reason     text not null check (char_length(reason) <= 300),
  primary key (student_id, unit_id)
);

-- Sécurité : chaque élève ne voit et n'écrit que ses propres lignes.
alter table public.session_attempts enable row level security;
alter table public.evidence enable row level security;
alter table public.reviews enable row level security;

grant select, insert on public.session_attempts to authenticated;
grant select, insert on public.evidence to authenticated;
grant select, insert, update, delete on public.reviews to authenticated;

create policy "Un élève lit ses séances" on public.session_attempts for select to authenticated
  using ((select auth.uid()) = student_id);
create policy "Un élève ajoute ses séances" on public.session_attempts for insert to authenticated
  with check ((select auth.uid()) = student_id);

create policy "Un élève lit ses traces" on public.evidence for select to authenticated
  using ((select auth.uid()) = student_id);
-- Une trace rattachée à une séance doit appartenir à une séance du même élève.
create policy "Un élève ajoute ses traces" on public.evidence for insert to authenticated
  with check (
    (select auth.uid()) = student_id
    and (attempt_id is null or exists (
      select 1 from public.session_attempts a where a.id = attempt_id and a.student_id = (select auth.uid())
    ))
  );

create policy "Un élève lit ses rappels" on public.reviews for select to authenticated
  using ((select auth.uid()) = student_id);
create policy "Un élève ajoute ses rappels" on public.reviews for insert to authenticated
  with check ((select auth.uid()) = student_id);
create policy "Un élève modifie ses rappels" on public.reviews for update to authenticated
  using ((select auth.uid()) = student_id) with check ((select auth.uid()) = student_id);
create policy "Un élève supprime ses rappels" on public.reviews for delete to authenticated
  using ((select auth.uid()) = student_id);

-- Enregistre une séance terminée en une seule fois : la tentative, ses traces et les rappels.
-- Tout ou rien : si une ligne est refusée, rien n'est enregistré. Rejouer le même envoi ne crée pas de doublon.
-- `security invoker` : la fonction tourne avec les droits de l'élève, donc toutes les règles ci-dessus s'appliquent.
create function public.record_attempt(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  attempt uuid;
begin
  if me is null then
    raise exception 'Il faut être connecté.' using errcode = '28000';
  end if;
  if jsonb_array_length(coalesce(payload -> 'evidence', '[]'::jsonb)) > 200 then
    raise exception 'Trop d''exercices dans un seul envoi.' using errcode = '22023';
  end if;

  select a.id into attempt from public.session_attempts a
    where a.student_id = me and a.client_id = (payload ->> 'clientId')::uuid;
  if attempt is not null then
    return attempt; -- déjà enregistré : on ne recommence pas
  end if;

  insert into public.session_attempts (student_id, client_id, kind, session_id, unit_id, avg_seconds)
  values (me, (payload ->> 'clientId')::uuid, payload ->> 'kind', payload ->> 'sessionId', payload ->> 'unitId',
          (payload ->> 'avgSeconds')::numeric)
  returning id into attempt;

  insert into public.evidence (student_id, attempt_id, unit_id, item_id, at, stage, result, assistance, self_assessed, error_type, methods)
  select me, attempt, e ->> 'unitId', e ->> 'itemId', (e ->> 'at')::timestamptz, e ->> 'stage', e ->> 'result',
         (e ->> 'assistance')::smallint, coalesce((e ->> 'selfAssessed')::boolean, false), e ->> 'errorType',
         coalesce(array(select jsonb_array_elements_text(e -> 'methods')), '{}')
  from jsonb_array_elements(coalesce(payload -> 'evidence', '[]'::jsonb)) as e;

  insert into public.reviews (student_id, unit_id, due, reason)
  select me, r ->> 'unitId', (r ->> 'due')::date, r ->> 'reason'
  from jsonb_array_elements(coalesce(payload -> 'reviews', '[]'::jsonb)) as r
  on conflict (student_id, unit_id) do update set due = excluded.due, reason = excluded.reason;

  return attempt;
end;
$$;

revoke execute on function public.record_attempt(jsonb) from public, anon;
grant execute on function public.record_attempt(jsonb) to authenticated;
