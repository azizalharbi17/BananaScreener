import { readCached } from "@/lib/screenerStore";
import { afterResponse } from "@/lib/afterResponse";

// How long a request may wait for a fresh copy of a very stale row before
// falling back to serving the stale one.
const SYNC_REFRESH_TIMEOUT_MS = 6_000;
const TIMED_OUT = Symbol("timed-out");

/**
 * The one visitor-facing read path: serve from Supabase instantly, schedule a
 * background refresh when stale or missing. Missing rows answer
 * `{ data: null, _meta: { pending } }` so clients can retry in a couple of
 * seconds while the refresh lands.
 *
 * Exception: a row far past its TTL (see veryStaleMs) is refreshed in the
 * request path, bounded by SYNC_REFRESH_TIMEOUT_MS, so the first visitor to a
 * long-unvisited token never sees weeks-old prices. If that refresh loses the
 * claim, fails, or times out, the stale row is served as before and any
 * in-flight refresh keeps running in the background.
 */
export async function serveCached(kind, keys, refresh) {
  let row;
  try {
    row = await readCached(kind, keys);
  } catch (e) {
    console.error(`[serveCached] ${kind} read failed:`, e?.message || e);
    return Response.json({ error: "Data store unavailable" }, { status: 503 });
  }

  if (row?.veryStale) {
    const fresh = await refreshWithin(refresh, SYNC_REFRESH_TIMEOUT_MS);
    if (fresh) {
      return Response.json({
        ...fresh,
        _meta: { updatedAt: new Date().toISOString(), ageMs: 0, stale: false },
      });
    }
  } else if (row?.stale) {
    afterResponse(refresh);
  }

  if (row) {
    return Response.json({
      ...row.payload,
      _meta: { updatedAt: row.updatedAt, ageMs: row.ageMs, stale: row.stale },
    });
  }

  afterResponse(refresh);
  return Response.json({ data: null, _meta: { pending: true } });
}

/**
 * Run `refresh` and wait up to `ms` for it. Resolves to the fresh payload, or
 * null when the refresh lost its claim, hit an upstream 4xx (refreshers
 * return false), failed, or ran out of time. A refresh still running at the
 * deadline is handed to afterResponse so it can finish and write the row.
 */
async function refreshWithin(refresh, ms) {
  const work = Promise.resolve().then(refresh);
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), ms);
  });
  try {
    const result = await Promise.race([work, timeout]);
    if (result === TIMED_OUT) {
      afterResponse(() => work);
      return null;
    }
    return result && typeof result === "object" ? result : null;
  } catch (e) {
    console.error("[serveCached] sync refresh failed:", e?.message || e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
