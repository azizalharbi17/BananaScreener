import { transformPool, transformPoolToPair, transformTrade, transformOHLCV } from "./gecko-transform";

const API_BASE = "/api/gecko";

// Cold rows answer { _meta: { pending: true } } while the server's background
// refresh lands — retry a few times before giving up so first-ever visits to
// a token still render within a couple of seconds.
async function fetchApi(path, { pendingRetries = 3, retryDelayMs = 2000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    if (!json?._meta?.pending || attempt >= pendingRetries) return json;
    await new Promise((r) => setTimeout(r, retryDelayMs));
  }
}

// One page of the trending feed plus the cache's status for it. Infinite
// scroll needs to tell "this page is still warming" (retry shortly) apart from
// "there are no more pages" (stop) — both come back with zero pools.
export async function getTrendingPage(network = "", page = 1) {
  const params = new URLSearchParams();
  if (network) params.set("network", network);
  params.set("page", String(page));
  const data = await fetchApi(`/trending?${params}`);
  const pools = data.data || [];
  const included = data.included || [];
  return {
    tokens: pools.map((pool) => transformPool(pool, included)),
    pending: Boolean(data._meta?.pending),
  };
}

export async function getTrendingTokens(network = "", page = 1) {
  return (await getTrendingPage(network, page)).tokens;
}

export async function searchTokens(query) {
  if (!query?.trim()) return [];
  const data = await fetchApi(`/search?query=${encodeURIComponent(query)}`);
  const pools = data.data || [];
  const included = data.included || [];
  return pools.map((pool) => transformPool(pool, included));
}

export async function getTokenPools(network, tokenAddress) {
  const data = await fetchApi(`/token-pools?network=${network}&tokenAddress=${tokenAddress}`);
  const pools = data.data || [];
  const included = data.included || [];
  return pools.map((pool) => transformPoolToPair(pool, included));
}

export async function getPoolInfo(network, poolAddress) {
  const data = await fetchApi(`/pool-info?network=${network}&poolAddress=${poolAddress}`);
  const included = data.included || [];
  return data.data ? transformPoolToPair(data.data, included) : null;
}

export async function getOHLCV(network, poolAddress, timeframe = "hour", aggregate = "1", limit = "100") {
  const data = await fetchApi(`/ohlcv?network=${network}&poolAddress=${poolAddress}&timeframe=${timeframe}&aggregate=${aggregate}&limit=${limit}`);
  const list = data.data?.attributes?.ohlcv_list || [];
  return transformOHLCV(list);
}

export async function getTrades(network, poolAddress) {
  const data = await fetchApi(`/trades?network=${network}&poolAddress=${poolAddress}`);
  const trades = data.data || [];
  return trades.map((t) => transformTrade(t));
}

export async function getTokenInfo(network, tokenAddress) {
  const data = await fetchApi(`/token-info?network=${network}&tokenAddress=${tokenAddress}`);
  if (!data.data?.attributes) return null;
  // _updatedAt feeds the "updated Xs ago" indicator on token pages.
  return { ...data.data.attributes, _updatedAt: data._meta?.updatedAt || null };
}

export async function getTokenDetails(network, tokenAddress) {
  const data = await fetchApi(`/token-details?network=${network}&tokenAddress=${tokenAddress}`);
  return data.data?.attributes || null;
}
