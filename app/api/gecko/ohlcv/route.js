import { gtFetch, GTError } from "@/lib/gtClient";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network");
  const poolAddress = searchParams.get("poolAddress");
  const timeframe = searchParams.get("timeframe") || "hour";
  const aggregate = searchParams.get("aggregate") || "1";
  const limit = searchParams.get("limit") || "100";

  if (!network || !poolAddress) return Response.json({ error: "Missing params" }, { status: 400 });

  try {
    const data = await gtFetch("ohlcv", `/networks/${encodeURIComponent(network)}/pools/${encodeURIComponent(poolAddress)}/ohlcv/${encodeURIComponent(timeframe)}`, {
      aggregate,
      limit,
      currency: "usd",
    });
    return Response.json(data);
  } catch (e) {
    const status = e instanceof GTError && e.status === 429 ? 429 : 502;
    return Response.json({ error: "Rate limited, please wait a moment and refresh" }, { status });
  }
}
