import { requireSupabase } from "@/lib/supabaseAdmin";

// Serves a single pool out of the cached pairs rows. No frontend page calls
// this today; it exists for API compatibility and never contacts GT.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network");
  const poolAddress = searchParams.get("poolAddress");

  if (!network || !poolAddress) return Response.json({ error: "Missing params" }, { status: 400 });

  try {
    const sb = requireSupabase();
    const { data: rows, error } = await sb
      .from("pairs")
      .select("pools, updated_at")
      .eq("network", network)
      .contains("pools", { data: [{ attributes: { address: poolAddress } }] })
      .limit(1);
    if (error) throw new Error(error.message);

    const row = rows?.[0];
    const pool = row?.pools?.data?.find((p) => p?.attributes?.address === poolAddress) || null;
    if (!pool) return Response.json({ data: null, _meta: { pending: false, unknown: true } });
    return Response.json({
      data: pool,
      included: row.pools.included || [],
      _meta: { updatedAt: row.updated_at },
    });
  } catch (e) {
    console.error("[pool-info] read failed:", e?.message || e);
    return Response.json({ error: "Data store unavailable" }, { status: 503 });
  }
}
