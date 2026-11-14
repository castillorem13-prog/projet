-- Nettoyage automatique : à chaque import, les devoirs passés depuis plus de 30 jours sont effacés.
-- (Même fonction que dans 20261114150000_create_homework.sql, avec l'effacement en plus.
--  « create or replace » garde les droits déjà donnés : seuls les élèves connectés peuvent l'appeler.)

create or replace function public.import_homework(items jsonb, today date)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  n_items int;
  n_reviews int;
  n_deleted int;
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

  -- Données minimales : un devoir passé depuis plus de 30 jours ne sert plus, on l'efface.
  delete from public.homework h where h.student_id = me and h.due_date < today - 30;
  get diagnostics n_deleted = row_count;

  return jsonb_build_object('homework', n_items, 'reviews', n_reviews, 'deleted', n_deleted);
end;
$$;
