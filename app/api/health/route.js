import { supabase } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Operational check: is Supabase reachable and populated?
export async function GET() {
  if (!supabase) {
    return Response.json({ ok: false, error: "Supabase env vars not configured" }, { status: 503 });
  }
  try {
    const tables = ["trending_snapshots", "tokens", "token_stats", "pairs", "ohlcv_candles", "pair_trades", "search_cache"];
    const counts = {};
    for (const t of tables) {
      const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
      if (error) throw new Error(`${t}: ${error.message}`);
      counts[t] = count;
    }
    const { data: newest } = await supabase
      .from("trending_snapshots")
      .select("network, page, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);
    return Response.json({ ok: true, counts, newestTrending: newest?.[0] ?? null });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 503 });
  }
}
