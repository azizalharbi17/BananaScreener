import { refreshTrending } from "@/lib/refreshers";
import { readCached, claimRefresh } from "@/lib/screenerStore";
import { supabase } from "@/lib/supabaseAdmin";

// TEMPORARY diagnostic — exercises the REAL refreshTrending after clearing the
// claim, to see whether the claim/guarded wrapper is the blocker. Gated by CRON_SECRET.
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

  // 1. Clear the claim so refreshTrending can win it.
  const { error: clrErr } = await supabase
    .from("trending_snapshots")
    .update({ refresh_started_at: null })
    .match({ network: net, page });
  out.clearClaim = clrErr ? { error: clrErr.message } : { ok: true };

  // 2. Isolated claim test.
  try {
    out.claimReturns = await claimRefresh("trending", { network: net, page });
  } catch (e) {
    out.claimReturns = { error: String(e?.message || e) };
  }

  // 3. Clear again and run the real refreshTrending end-to-end.
  await supabase.from("trending_snapshots").update({ refresh_started_at: null }).match({ network: net, page });
  try {
    const r = await refreshTrending(net, page);
    out.refreshReturns = r === false ? false : { truthy: true, pools: r?.data?.length ?? null };
  } catch (e) {
    out.refreshReturns = { error: String(e?.message || e), name: e?.name, status: e?.status, stack: String(e?.stack || "").split("\n").slice(0, 5) };
  }

  const row = await readCached("trending", { network: net, page });
  out.rowAfter = { updatedAt: row?.updatedAt, ageMs: row?.ageMs };
  return Response.json(out);
}
