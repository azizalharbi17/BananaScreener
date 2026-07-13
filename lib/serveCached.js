import { readCached } from "@/lib/screenerStore";
import { afterResponse } from "@/lib/afterResponse";

/**
 * The one visitor-facing read path: serve from Supabase instantly, schedule a
 * background refresh when stale or missing. Never contacts GeckoTerminal in
 * the request path. Missing rows answer `{ data: null, _meta: { pending } }`
 * so clients can retry in a couple of seconds while the refresh lands.
 */
export async function serveCached(kind, keys, refresh) {
  let row;
  try {
    row = await readCached(kind, keys);
  } catch (e) {
    console.error(`[serveCached] ${kind} read failed:`, e?.message || e);
    return Response.json({ error: "Data store unavailable" }, { status: 503 });
  }

  if (row) {
    if (row.stale) afterResponse(refresh);
    return Response.json({
      ...row.payload,
      _meta: { updatedAt: row.updatedAt, ageMs: row.ageMs, stale: row.stale },
    });
  }

  afterResponse(refresh);
  return Response.json({ data: null, _meta: { pending: true } });
}
