import { serveCached } from "@/lib/serveCached";
import { refreshOHLCV } from "@/lib/refreshers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network");
  const poolAddress = searchParams.get("poolAddress");
  const timeframe = searchParams.get("timeframe") || "hour";
  const aggregate = searchParams.get("aggregate") || "1";
  // The client "limit" param is intentionally ignored: candles are cached per
  // (pool, timeframe, aggregate) at limit=300 and served as-is.

  if (!network || !poolAddress) return Response.json({ error: "Missing params" }, { status: 400 });

  return serveCached(
    "ohlcv",
    { network, pool_address: poolAddress, timeframe, aggregate },
    () => refreshOHLCV(network, poolAddress, timeframe, aggregate)
  );
}
