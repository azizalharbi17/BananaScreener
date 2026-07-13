import { gtFetch, GTError } from "@/lib/gtClient";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network") || "";
  const page = searchParams.get("page") || "1";

  const path = network ? `/networks/${encodeURIComponent(network)}/trending_pools` : "/networks/trending_pools";

  try {
    const data = await gtFetch("trending", path, { page, include: "base_token,quote_token,dex" });
    return Response.json(data);
  } catch (e) {
    const status = e instanceof GTError && e.status === 429 ? 429 : 502;
    return Response.json({ error: "Rate limited, please wait a moment and refresh" }, { status });
  }
}
