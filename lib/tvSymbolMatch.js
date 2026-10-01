// Pure matching logic behind /api/tv-symbol, kept out of the route file so it
// can be unit-tested with plain node.
//
// Problem it solves: TradingView resolves bare tickers, and tickers collide.
// "PONSUSD" resolved to TENDIES, "MEMEUSD" to Memetic/PepeCoin, "AIUSD" to
// Gensyn — so a ticker-only lookup rendered other projects' charts on token
// pages. We therefore only accept a TradingView instrument when BOTH hold:
//   1. its symbol is exactly TICKER + USD/USDT/USDC, and
//   2. its base-asset description names this token: the description's word
//      set equals the token's name word set OR its CoinGecko id word set
//      ("Brett (Based)" == "based-brett", "Cash Cat" == "cash-cat").
// Word-set EQUALITY is deliberate. A superset rule would let "Sleepless AI"
// match a token literally named "AI". Losing a few legitimate matches is fine:
// the pool chart is always available; a wrong chart is never acceptable.

const QUOTES = ["USD", "USDT", "USDC"];

const stripTags = (s) => String(s || "").replace(/<[^>]*>/g, "");

export const normalizeWords = (s) =>
  new Set(
    stripTags(s)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );

const sameWordSet = (a, b) => a.size > 0 && a.size === b.size && [...a].every((w) => b.has(w));

// TradingView's own aggregate index ("CRYPTO:XXXUSD") is the most neutral
// CEX price; rank it first, then prefer USD over USDT over USDC quotes.
const exchangeRank = (ex) => (ex === "CRYPTO" ? 0 : 1);

/**
 * Pick the TradingView instrument that verifiably IS this token.
 * @param {Array<{symbol:string, description:string, exchange?:string, prefix?:string}>} symbols
 *   raw items from TradingView symbol_search v3
 * @param {{ticker:string, name:string, coinId:string}} token
 * @returns {{match:true, symbol:string, description:string, exchange:string} | {match:false}}
 */
export function pickTradingViewSymbol(symbols, { ticker, name, coinId }) {
  const t = String(ticker || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!t) return { match: false };

  const wanted = new Map(QUOTES.map((q, i) => [t + q, i]));
  const nameWords = normalizeWords(name);
  const idWords = normalizeWords(coinId);

  const candidates = [];
  for (const item of symbols || []) {
    const sym = stripTags(item?.symbol).toUpperCase();
    if (!wanted.has(sym)) continue;
    const description = stripTags(item?.description);
    const baseDesc = description.split(/\s*\/\s*/)[0];
    const descWords = normalizeWords(baseDesc);
    if (!(sameWordSet(descWords, nameWords) || sameWordSet(descWords, idWords))) continue;
    const exchange = String(item?.prefix || item?.exchange || "").toUpperCase();
    if (!exchange) continue;
    candidates.push({ exchange, sym, description, quoteRank: wanted.get(sym) });
  }
  if (!candidates.length) return { match: false };

  candidates.sort(
    (a, b) => exchangeRank(a.exchange) - exchangeRank(b.exchange) || a.quoteRank - b.quoteRank
  );
  const best = candidates[0];
  return { match: true, symbol: `${best.exchange}:${best.sym}`, description: best.description, exchange: best.exchange };
}
