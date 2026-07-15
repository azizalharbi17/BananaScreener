// URL path segment → GeckoTerminal network ID
export const PATH_TO_GT_NETWORK = {
  solana: "solana",
  ethereum: "eth",
  bsc: "bsc",
  binance: "bsc",
  polygon: "polygon_pos",
  arbitrum: "arbitrum",
  base: "base",
  optimism: "optimism",
  avalanche: "avax",
  fantom: "fantom",
  linea: "linea",
  pulse: "pulsechain",
  ronin: "ronin",
  robinhood: "robinhood",
};

// GeckoTerminal network ID → URL path segment
export const GT_NETWORK_TO_PATH = {
  solana: "solana",
  eth: "ethereum",
  bsc: "bsc",
  polygon_pos: "polygon",
  arbitrum: "arbitrum",
  base: "base",
  optimism: "optimism",
  avax: "avalanche",
  fantom: "fantom",
  linea: "linea",
  pulsechain: "pulse",
  ronin: "ronin",
  robinhood: "robinhood",
};

// GeckoTerminal network ID → human-readable chain name (breadcrumbs, badges)
export const NETWORK_LABELS = {
  solana: "Solana",
  eth: "Ethereum",
  bsc: "BSC",
  polygon_pos: "Polygon",
  arbitrum: "Arbitrum",
  base: "Base",
  optimism: "Optimism",
  avax: "Avalanche",
  fantom: "Fantom",
  linea: "Linea",
  pulsechain: "PulseChain",
  ronin: "Ronin",
  robinhood: "Robinhood",
};

// Hex chain IDs → GeckoTerminal network
export const CHAIN_ID_TO_GT_NETWORK = {
  "0x1": "eth",
  "0x38": "bsc",
  "0x89": "polygon_pos",
  "0xa4b1": "arbitrum",
  "0x2105": "base",
  "0xa": "optimism",
  "0xa86a": "avax",
  "0xfa": "fantom",
  "0xe708": "linea",
  "0x171": "pulsechain",
  "0x7e4": "ronin",
  solana: "solana",
};

// Block explorers by GT network
export const BLOCK_EXPLORERS = {
  eth: "https://etherscan.io",
  bsc: "https://bscscan.com",
  polygon_pos: "https://polygonscan.com",
  arbitrum: "https://arbiscan.io",
  optimism: "https://optimistic.etherscan.io",
  base: "https://basescan.org",
  avax: "https://snowtrace.io",
  fantom: "https://ftmscan.com",
  linea: "https://lineascan.build",
  pulsechain: "https://scan.pulsechain.com",
  ronin: "https://app.roninchain.com",
  solana: "https://solscan.io",
  robinhood: "https://robinhoodchain.blockscout.com",
};
