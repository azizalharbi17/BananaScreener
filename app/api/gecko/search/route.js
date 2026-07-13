import { gtFetch, GTError } from "@/lib/gtClient";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const page = searchParams.get("page") || "1";

  if (!query.trim()) return Response.json({ data: [], included: [] });

  try {
    // Do not normalize case: Solana addresses in queries are case-sensitive.
    const data = await gtFetch("search", "/search/pools", {
      query: query.trim(),
      page,
      include: "base_token,quote_token,dex",
    });
    return Response.json(data);
  } catch (e) {
    const status = e instanceof GTError && e.status === 429 ? 429 : 502;
    return Response.json({ error: "Rate limited, please wait a moment and refresh" }, { status });
  }
}
