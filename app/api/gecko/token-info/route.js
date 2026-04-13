import { cachedFetch } from "@/utils/cache";

const GT = "https://api.geckoterminal.com/api/v2";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network");
  const tokenAddress = searchParams.get("tokenAddress");

  if (!network || !tokenAddress) return Response.json({ error: "Missing params" }, { status: 400 });

  const url = `${GT}/networks/${network}/tokens/${tokenAddress}`;

  try {
    const data = await cachedFetch(`token-info:${network}:${tokenAddress}`, url, 120000);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "Rate limited, please wait a moment and refresh" }, { status: 429 });
  }
}
