// Verifies that TradingView lists THIS token — not merely its ticker — so the
// token page can offer TradingView's centralized-exchange chart as an opt-in
// secondary view. Callers must already have checked that the token has a
// CoinGecko coin id (the primary gate); this is the second gate.
//
// Returns:
//   { match: true, symbol: "EXCHANGE:SYMBOL", description, exchange }
//   { match: false }  — TradingView has no instrument whose base asset is this token
//   { match: null }   — the lookup itself failed; callers must NOT offer TradingView
//
// The old version answered { exists } for a bare ticker. In production it said
// exists:true for every ticker tried, and the matches were other coins, so the
// OHLCV chart almost never showed and some tokens rendered an unrelated chart.
import { pickTradingViewSymbol } from "@/lib/tvSymbolMatch";

const cache = new Map(); // per-instance; CDN caching via s-maxage does the real work
const MAX_CACHE_ENTRIES = 1000;

const SEARCH_URL = "https://symbol-search.tradingview.com/symbol_search/v3/";
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Origin: "https://www.tradingview.com",
  Referer: "https://www.tradingview.com/",
};
const LONG_CACHE = { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" };
const SHORT_CACHE = { "Cache-Control": "public, s-maxage=300" };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get("ticker") || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const name = (searchParams.get("name") || "").trim();
  const coinId = (searchParams.get("coinId") || "").trim();
  if (!ticker || !coinId) {
    return Response.json({ error: "ticker and coinId are required" }, { status: 400 });
  }

  const key = `${ticker}|${coinId.toLowerCase()}|${name.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached) return Response.json(cached, { headers: LONG_CACHE });

  try {
    // Search by bare ticker and let the matcher insist on exact symbol + name.
    const params = new URLSearchParams({
      text: ticker,
      search_type: "crypto",
      lang: "en",
      domain: "production",
      hl: "0",
    });
    const res = await fetch(`${SEARCH_URL}?${params}`, {
      headers: BROWSER_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`TV search ${res.status}`);
    const data = await res.json();
    const payload = pickTradingViewSymbol(data.symbols || [], { ticker, name, coinId });
    if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
    cache.set(key, payload);
    return Response.json(payload, { headers: LONG_CACHE });
  } catch {
    return Response.json({ match: null }, { headers: SHORT_CACHE });
  }
}
