// GeckoTerminal network ID → BananaMaps chain slug. BananaMaps supports only
// these chains (verified against its graph API) — every BananaMaps button,
// link, tab and embed must go through these helpers so unsupported chains get
// no map UI at all instead of a dead link to the homepage.
export const GT_TO_BANANAMAPS_CHAIN = {
  solana: "sol",
  eth: "eth",
  bsc: "bsc",
  base: "base",
  robinhood: "robinhood",
};

export const bananaMapsChain = (network) => GT_TO_BANANAMAPS_CHAIN[network] || null;

export const isBananaMapsSupported = (network) => Boolean(GT_TO_BANANAMAPS_CHAIN[network]);

// Iframe embed (errors are handled inside the embed app; always HTTP 200).
export const bananaMapsEmbedUrl = (network, address) => {
  const chain = bananaMapsChain(network);
  if (!chain || !address) return null;
  return `https://www.bananamaps.io/embed?token=${address}&chain=${chain}&theme=dark`;
};

// Full interactive app — the only correct external link target. The bare
// homepage ignores token/chain params, which is how unsupported chains used
// to end up "opening the BananaMaps homepage".
export const bananaMapsAppUrl = (network, address) => {
  const chain = bananaMapsChain(network);
  if (!chain || !address) return null;
  return `https://www.bananamaps.io/app?token=${address}&chain=${chain}`;
};
