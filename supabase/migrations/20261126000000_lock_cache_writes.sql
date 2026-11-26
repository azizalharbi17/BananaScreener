-- Lock down cache-table writes (2026-11-26).
-- The initial migration created permissive insert/update policies, which let
-- ANYONE holding the public anon key write rows that the site then displays.
-- All server writes go through writeClient() in lib/supabaseAdmin.js, which
-- uses the service-role key (it bypasses RLS), so no write policy is needed:
-- dropping them makes the anon key read-only while the "*_read" select
-- policies keep visitor reads working. Same fix as BananaMaps'
-- 20260714_lock_cache_writes.sql.

do $$
declare t text;
begin
  foreach t in array array['tokens','token_stats','trending_snapshots','pairs','ohlcv_candles','pair_trades','search_cache']
  loop
    execute format('drop policy if exists "%s_insert" on public.%I', t, t);
    execute format('drop policy if exists "%s_update" on public.%I', t, t);
    -- Defense in depth: remove table-level write grants from the API-facing
    -- roles too, so a future accidentally-permissive policy can't reopen writes.
    execute format('revoke insert, update, delete on public.%I from anon, authenticated', t);
  end loop;
end $$;
