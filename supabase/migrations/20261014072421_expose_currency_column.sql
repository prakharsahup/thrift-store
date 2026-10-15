-- Reconciliation only: this was applied directly against the hosted project on 2026-10-14
-- (see commit 38b5d19), as a follow-up to 20261014072313_vendoo_import_currency.sql. The new
-- `currency` column didn't show up over the Data API until PostgREST reloaded its schema cache;
-- re-created here at its real applied version so local migration history matches the hosted
-- project's. No-op if ever run again.

notify pgrst, 'reload schema';
