// In-memory cache with TTL, retry, and stale-on-error
const cache = new Map();
const CACHE_TTL = 60000; // 60 seconds

const GT_HEADERS = {
  Accept: "application/json;version=20230302",
};

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) return item.data;
  return null;
}

function getStale(key) {
  const item = cache.get(key);
  return item ? item.data : null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  // Prune if too large
  if (cache.size > 300) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now - v.timestamp > CACHE_TTL * 5) cache.delete(k);
    }
  }
}

/**
 * Fetch from GeckoTerminal with caching, retry on 429/502, and stale fallback.
 * @param {string} cacheKey - Unique cache key
 * @param {string} url - GeckoTerminal URL to fetch
 * @param {number} ttl - Cache TTL override (default 60s)
 * @returns {Promise<object>} - JSON response
 */
export async function cachedFetch(cacheKey, url, ttl = CACHE_TTL) {
  // Check cache first
  const item = cache.get(cacheKey);
  if (item && Date.now() - item.timestamp < ttl) {
    console.log("CACHE HIT:", cacheKey);
    return item.data;
  }

  console.log("CACHE MISS:", cacheKey, "→ fetching:", url);

  // Try fetching
  const attempt = async () => {
    const res = await fetch(url, { headers: GT_HEADERS });
    if (!res.ok) {
      const status = res.status;
      throw new Error(`${status}`);
    }
    return res.json();
  };

  try {
    const data = await attempt();
    setCache(cacheKey, data);
    console.log("CACHE SET:", cacheKey);
    return data;
  } catch (err) {
    const status = parseInt(err.message);

    // Retry once on 429 or 502 after 2 second delay
    if (status === 429 || status === 502) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const data = await attempt();
        setCache(cacheKey, data);
        return data;
      } catch (retryErr) {
        // Return stale cached data if available
        const stale = getStale(cacheKey);
        if (stale) return stale;
        throw retryErr;
      }
    }

    // For other errors, return stale data if available
    const stale = getStale(cacheKey);
    if (stale) return stale;
    throw err;
  }
}
