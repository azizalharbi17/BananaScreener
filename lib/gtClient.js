// Single shared GeckoTerminal client. Every /api/gecko route MUST go through
// gtFetch — no route may call api.geckoterminal.com directly.
//
// Provides: in-memory TTL cache keyed by endpoint+params, single-flight dedupe
// of concurrent identical requests, stale-on-error (no max age), per-endpoint
// exponential backoff after failures, and hit/miss/stale counters.
//
// Note: state is per server process. On Vercel each warm lambda instance has
// its own cache; that still collapses request bursts, which is what causes 429s.

const GT_BASE = "https://api.geckoterminal.com/api/v2";
const GT_HEADERS = { Accept: "application/json;version=20230302" };

// TTL per endpoint (ms). Backoff is also keyed per endpoint.
const ENDPOINT_TTLS = {
  trending: 60_000,
  "token-pools": 30_000,
  "pool-info": 30_000,
  "token-info": 30_000,
  trades: 30_000,
  ohlcv: 60_000,
  search: 300_000,
  "token-details": 86_400_000, // token metadata — effectively immutable
};

const MAX_CACHE_ENTRIES = 500;
const BACKOFF_BASE_MS = 2_000;
const BACKOFF_MAX_MS = 300_000;
const STATS_LOG_EVERY = 25;

// Persist state on globalThis so dev recompiles/HMR don't wipe the cache and
// backoff memory (which would re-hammer GT exactly when it's rate-limiting).
const state = (globalThis.__gtClientState ??= {
  cache: new Map(), // key → { data, storedAt }
  inflight: new Map(), // key → Promise resolving like gtFetch itself
  backoff: new Map(), // endpoint → { failures, until }
  stats: {
    hits: 0,
    coalesced: 0,
    misses: 0,
    staleServed: 0,
    upstreamRequests: 0,
    upstreamOk: 0,
    upstream429: 0,
    upstreamErrors: 0,
    noCacheErrors: 0,
  },
  instanceId: Math.random().toString(36).slice(2, 10),
  startedAt: Date.now(),
});
const { cache, inflight, backoff, stats } = state;

export class GTError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "GTError";
    this.status = status;
  }
}

function logCounts(context) {
  console.log(
    `[gtClient] ${context} | hits=${stats.hits} coalesced=${stats.coalesced} misses=${stats.misses} ` +
      `staleServed=${stats.staleServed} upstream=${stats.upstreamRequests} (ok=${stats.upstreamOk} 429=${stats.upstream429} err=${stats.upstreamErrors}) ` +
      `noCacheErrors=${stats.noCacheErrors} cacheEntries=${cache.size}`
  );
}

function maybeLogCounts() {
  const served = stats.hits + stats.coalesced + stats.misses + stats.staleServed;
  if (served > 0 && served % STATS_LOG_EVERY === 0) logCounts("periodic");
}

function setCache(key, data) {
  cache.delete(key); // re-insert so Map order tracks recency of storage
  cache.set(key, { data, storedAt: Date.now() });
  while (cache.size > MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
}

function inBackoffWindow(endpoint) {
  const b = backoff.get(endpoint);
  return b ? Date.now() < b.until : false;
}

function recordFailure(endpoint, retryAfterMs = 0) {
  const b = backoff.get(endpoint) || { failures: 0, until: 0 };
  // Count backoff ROUNDS, not individual rejections: a burst of concurrent
  // failures must not multiply the exponent in one event.
  if (Date.now() < b.until) return;
  b.failures += 1;
  const delay = Math.min(BACKOFF_BASE_MS * 2 ** (b.failures - 1), BACKOFF_MAX_MS);
  b.until = Date.now() + Math.max(delay, retryAfterMs);
  backoff.set(endpoint, b);
  console.warn(
    `[gtClient] backoff ${endpoint}: failure round #${b.failures}, pausing upstream for ${Math.round(
      (b.until - Date.now()) / 1000
    )}s`
  );
}

function recordSuccess(endpoint) {
  backoff.delete(endpoint);
}

/**
 * Fetch a GeckoTerminal endpoint through the cache.
 * @param {keyof typeof ENDPOINT_TTLS} endpoint - TTL/backoff bucket, one per GT endpoint
 * @param {string} path - GT path starting with "/", e.g. "/networks/eth/pools/0x.."
 * @param {object} [params] - query params (undefined/null/"" values are dropped)
 * @returns {Promise<object>} parsed JSON
 * @throws {GTError} only when upstream failed AND nothing is cached
 */
export async function gtFetch(endpoint, path, params = {}) {
  const ttl = ENDPOINT_TTLS[endpoint];
  if (!ttl) throw new Error(`[gtClient] unknown endpoint "${endpoint}"`);

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  qs.sort();
  const query = qs.toString();
  const url = query ? `${GT_BASE}${path}?${query}` : `${GT_BASE}${path}`;
  const key = url;

  const entry = cache.get(key);
  if (entry && Date.now() - entry.storedAt < ttl) {
    stats.hits += 1;
    maybeLogCounts();
    return entry.data;
  }

  const pending = inflight.get(key);
  if (pending) {
    stats.coalesced += 1;
    maybeLogCounts();
    return pending;
  }

  if (inBackoffWindow(endpoint)) {
    if (entry) {
      stats.staleServed += 1;
      maybeLogCounts();
      return entry.data;
    }
    stats.noCacheErrors += 1;
    throw new GTError(429, `GeckoTerminal "${endpoint}" is backing off and nothing is cached yet`);
  }

  const settled = (async () => {
    try {
      stats.misses += 1;
      stats.upstreamRequests += 1;
      console.log(`[gtClient] MISS → GT: ${url}`);
      // no-store: we do our own caching; never let Next's data cache freeze GT responses
      const res = await fetch(url, { headers: GT_HEADERS, cache: "no-store" });
      if (!res.ok) {
        const retryAfterMs = (Number(res.headers.get("retry-after")) || 0) * 1000;
        const err = new GTError(res.status, `GeckoTerminal responded ${res.status} for ${path}`);
        err.retryAfterMs = retryAfterMs;
        throw err;
      }
      const data = await res.json();
      stats.upstreamOk += 1;
      recordSuccess(endpoint);
      setCache(key, data);
      maybeLogCounts();
      return data;
    } catch (err) {
      if (err instanceof GTError && err.status === 429) stats.upstream429 += 1;
      else stats.upstreamErrors += 1;
      // Back off on rate limits, server errors, and network failures — but not
      // on other 4xx (e.g. a 404 for one bad address must not pause the endpoint).
      const status = err instanceof GTError ? err.status : 0;
      const clientError = status >= 400 && status < 500 && status !== 429;
      if (!clientError) recordFailure(endpoint, err.retryAfterMs);
      const staleEntry = cache.get(key);
      if (staleEntry) {
        stats.staleServed += 1;
        console.log(`[gtClient] serving STALE after upstream failure: ${key}`);
        maybeLogCounts();
        return staleEntry.data;
      }
      stats.noCacheErrors += 1;
      maybeLogCounts();
      throw err instanceof GTError ? err : new GTError(502, String(err?.message || err));
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, settled);
  return settled;
}

/** Snapshot of counters and backoff state, for logs and the cache-stats route. */
export function gtStats() {
  const now = Date.now();
  return {
    instanceId: state.instanceId,
    instanceUptimeSec: Math.round((now - state.startedAt) / 1000),
    ...stats,
    cacheEntries: cache.size,
    inflight: inflight.size,
    backoff: Object.fromEntries(
      [...backoff].map(([endpoint, b]) => [
        endpoint,
        { failures: b.failures, remainingMs: Math.max(0, b.until - now) },
      ])
    ),
  };
}
