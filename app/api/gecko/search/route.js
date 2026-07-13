import { serveCached } from "@/lib/serveCached";
import { refreshSearch } from "@/lib/refreshers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") || "").trim();
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  if (!query) return Response.json({ data: [], included: [] });

  // Cache rows are keyed on the lowercased query (must match refreshSearch).
  return serveCached("search", { query: query.toLowerCase(), page }, () => refreshSearch(query, page));
}
