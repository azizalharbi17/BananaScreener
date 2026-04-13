import { cachedFetch } from "@/utils/cache";

const GT = "https://api.geckoterminal.com/api/v2";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network") || "";
  const page = searchParams.get("page") || "1";

  const url = network
    ? `${GT}/networks/${network}/trending_pools?page=${page}&include=base_token,quote_token,dex`
    : `${GT}/networks/trending_pools?page=${page}&include=base_token,quote_token,dex`;

  try {
    const data = await cachedFetch(`trending:${network}:${page}`, url);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "Rate limited, please wait a moment and refresh", status: e.message }, { status: 429 });
  }
}
