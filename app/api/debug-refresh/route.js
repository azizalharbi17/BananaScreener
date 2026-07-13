import { gtFetch } from "@/lib/gtClient";
import { writeCached, readCached } from "@/lib/screenerStore";

// TEMPORARY diagnostic — replicates refreshTrending's real steps (gtFetch then
// writeCached) to isolate which fails on production. Gated by CRON_SECRET.
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
    const snapshot = await gtFetch("trending", `/networks/${net}/trending_pools`, {
      page: String(page),
      include: "base_token,quote_token,dex",
    });
    out.fetch = { ok: true, pools: snapshot?.data?.length ?? null, bytes: JSON.stringify(snapshot).length };
    try {
      await writeCached("trending", { network: net, page }, snapshot);
      out.write = { ok: true };
    } catch (e) {
      out.write = { ok: false, error: String(e?.message || e), stack: String(e?.stack || "").split("\n").slice(0, 5) };
    }
  } catch (e) {
    out.fetch = { ok: false, error: String(e?.message || e), name: e?.name, status: e?.status };
  }

  try {
    const row = await readCached("trending", { network: net, page });
    out.rowAfter = { updatedAt: row?.updatedAt, ageMs: row?.ageMs };
  } catch (e) {
    out.rowAfter = { error: String(e?.message || e) };
  }

  return Response.json(out);
}
