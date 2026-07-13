import { gtFetch, GTError } from "@/lib/gtClient";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network");
  const tokenAddress = searchParams.get("tokenAddress");

  if (!network || !tokenAddress) return Response.json({ error: "Missing params" }, { status: 400 });

  try {
    const data = await gtFetch("token-pools", `/networks/${encodeURIComponent(network)}/tokens/${encodeURIComponent(tokenAddress)}/pools`, {
      include: "base_token,quote_token,dex",
      page: "1",
    });
    return Response.json(data);
  } catch (e) {
    const status = e instanceof GTError && e.status === 429 ? 429 : 502;
    return Response.json({ error: "Rate limited, please wait a moment and refresh" }, { status });
  }
}
