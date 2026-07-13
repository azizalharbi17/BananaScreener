import { serveCached } from "@/lib/serveCached";
import { refreshTrades } from "@/lib/refreshers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network");
  const poolAddress = searchParams.get("poolAddress");

  if (!network || !poolAddress) return Response.json({ error: "Missing params" }, { status: 400 });

  return serveCached("trades", { network, pool_address: poolAddress }, () =>
    refreshTrades(network, poolAddress)
  );
}
