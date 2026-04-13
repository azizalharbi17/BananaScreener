import { cachedFetch } from "@/utils/cache";

const GT = "https://api.geckoterminal.com/api/v2";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network");
  const poolAddress = searchParams.get("poolAddress");

  if (!network || !poolAddress) return Response.json({ error: "Missing params" }, { status: 400 });

  const url = `${GT}/networks/${network}/pools/${poolAddress}?include=base_token,quote_token,dex`;

  try {
    const data = await cachedFetch(`pool-info:${network}:${poolAddress}`, url);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "Rate limited, please wait a moment and refresh" }, { status: 429 });
  }
}
