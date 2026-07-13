import { fetchers } from "@/lib/refreshers";
import { writeCached, readCached, claimRefresh } from "@/lib/screenerStore";

// TEMPORARY diagnostic — isolates the trending refresh into its component
// steps and returns the real error/size. Gated by CRON_SECRET. Remove after.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const out = {};
  const net = "solana";
  const page = 1;

  try {
    const snap = await fetchers.trending(net, page);
    out.fetch = { ok: true, pools: snap?.data?.length ?? null, included: snap?.included?.length ?? null, bytes: JSON.stringify(snap).length };
    try {
      await writeCached("trending", { network: net, page }, snap);
      out.write = { ok: true };
    } catch (e) {
      out.write = { ok: false, error: String(e?.message || e), stack: String(e?.stack || "").split("\n").slice(0, 4) };
    }
  } catch (e) {
    out.fetch = { ok: false, error: String(e?.message || e), name: e?.name, status: e?.status };
  }

  try {
    out.claim = await claimRefresh("trending", { network: net, page });
  } catch (e) {
    out.claim = { error: String(e?.message || e) };
  }

  try {
    const row = await readCached("trending", { network: net, page });
    out.rowAfter = { updatedAt: row?.updatedAt, ageMs: row?.ageMs };
  } catch (e) {
    out.rowAfter = { error: String(e?.message || e) };
  }

  return Response.json(out);
}
