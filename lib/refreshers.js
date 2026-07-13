// Background refreshers: the only code that reaches GeckoTerminal (always via
// lib/gtClient.js). Each refresher claims the per-row cooldown first, so
// concurrent stale reads schedule at most one upstream fetch per TTL window.
//
// Failure policy (spec: keep serving last-known data, never an error page):
// - GT 4xx (except 429): negative-cache { data: null, notFound: true } so the
//   row stops being "pending", clients stop stall-retrying, and the next GT
//   probe waits a full TTL.
// - Any other failure (429/5xx/network/timeout): release the claim with a
//   short retry window instead of blocking the row for its whole TTL.
import { gtFetch, GTError } from "@/lib/gtClient";
import { claimRefresh, writeCached, releaseClaim, insertMissing } from "@/lib/screenerStore";
import { GT_NETWORK_TO_PATH } from "@/utils/networks";

async function guardedRefresh(kind, keys, fetchAndWrite) {
  if (!(await claimRefresh(kind, keys))) return false;
  try {
    return await fetchAndWrite();
  } catch (err) {
    const status = err instanceof GTError ? err.status : 0;
    if (status >= 400 && status < 500 && status !== 429) {
      await writeCached(kind, keys, { data: null, notFound: true, status });
      return false;
    }
    await releaseClaim(kind, keys).catch(() => {});
    throw err;
  }
}

export async function refreshTrending(network, page) {
  return guardedRefresh("trending", { network, page }, async () => {
    const path = network ? `/networks/${encodeURIComponent(network)}/trending_pools` : "/networks/trending_pools";
    const snapshot = await gtFetch("trending", path, { page: String(page), include: "base_token,quote_token,dex" });
    await writeCached("trending", { network, page }, snapshot);
    return snapshot;
  });
}

export async function refreshTokenStats(network, address) {
  return guardedRefresh("stats", { network, address }, async () => {
    const raw = await gtFetch("token-info", `/networks/${encodeURIComponent(network)}/tokens/${encodeURIComponent(address)}`);
    const a = raw?.data?.attributes || {};
    await writeCached("stats", { network, address }, raw, {
      price_usd: a.price_usd ?? null,
      market_cap_usd: a.market_cap_usd ?? null,
      volume_24h_usd: a.volume_usd?.h24 ?? null,
    });
    return raw;
  });
}

export async function refreshTokenMetadata(network, address) {
  return guardedRefresh("metadata", { network, address }, async () => {
    const info = await gtFetch("token-details", `/networks/${encodeURIComponent(network)}/tokens/${encodeURIComponent(address)}/info`);
    const a = info?.data?.attributes || {};
    await writeCached("metadata", { network, address }, info, {
      name: a.name ?? null,
      symbol: a.symbol ?? null,
      logo_url: a.image_url ?? null,
    });
    return info;
  });
}

export async function refreshPairs(network, tokenAddress) {
  return guardedRefresh("pairs", { network, token_address: tokenAddress }, async () => {
    const pools = await gtFetch("token-pools", `/networks/${encodeURIComponent(network)}/tokens/${encodeURIComponent(tokenAddress)}/pools`, {
      include: "base_token,quote_token,dex",
      page: "1",
    });
    await writeCached("pairs", { network, token_address: tokenAddress }, pools);
    return pools;
  });
}

export async function refreshOHLCV(network, poolAddress, timeframe, aggregate) {
  const keys = { network, pool_address: poolAddress, timeframe, aggregate };
  return guardedRefresh("ohlcv", keys, async () => {
    const candles = await gtFetch("ohlcv", `/networks/${encodeURIComponent(network)}/pools/${encodeURIComponent(poolAddress)}/ohlcv/${encodeURIComponent(timeframe)}`, {
      aggregate,
      limit: "300",
      currency: "usd",
    });
    await writeCached("ohlcv", keys, candles);
    return candles;
  });
}

export async function refreshTrades(network, poolAddress) {
  return guardedRefresh("trades", { network, pool_address: poolAddress }, async () => {
    const trades = await gtFetch("trades", `/networks/${encodeURIComponent(network)}/pools/${encodeURIComponent(poolAddress)}/trades`);
    await writeCached("trades", { network, pool_address: poolAddress }, trades);
    return trades;
  });
}

// Search rows are keyed on the lowercased query (GT matching is
// case-insensitive) so "PEPE" and "pepe" share one cache row; the original
// query is still sent upstream.
export async function refreshSearch(query, page) {
  const keys = { query: query.toLowerCase(), page };
  return guardedRefresh("search", keys, async () => {
    const results = await gtFetch("search", "/search/pools", {
      query,
      page: String(page),
      include: "base_token,quote_token,dex",
    });
    await writeCached("search", keys, results);
    return results;
  });
}

// Networks this app can actually route to; tokens on other GT networks are
// skipped during seeding (their pages don't exist here).
const KNOWN_NETWORKS = new Set(Object.keys(GT_NETWORK_TO_PATH));

/**
 * Seed tokens / token_stats / pairs rows out of a trending snapshot without
 * extra GeckoTerminal calls, so token pages of trending tokens render even if
 * GT goes down before they are ever visited. Insert-if-absent only — seeding
 * can never overwrite a payload written by a real refresh. One bulk upsert
 * per table keeps the daily cron inside its time budget.
 */
export async function seedFromSnapshot(network, snapshot) {
  const pools = snapshot?.data || [];
  const included = snapshot?.included || [];
  if (!pools.length) return { tokens: 0 };

  const tokenEntities = new Map();
  for (const inc of included) {
    if (inc.type === "token") tokenEntities.set(inc.id, inc);
  }

  const byToken = new Map();
  for (const pool of pools) {
    const baseId = pool.relationships?.base_token?.data?.id;
    if (!baseId) continue;
    const [net, address] = splitTokenId(baseId);
    if (!net || !address || !KNOWN_NETWORKS.has(net)) continue;
    if (!byToken.has(baseId)) byToken.set(baseId, { network: net, address, pools: [] });
    byToken.get(baseId).pools.push(pool);
  }

  const tokenRows = [];
  const statRows = [];
  const pairRows = [];
  for (const [tokenId, t] of byToken) {
    const attrs = tokenEntities.get(tokenId)?.attributes || {};
    const mainPool = t.pools[0]?.attributes || {};
    tokenRows.push({
      network: t.network,
      address: t.address,
      name: attrs.name ?? null,
      symbol: attrs.symbol ?? null,
      logo_url: attrs.image_url ?? null,
    });
    // Minimal GT-shaped stats payload so TokenInfo renders before the first
    // full refresh; the 60s stats TTL replaces it on the first real visit.
    statRows.push({
      network: t.network,
      address: t.address,
      price_usd: mainPool.base_token_price_usd ?? null,
      market_cap_usd: mainPool.market_cap_usd ?? null,
      volume_24h_usd: mainPool.volume_usd?.h24 ?? null,
      raw: {
        data: {
          id: tokenId,
          type: "token",
          attributes: {
            ...attrs,
            price_usd: mainPool.base_token_price_usd ?? null,
            fdv_usd: mainPool.fdv_usd ?? null,
            market_cap_usd: mainPool.market_cap_usd ?? null,
            volume_usd: mainPool.volume_usd ?? null,
            seeded_from: "trending",
          },
        },
      },
    });
    pairRows.push({
      network: t.network,
      token_address: t.address,
      pools: { data: t.pools, included },
    });
  }

  await insertMissing("tokens", "network,address", tokenRows);
  await insertMissing("token_stats", "network,address", statRows);
  await insertMissing("pairs", "network,token_address", pairRows);
  return { tokens: byToken.size };
}

// GT token ids look like "eth_0xabc..." or "solana_So11..."; network ids may
// themselves contain underscores (polygon_pos). EVM addresses always start
// with 0x, so split there when present; otherwise split at the first "_".
// (Unparseable/unknown networks are filtered out by the caller.)
function splitTokenId(id) {
  const evm = id.indexOf("_0x");
  if (evm !== -1) return [id.slice(0, evm), id.slice(evm + 1)];
  const i = id.indexOf("_");
  if (i === -1) return [null, null];
  return [id.slice(0, i), id.slice(i + 1)];
}
