// DB-first store with stale-while-revalidate semantics.
//
// Reads never touch GeckoTerminal. A row is "fresh" while updated_at is
// younger than its TTL; stale rows are still served and a background refresh
// is scheduled. refresh_started_at is the per-row cooldown: claimRefresh()
// only succeeds once per TTL window per row, across all server instances.
import { requireSupabase, writeClient } from "@/lib/supabaseAdmin";

export const KINDS = {
  trending: { table: "trending_snapshots", keys: ["network", "page"], payload: "snapshot", ttlMs: 120_000 },
  stats: { table: "token_stats", keys: ["network", "address"], payload: "raw", ttlMs: 60_000 },
  metadata: { table: "tokens", keys: ["network", "address"], payload: "info", ttlMs: 86_400_000 },
  pairs: { table: "pairs", keys: ["network", "token_address"], payload: "pools", ttlMs: 60_000 },
  ohlcv: { table: "ohlcv_candles", keys: ["network", "pool_address", "timeframe", "aggregate"], payload: "candles", ttlMs: 60_000 }, // 60s so the live pool chart (30s client poll) sees fresh candles
  trades: { table: "pair_trades", keys: ["network", "pool_address"], payload: "trades", ttlMs: 60_000 },
  search: { table: "search_cache", keys: ["query", "page"], payload: "results", ttlMs: 300_000 },
};

function kindConfig(kind) {
  const cfg = KINDS[kind];
  if (!cfg) throw new Error(`[screenerStore] unknown kind "${kind}"`);
  return cfg;
}

function keyObject(cfg, keyValues) {
  const obj = {};
  for (const col of cfg.keys) {
    if (keyValues[col] === undefined) throw new Error(`[screenerStore] missing key ${col}`);
    obj[col] = keyValues[col];
  }
  return obj;
}

/**
 * Read a cached row. Returns { payload, updatedAt, ageMs, stale } or null when
 * the row is absent or its payload is still NULL (pending placeholder).
 */
export async function readCached(kind, keyValues) {
  const cfg = kindConfig(kind);
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(cfg.table)
    .select(`${cfg.payload}, updated_at`)
    .match(keyObject(cfg, keyValues))
    .maybeSingle();
  if (error) throw new Error(`[screenerStore] read ${cfg.table}: ${error.message}`);
  if (!data || data[cfg.payload] == null) return null;
  const ageMs = Date.now() - new Date(data.updated_at).getTime();
  return {
    payload: data[cfg.payload],
    updatedAt: data.updated_at,
    ageMs,
    stale: ageMs >= cfg.ttlMs,
  };
}

/**
 * Try to claim the refresh cooldown for a row. Exactly one caller per TTL
 * window wins (atomic via conditional UPDATE, or skeleton INSERT for rows
 * that don't exist yet). Returns true when this caller should do the fetch.
 */
export async function claimRefresh(kind, keyValues) {
  const cfg = kindConfig(kind);
  const sb = writeClient();
  if (!sb) return false; // no service-role key: reads-only mode, skip refreshes
  const keys = keyObject(cfg, keyValues);
  const nowIso = new Date().toISOString();
  const cutoffIso = new Date(Date.now() - cfg.ttlMs).toISOString();

  // Use count, NOT .select(): PostgREST re-applies the .or() filter to the
  // RETURNING rows, and since this UPDATE sets refresh_started_at=now (no
  // longer null/stale) the row is excluded from what .select() returns — so
  // .select().length is always 0 even when the update wins. `count` is the
  // real number of rows matched-and-updated.
  const { count, error: upErr } = await sb
    .from(cfg.table)
    .update({ refresh_started_at: nowIso }, { count: "exact" })
    .match(keys)
    .or(`refresh_started_at.is.null,refresh_started_at.lt.${cutoffIso}`);
  if (upErr) throw new Error(`[screenerStore] claim ${cfg.table}: ${upErr.message}`);
  if (count && count > 0) return true;

  // Row may not exist yet — a skeleton insert doubles as the claim.
  const { data: inserted, error: insErr } = await sb
    .from(cfg.table)
    .upsert({ ...keys, refresh_started_at: nowIso }, { onConflict: cfg.keys.join(","), ignoreDuplicates: true })
    .select("refresh_started_at");
  if (insErr) throw new Error(`[screenerStore] claim-insert ${cfg.table}: ${insErr.message}`);
  return Boolean(inserted && inserted.length > 0);
}

/**
 * Release a claim after a FAILED refresh: re-allow claims after retryInMs
 * instead of blocking retries for the row's whole TTL window. (Successful
 * refreshes don't need this — writeCached bumps updated_at, and the claim
 * marker simply ages out, giving the spec's once-per-TTL cadence.)
 */
export async function releaseClaim(kind, keyValues, retryInMs = 30_000) {
  const cfg = kindConfig(kind);
  const sb = writeClient();
  if (!sb) return;
  const marker = new Date(Date.now() - cfg.ttlMs + retryInMs).toISOString();
  const { error } = await sb
    .from(cfg.table)
    .update({ refresh_started_at: marker })
    .match(keyObject(cfg, keyValues));
  if (error) throw new Error(`[screenerStore] release ${cfg.table}: ${error.message}`);
}

/** Write a refreshed payload (plus optional extra columns) and bump updated_at. */
export async function writeCached(kind, keyValues, payload, extraColumns = {}) {
  const cfg = kindConfig(kind);
  const sb = writeClient();
  if (!sb) return;
  const row = {
    ...keyObject(cfg, keyValues),
    ...extraColumns,
    [cfg.payload]: payload,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from(cfg.table).upsert(row, { onConflict: cfg.keys.join(",") });
  if (error) throw new Error(`[screenerStore] write ${cfg.table}: ${error.message}`);
}

/**
 * Bulk insert-if-absent (ON CONFLICT DO NOTHING). Used by cron seeding so it
 * can never clobber richer payloads written by real refreshes, and so a whole
 * snapshot seeds in one round-trip per table. Returns how many rows were new.
 */
export async function insertMissing(table, onConflict, rows) {
  if (!rows.length) return 0;
  const sb = writeClient();
  if (!sb) return 0;
  const { data, error } = await sb
    .from(table)
    .upsert(rows, { onConflict, ignoreDuplicates: true })
    .select(onConflict.split(",")[0]);
  if (error) throw new Error(`[screenerStore] seed ${table}: ${error.message}`);
  return data?.length || 0;
}
