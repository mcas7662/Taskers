-- Taskers: paste-based task location + custom "other" category text
-- 1) district reference points (used to expand short Google Plus Codes like "H9MV+4W5")
-- 2) tasks.custom_category (what the poster typed when choosing "Other")
-- 3) create_task: no post office / village any more, adds p_custom_category

alter table public.bd_districts add column if not exists lat double precision;
alter table public.bd_districts add column if not exists lng double precision;

update public.bd_districts d set lat = v.lat, lng = v.lng
from (values
  (1,22.58,89.97),(2,22.36,90.33),(3,22.64,90.20),(4,22.19,90.65),(5,22.70,90.37),(6,22.15,90.12),
  (7,22.85,92.30),(8,22.87,91.10),(9,22.94,90.84),(10,23.12,91.98),(11,23.02,91.40),(12,21.40,92.00),
  (13,23.46,91.18),(14,22.40,91.95),(15,23.23,90.65),(16,23.95,91.11),(17,21.80,92.30),
  (18,24.25,89.92),(19,23.22,90.35),(20,23.75,89.65),(21,23.92,90.72),(22,23.62,90.50),(23,23.54,90.53),
  (24,23.86,90.00),(25,23.17,90.20),(26,24.43,90.78),(27,23.00,89.83),(28,24.00,90.42),(29,23.60,89.84),(30,23.81,90.41),
  (31,22.32,89.10),(32,23.17,89.50),(33,23.76,88.63),(34,23.49,89.42),(35,23.90,89.12),(36,22.50,89.50),
  (37,23.54,89.17),(38,23.17,89.21),(39,23.64,88.85),(40,22.55,89.80),
  (41,25.02,90.02),(42,24.87,90.73),(43,24.75,90.40),(44,24.95,89.85),
  (45,24.45,89.70),(46,24.37,88.60),(47,24.00,89.25),(48,24.60,88.27),(49,24.42,88.99),(50,24.80,88.95),(51,25.10,89.02),(52,24.85,89.37),
  (53,26.03,88.46),(54,25.75,89.25),(55,26.33,88.55),(56,25.93,88.85),(57,25.92,89.45),(58,25.80,89.65),(59,25.33,89.53),(60,25.63,88.64),
  (61,24.90,91.87),(62,25.07,91.40),(63,24.48,91.77),(64,24.38,91.42)
) as v(id, lat, lng)
where d.id = v.id;

alter table public.tasks add column if not exists custom_category text;
alter table public.tasks drop constraint if exists tasks_custom_category_len;
alter table public.tasks add constraint tasks_custom_category_len check (custom_category is null or char_length(custom_category) between 2 and 80);

drop function if exists public.create_task(integer, text, text, text, text, text, double precision, double precision, integer, integer, text, text, text, text, integer, integer, text, boolean, integer);

create or replace function public.create_task(
  p_category_id integer, p_title text, p_description text, p_place_name text, p_place_address text,
  p_google_place_id text, p_latitude double precision, p_longitude double precision,
  p_division_id integer, p_district_id integer, p_upazila_name text, p_area_type text,
  p_task_fee integer, p_expense_estimate integer, p_expense_note text, p_permission_confirmed boolean,
  p_expires_hours integer default 72, p_custom_category text default null
) returns uuid
language plpgsql security definer set search_path to ''
as $function$
declare
  v_me uuid := (select auth.uid()); v_id uuid; v_radius int; v_min int; v_max int; v_max_exp int; v_open int; v_cap int;
  v_lim jsonb; v_cat public.task_categories; v_match jsonb; v_custom text := nullif(btrim(coalesce(p_custom_category, '')), '');
begin
  perform public.assert_can_transact();
  select value into v_lim from public.app_settings where key = 'limits';
  v_min := coalesce((v_lim ->> 'min_fee')::int, 10); v_max := coalesce((v_lim ->> 'max_fee')::int, 50000);
  v_max_exp := coalesce((v_lim ->> 'max_expense')::int, 100000);
  if p_task_fee is null or p_task_fee < v_min or p_task_fee > v_max then raise exception 'invalid_amount'; end if;
  if coalesce(p_expense_estimate, 0) < 0 or coalesce(p_expense_estimate, 0) > v_max_exp then raise exception 'invalid_amount'; end if;
  if p_area_type not in ('urban', 'rural') then raise exception 'invalid_input'; end if;
  if p_latitude not between 20.5 and 26.8 or p_longitude not between 87.9 and 92.8 then raise exception 'out_of_area'; end if;
  if char_length(btrim(coalesce(p_title, ''))) < 3 or char_length(btrim(coalesce(p_description, ''))) < 5 then raise exception 'invalid_input'; end if;
  if char_length(btrim(coalesce(p_place_name, ''))) < 2 then raise exception 'invalid_input'; end if;
  if coalesce(p_expires_hours, 72) not between 1 and 168 then raise exception 'invalid_input'; end if;

  select * into v_cat from public.task_categories where id = p_category_id and is_active;
  if not found then raise exception 'invalid_input'; end if;
  if v_cat.requires_institution_permission and not coalesce(p_permission_confirmed, false) then raise exception 'permission_required'; end if;
  -- "Other" needs the poster's own words; other categories ignore the field
  if v_cat.slug = 'other' then
    if v_custom is null or char_length(v_custom) < 2 or char_length(v_custom) > 80 then raise exception 'invalid_input'; end if;
  else
    v_custom := null;
  end if;

  select count(*) into v_open from public.tasks where poster_id = v_me and status = 'open' and expires_at > now();
  if v_open >= coalesce((v_lim ->> 'max_open_tasks')::int, 10) then raise exception 'too_many_open'; end if;

  select value into v_match from public.app_settings where key = 'matching';
  v_radius := case when p_area_type = 'rural' then coalesce((v_match ->> 'rural_radius_m')::int, 5000)
                   else coalesce((v_match ->> 'urban_radius_m')::int, 1000) end;
  v_cap := coalesce((v_match ->> 'max_results')::int, 50);

  insert into public.tasks(poster_id, category_id, custom_category, title, description, place_name, place_address, google_place_id,
    latitude, longitude, division_id, district_id, upazila_name, area_type, notify_radius_m,
    task_fee, expense_estimate, expense_note, permission_confirmed, expires_at)
  values (v_me, p_category_id, v_custom, btrim(p_title), btrim(p_description), btrim(p_place_name), nullif(btrim(p_place_address), ''),
    nullif(btrim(p_google_place_id), ''), p_latitude, p_longitude, p_division_id, p_district_id,
    nullif(btrim(p_upazila_name), ''), p_area_type, v_radius,
    p_task_fee, coalesce(p_expense_estimate, 0), nullif(btrim(p_expense_note), ''), coalesce(p_permission_confirmed, false),
    now() + make_interval(hours => coalesce(p_expires_hours, 72)))
  returning id into v_id;

  update public.profiles set tasks_posted_count = tasks_posted_count + 1 where id = v_me;
  perform public._invite_matches(v_id, v_me, null, v_radius, null, null, v_cap);
  return v_id;
end $function$;

revoke all on function public.create_task(integer, text, text, text, text, text, double precision, double precision, integer, integer, text, text, integer, integer, text, boolean, integer, text) from public, anon;
grant execute on function public.create_task(integer, text, text, text, text, text, double precision, double precision, integer, integer, text, text, integer, integer, text, boolean, integer, text) to authenticated, service_role;
