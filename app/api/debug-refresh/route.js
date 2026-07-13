import { supabase } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const net = "solana", page = 1, out = {};
  const cutoff = new Date(Date.now() - 120000).toISOString();

  // reset
  await supabase.from("trending_snapshots").update({ refresh_started_at: null }).match({ network: net, page });

  // A: plain update + select (does UPDATE...RETURNING return rows under RLS at all?)
  {
    const { data, error } = await supabase
      .from("trending_snapshots")
      .update({ refresh_started_at: new Date().toISOString() })
      .match({ network: net, page })
      .select("network,page,refresh_started_at");
    out.A_plainUpdateSelect = { rows: data?.length ?? null, error: error?.message || null };
  }

  // reset
  await supabase.from("trending_snapshots").update({ refresh_started_at: null }).match({ network: net, page });

  // B: update + match + or(is.null, lt.cutoff) + select  (the claimRefresh query)
  {
    const { data, error } = await supabase
      .from("trending_snapshots")
      .update({ refresh_started_at: new Date().toISOString() })
      .match({ network: net, page })
      .or(`refresh_started_at.is.null,refresh_started_at.lt.${cutoff}`)
      .select("network,page,refresh_started_at");
    out.B_claimQuery = { rows: data?.length ?? null, error: error?.message || null };
  }

  // C: did B actually modify the row? read raw
  {
    const { data } = await supabase
      .from("trending_snapshots")
      .select("refresh_started_at")
      .match({ network: net, page });
    out.C_rowClaimAfterB = data?.[0]?.refresh_started_at ?? null;
  }

  return Response.json(out);
}
