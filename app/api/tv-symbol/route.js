// Checks whether a symbol (e.g. "PEPEUSD") exists on TradingView, so the
// token page can skip the TV widget entirely for tokens TV has never heard of
// (very new tokens) instead of rendering an "Invalid symbol" chart.
//
// Failure policy: on any upstream problem return { exists: null } — the client
// treats "unknown" as "assume it exists" and relies on the widget's own
// load-timeout fallback, so this route can never take TV charts down.
const cache = new Map(); // per-instance; CDN caching via s-maxage does the real work

const SEARCH_URL = "https://symbol-search.tradingview.com/symbol_search/v3/";
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Origin: "https://www.tradingview.com",
  Referer: "https://www.tradingview.com/",
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase();
  if (!symbol) return Response.json({ error: "Missing symbol" }, { status: 400 });

  const cached = cache.get(symbol);
  if (cached) {
    return Response.json(cached, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
    });
  }

  try {
    const params = new URLSearchParams({
      text: symbol,
      search_type: "crypto",
      lang: "en",
      domain: "production",
      hl: "0",
    });
    const res = await fetch(`${SEARCH_URL}?${params}`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`TV search ${res.status}`);
    const data = await res.json();
    // With hl=1 TV wraps matches in <em> tags; strip any markup defensively.
    const stripTags = (s) => (s || "").replace(/<[^>]*>/g, "");
    const exists = (data.symbols || []).some(
      (s) => stripTags(s.symbol).toUpperCase() === symbol
    );
    const payload = { exists };
    cache.set(symbol, payload);
    return Response.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
    });
  } catch {
    return Response.json(
      { exists: null },
      { headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  }
}
