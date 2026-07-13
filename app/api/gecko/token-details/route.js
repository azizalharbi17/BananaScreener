import { serveCached } from "@/lib/serveCached";
import { refreshTokenMetadata } from "@/lib/refreshers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network");
  const tokenAddress = searchParams.get("tokenAddress");

  if (!network || !tokenAddress) return Response.json({ error: "Missing params" }, { status: 400 });

  return serveCached("metadata", { network, address: tokenAddress }, () =>
    refreshTokenMetadata(network, tokenAddress)
  );
}
