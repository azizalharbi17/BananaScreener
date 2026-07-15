// Proxies the BananaMaps graph API (our own service) so the Holders tab
// avoids CORS and keeps a single origin. Supported chains live in
// utils/bananamaps.js (shared with every BananaMaps button/embed in the UI).
// poll=1 is a pure cache probe on their side; wait=0 kicks off a background
// build without holding the request open. No GeckoTerminal involvement.
import { GT_TO_BANANAMAPS_CHAIN } from "@/utils/bananamaps";

const BM_BASE = "https://www.bananamaps.io/api/graph";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network");
  const tokenAddress = searchParams.get("tokenAddress");
  const mode = searchParams.get("mode") || "start"; // "start" | "poll"

  if (!network || !tokenAddress) return Response.json({ error: "Missing params" }, { status: 400 });

  const chain = GT_TO_BANANAMAPS_CHAIN[network];
  if (!chain) return Response.json({ unsupported: true, chain: network });

  const params = mode === "poll" ? "poll=1" : "wait=0";
  try {
    const res = await fetch(
      `${BM_BASE}?token=${encodeURIComponent(tokenAddress)}&chain=${chain}&${params}`,
      { cache: "no-store", signal: AbortSignal.timeout(20_000) }
    );
    const body = await res.json().catch(() => ({}));
    if (body.graph) {
      const g = body.graph;
      const holders = (g.nodes || [])
        .filter((n) => n.kind === "holder" && (n.pct || 0) > 0)
        .sort((a, b) => (b.pct || 0) - (a.pct || 0))
        .slice(0, 150)
        .map((n) => ({
          address: n.address,
          pct: n.pct || 0,
          amount: n.balanceFormatted ?? null,
          usd: n.balanceFormatted != null && g.price ? n.balanceFormatted * g.price : null,
          label: n.label || null,
          labelType: n.labelType || null,
          cluster: n.cluster ?? null,
        }));
      return Response.json({
        holders,
        totalHolders: g.totalHolders ?? null,
        clusters: (g.clusters || []).length,
        computedAt: g.computedAt,
        symbol: g.symbol,
      });
    }
    // No graph yet: building (202) or unknown
    return Response.json({ building: true, status: res.status }, { status: 200 });
  } catch (e) {
    return Response.json({ error: "Holder data unavailable" }, { status: 502 });
  }
}
