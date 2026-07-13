import { serveCached } from "@/lib/serveCached";
import { refreshTrending } from "@/lib/refreshers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network") || "";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  return serveCached("trending", { network, page }, () => refreshTrending(network, page));
}
