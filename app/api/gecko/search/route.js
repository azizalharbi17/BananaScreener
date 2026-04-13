import { cachedFetch } from "@/utils/cache";

const GT = "https://api.geckoterminal.com/api/v2";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const page = searchParams.get("page") || "1";

  if (!query.trim()) return Response.json({ data: [], included: [] });

  const url = `${GT}/search/pools?query=${encodeURIComponent(query)}&page=${page}&include=base_token,quote_token,dex`;

  try {
    const data = await cachedFetch(`search:${query.toLowerCase()}:${page}`, url, 30000);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "Rate limited, please wait a moment and refresh" }, { status: 429 });
  }
}
