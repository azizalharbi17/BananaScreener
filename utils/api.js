import { transformPool, transformPoolToPair, transformTrade } from "./gecko-transform";

const API_BASE = "/api/gecko";

async function fetchApi(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getTrendingTokens(network = "", page = 1) {
  const params = new URLSearchParams();
  if (network) params.set("network", network);
  params.set("page", String(page));
  const data = await fetchApi(`/trending?${params}`);
  const pools = data.data || [];
  const included = data.included || [];
  return pools.map((pool) => transformPool(pool, included));
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
  return data.data?.attributes || null;
}

export async function getTokenDetails(network, tokenAddress) {
  const data = await fetchApi(`/token-details?network=${network}&tokenAddress=${tokenAddress}`);
  return data.data?.attributes || null;
}
