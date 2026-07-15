import { GT_NETWORK_TO_PATH } from "./networks";

// Helper: find an included resource by type and id
function findIncluded(included, type, id) {
  if (!included || !id) return null;
  return included.find((item) => item.type === type && item.id === id) || null;
}

// Helper: extract network from pool id (e.g. "solana_xxx" → "solana")
function networkFromPoolId(poolId) {
  return poolId ? poolId.split("_")[0] : "";
}

/**
 * Transform a GeckoTerminal pool into our trending token row format
 */
export function transformPool(pool, included) {
  const attrs = pool.attributes;
  const network = networkFromPoolId(pool.id);
  const path = GT_NETWORK_TO_PATH[network] || network;

  // Resolve base token from included (may be missing in search results)
  const baseTokenRel = pool.relationships?.base_token?.data;
  const baseToken = findIncluded(included, "token", baseTokenRel?.id);
  const baseAttrs = baseToken?.attributes || {};

  // Extract address from relationship ID (format: "network_address")
  const baseAddrFromRel = baseTokenRel?.id ? baseTokenRel.id.split("_").slice(1).join("_") : "";

  // Resolve quote token
  const quoteTokenRel = pool.relationships?.quote_token?.data;
  const quoteToken = findIncluded(included, "token", quoteTokenRel?.id);
  const quoteAttrs = quoteToken?.attributes || {};
  const quoteAddrFromRel = quoteTokenRel?.id ? quoteTokenRel.id.split("_").slice(1).join("_") : "";

  // Resolve DEX
  const dexRel = pool.relationships?.dex?.data;
  const dex = findIncluded(included, "dex", dexRel?.id);

  // Parse pool name for fallbacks (e.g. "TRUMP / USDC")
  const nameParts = (attrs.name || "").split(" / ");

  const pctChange = attrs.price_change_percentage || {};
  const vol = attrs.volume_usd || {};
  const txns = attrs.transactions || {};

  return {
    id: pool.id,
    chainId: path,
    network: network,
    tokenAddress: baseAttrs.address || baseAddrFromRel || "",
    poolAddress: attrs.address,
    symbol: baseAttrs.symbol || nameParts[0] || "???",
    name: baseAttrs.name || nameParts[0] || "Unknown",
    logo: baseAttrs.image_url || null,
    usdPrice: parseFloat(attrs.base_token_price_usd) || 0,
    createdAt: attrs.pool_created_at ? Math.floor(Date.parse(attrs.pool_created_at) / 1000) : 0,
    pricePercentChange: {
      "5m": parseFloat(pctChange.m5) || 0,
      "1h": parseFloat(pctChange.h1) || 0,
      "6h": parseFloat(pctChange.h6) || 0,
      "24h": parseFloat(pctChange.h24) || 0,
    },
    totalVolume: {
      "5m": parseFloat(vol.m5) || 0,
      "1h": parseFloat(vol.h1) || 0,
      "6h": parseFloat(vol.h6) || 0,
      "24h": parseFloat(vol.h24) || 0,
    },
    transactions: {
      "5m": (txns.m5?.buys || 0) + (txns.m5?.sells || 0),
      "1h": (txns.h1?.buys || 0) + (txns.h1?.sells || 0),
      "6h": (txns.h6?.buys || 0) + (txns.h6?.sells || 0),
      "24h": (txns.h24?.buys || 0) + (txns.h24?.sells || 0),
    },
    buyers: {
      "5m": txns.m5?.buyers || 0, "1h": txns.h1?.buyers || 0,
      "6h": txns.h6?.buyers || 0, "24h": txns.h24?.buyers || 0,
    },
    sellers: {
      "5m": txns.m5?.sellers || 0, "1h": txns.h1?.sellers || 0,
      "6h": txns.h6?.sellers || 0, "24h": txns.h24?.sellers || 0,
    },
    liquidityUsd: parseFloat(attrs.reserve_in_usd) || 0,
    marketCap: parseFloat(attrs.market_cap_usd) || parseFloat(attrs.fdv_usd) || 0,
    fdv: parseFloat(attrs.fdv_usd) || 0,
    pairLabel: attrs.name || "",
    dexName: dex?.attributes?.name || dexRel?.id || "",
    // Keep full token info for detail pages
    baseToken: {
      address: baseAttrs.address || baseAddrFromRel || "",
      name: baseAttrs.name || nameParts[0] || "",
      symbol: baseAttrs.symbol || nameParts[0] || "",
      logo: baseAttrs.image_url || null,
      decimals: baseAttrs.decimals || 18,
    },
    quoteToken: {
      address: quoteAttrs.address || quoteAddrFromRel || "",
      name: quoteAttrs.name || nameParts[1] || "",
      symbol: quoteAttrs.symbol || nameParts[1] || "",
      logo: quoteAttrs.image_url || null,
      decimals: quoteAttrs.decimals || 18,
    },
  };
}

/**
 * Transform a GT pool into the pair object expected by TokenInfo/TokenChart
 */
export function transformPoolToPair(pool, included) {
  const t = transformPool(pool, included);
  const attrs = pool.attributes;
  const network = networkFromPoolId(pool.id);
  const txns = attrs.transactions || {};
  const vol = attrs.volume_usd || {};
  const pct = attrs.price_change_percentage || {};

  return {
    chainId: network,
    pairAddress: attrs.address,
    exchangeName: t.dexName,
    exchangeLogo: null,
    pairLabel: attrs.name || "",
    liquidityUsd: parseFloat(attrs.reserve_in_usd) || 0,
    usdPrice: parseFloat(attrs.base_token_price_usd) || 0,
    nativePrice: parseFloat(attrs.base_token_price_native_currency) || 0,
    volume24hrUsd: parseFloat(vol.h24) || 0,
    usdPrice24hrPercentChange: parseFloat(pct.h24) || 0,
    pair: [
      { tokenAddress: t.baseToken.address, tokenName: t.baseToken.name, tokenSymbol: t.baseToken.symbol, tokenLogo: t.baseToken.logo, tokenDecimals: String(t.baseToken.decimals), pairTokenType: "token0", liquidityUsd: 0 },
      { tokenAddress: t.quoteToken.address, tokenName: t.quoteToken.name, tokenSymbol: t.quoteToken.symbol, tokenLogo: t.quoteToken.logo, tokenDecimals: String(t.quoteToken.decimals), pairTokenType: "token1", liquidityUsd: 0 },
    ],
    // Pair stats shape that TokenInfo expects
    // GT buckets are m5/h1/h6/h24 — keys are labeled accordingly (the old
    // "4h" key silently held 6-hour data).
    lockedLiquidityPct: attrs.locked_liquidity_percentage != null ? parseFloat(attrs.locked_liquidity_percentage) : null,
    pairStats: {
      currentUsdPrice: parseFloat(attrs.base_token_price_usd) || 0,
      currentNativePrice: parseFloat(attrs.base_token_price_native_currency) || 0,
      totalLiquidityUsd: parseFloat(attrs.reserve_in_usd) || 0,
      pricePercentChange: { "5m": parseFloat(pct.m5) || 0, "1h": parseFloat(pct.h1) || 0, "6h": parseFloat(pct.h6) || 0, "24h": parseFloat(pct.h24) || 0 },
      buys: { "5m": txns.m5?.buys || 0, "1h": txns.h1?.buys || 0, "6h": txns.h6?.buys || 0, "24h": txns.h24?.buys || 0 },
      sells: { "5m": txns.m5?.sells || 0, "1h": txns.h1?.sells || 0, "6h": txns.h6?.sells || 0, "24h": txns.h24?.sells || 0 },
      totalVolume: { "5m": parseFloat(vol.m5) || 0, "1h": parseFloat(vol.h1) || 0, "6h": parseFloat(vol.h6) || 0, "24h": parseFloat(vol.h24) || 0 },
      buyers: { "5m": txns.m5?.buyers || 0, "1h": txns.h1?.buyers || 0, "6h": txns.h6?.buyers || 0, "24h": txns.h24?.buyers || 0 },
      sellers: { "5m": txns.m5?.sellers || 0, "1h": txns.h1?.sellers || 0, "6h": txns.h6?.sellers || 0, "24h": txns.h24?.sellers || 0 },
      pairCreated: attrs.pool_created_at || null,
    },
  };
}

/**
 * Transform GT trade into transaction row format
 */
export function transformTrade(trade, baseTokenAddress) {
  const a = trade.attributes;
  const kind = a.kind || "unknown"; // "buy" or "sell"

  return {
    transactionHash: a.tx_hash,
    blockTimestamp: a.block_timestamp,
    transactionType: kind,
    totalValueUsd: parseFloat(a.volume_in_usd) || 0,
    baseTokenAmount: parseFloat(kind === "buy" ? a.to_token_amount : a.from_token_amount) || 0,
    quoteTokenAmount: parseFloat(kind === "buy" ? a.from_token_amount : a.to_token_amount) || 0,
    baseTokenPriceUsd: parseFloat(kind === "buy" ? a.price_to_in_usd : a.price_from_in_usd) || 0,
    walletAddress: a.tx_from_address || "",
  };
}

/**
 * Transform OHLCV list into Chart.js-friendly format
 * Each entry: [timestamp, open, high, low, close, volume]
 */
export function transformOHLCV(ohlcvList) {
  if (!ohlcvList || !ohlcvList.length) return { labels: [], ohlc: [], volumes: [] };

  // OHLCV comes newest-first; sort chronological and drop duplicate
  // timestamps (GT occasionally repeats a candle, which breaks chart libs
  // that require strictly ascending times).
  const byTime = new Map();
  for (const c of ohlcvList) byTime.set(c[0], c);
  const sorted = [...byTime.values()].sort((a, b) => a[0] - b[0]);

  return {
    labels: sorted.map((c) => new Date(c[0] * 1000)),
    ohlc: sorted.map((c) => ({ time: c[0], open: c[1], high: c[2], low: c[3], close: c[4] })),
    prices: sorted.map((c) => c[4]), // close prices
    volumes: sorted.map((c) => c[5]),
    timestamps: sorted.map((c) => c[0]),
  };
}
