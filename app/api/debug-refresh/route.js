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

  // Fix candidate 1: count:'exact' on the filtered update (no select of rows)
  {
    const now = new Date().toISOString();
    const { count, error } = await supabase
      .from("trending_snapshots")
      .update({ refresh_started_at: now }, { count: "exact" })
      .match({ network: net, page })
      .or(`refresh_started_at.is.null,refresh_started_at.lt.${cutoff}`);
    out.fix1_count = { count: count ?? null, error: error?.message || null };
  }

  // reset
  await supabase.from("trending_snapshots").update({ refresh_started_at: null }).match({ network: net, page });

  // Fix candidate 2: read-after-write with unique marker time comparison
  {
    const now = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("trending_snapshots")
      .update({ refresh_started_at: now })
      .match({ network: net, page })
      .or(`refresh_started_at.is.null,refresh_started_at.lt.${cutoff}`);
    const { data } = await supabase
      .from("trending_snapshots")
      .select("refresh_started_at")
      .match({ network: net, page })
      .maybeSingle();
    const stored = data?.refresh_started_at;
    const won = stored != null && Math.abs(new Date(stored).getTime() - new Date(now).getTime()) < 2;
    out.fix2_readAfterWrite = { upErr: upErr?.message || null, wroteMarker: now, stored, won };
  }

  // second attempt should now LOSE (claim held fresh)
  {
    const now = new Date().toISOString();
    await supabase
      .from("trending_snapshots")
      .update({ refresh_started_at: now })
      .match({ network: net, page })
      .or(`refresh_started_at.is.null,refresh_started_at.lt.${cutoff}`);
    const { data } = await supabase
      .from("trending_snapshots")
      .select("refresh_started_at")
      .match({ network: net, page })
      .maybeSingle();
    const won = data?.refresh_started_at != null && Math.abs(new Date(data.refresh_started_at).getTime() - new Date(now).getTime()) < 2;
    out.fix2_secondAttemptShouldLose = { won };
  }

  return Response.json(out);
}
