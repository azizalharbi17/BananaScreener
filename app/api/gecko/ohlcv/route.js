import { cachedFetch } from "@/utils/cache";

const GT = "https://api.geckoterminal.com/api/v2";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network");
  const poolAddress = searchParams.get("poolAddress");
  const timeframe = searchParams.get("timeframe") || "hour";
  const aggregate = searchParams.get("aggregate") || "1";
  const limit = searchParams.get("limit") || "100";

  if (!network || !poolAddress) return Response.json({ error: "Missing params" }, { status: 400 });

  const url = `${GT}/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}&currency=usd`;

  try {
    const data = await cachedFetch(`ohlcv:${network}:${poolAddress}:${timeframe}:${aggregate}`, url);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "Rate limited, please wait a moment and refresh" }, { status: 429 });
  }
}
