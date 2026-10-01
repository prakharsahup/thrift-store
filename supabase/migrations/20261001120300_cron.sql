-- Release expired checkout holds every 5 minutes (CLAUDE.md §4). Between runs, expired holds
-- already read as available (effective_status) and can be re-reserved (reserve_products).

create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- cron.schedule with an existing name updates that job, so re-running this is safe.
select cron.schedule(
  'release-expired-reservations',
  '*/5 * * * *',
  $$select public.release_expired_reservations()$$
);
