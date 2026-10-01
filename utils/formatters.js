export const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1e12) return (num / 1e12).toFixed(1) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

export const formatAge = (timestamp) => {
  if (!timestamp) return "N/A";
  const now = Date.now();
  const diffSec = (now - timestamp) / 1000;
  if (diffSec < 60) return Math.floor(diffSec) + "s";
  if (diffSec < 3600) return Math.floor(diffSec / 60) + "m";
  if (diffSec < 86400) return Math.floor(diffSec / 3600) + "h";
  if (diffSec < 2592000) return Math.floor(diffSec / 86400) + "d";
  if (diffSec < 31536000) return Math.floor(diffSec / 2592000) + "mo";
  return Math.floor(diffSec / 31536000) + "y";
};

export const formatPrice = (price) => {
  if (!price) return "$0";
  if (price < 0.000001) return price.toExponential(2);
  if (price < 0.01) return price.toFixed(Math.min(8, 2 + Math.abs(Math.floor(Math.log10(price)))));
  if (price < 1000) return price.toFixed(Math.max(2, 4 - Math.floor(Math.log10(price))));
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export const formatPercentChange = (value) => {
  if (value === undefined || value === null) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

export const getChainLogoPath = (chainId) => {
  const chainMap = { "0x1": "ethereum", solana: "solana", bsc: "binance", polygon: "polygon", arbitrum: "arbitrum", optimism: "optimism", base: "base" };
  return `/chains/${chainMap[chainId] || "generic"}.svg`;
};

export const chainIdToPath = (chainId) => {
  const chainMap = { "0x1": "ethereum", solana: "solana", bsc: "bsc", polygon: "polygon", arbitrum: "arbitrum", optimism: "optimism", base: "base" };
  return chainMap[chainId] || chainId;
};

export const truncateAddress = (address, start = 6, end = 4) => {
  if (!address) return "";
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

// "$1.53M"-style compact USD (2 significant decimals under 10)
export const formatUsdCompact = (v) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!n && n !== 0) return "-";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  if (abs >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
};

// Shared placeholder token logo (dark circle)
export const PLACEHOLDER_LOGO =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iIzM0Mzk0NyIvPjwvc3ZnPg==";

// ── USD price formatting shared by the token panel, the chart axis and the
// chart's last-price readout, so every dollar figure on a token page agrees. ──

// Panel style: 4 decimals under $1000, 6 under 1¢, dust with up to 10 decimals
// and trailing zeros stripped, 2 with thousands grouping from $1000 up.
export const formatUsdPrice = (p) => {
  const n = typeof p === "string" ? parseFloat(p) : p;
  if (!n || !Number.isFinite(n)) return "$0";
  if (n < 0.00001) return "$" + n.toFixed(10).replace(/\.?0+$/, "");
  if (n < 0.01) return "$" + n.toFixed(6);
  if (n < 1000) return "$" + n.toFixed(4);
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Decimal places for a USD price AXIS around `p`: never fewer than the panel
// shows for that magnitude, and enough for ~4 significant digits on small-cap
// prices. (lightweight-charts defaults to 2 decimals, which rendered $0.004762
// as "0.00" / "0.01".) Capped at 10.
export const usdPriceDecimals = (p) => {
  const n = Math.abs(Number(p));
  if (!Number.isFinite(n) || n === 0) return 2;
  const sig = Math.max(0, 3 - Math.floor(Math.log10(n)));
  const panel = n >= 1000 ? 2 : n >= 0.01 ? 4 : n >= 0.00001 ? 6 : sig;
  return Math.min(10, Math.max(panel, sig));
};

// Axis / crosshair label at a fixed precision so tick labels line up.
export const formatUsdAxis = (p, decimals) => {
  const n = Number(p);
  if (!Number.isFinite(n)) return "";
  if (Math.abs(n) >= 1000) return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "$" + n.toFixed(decimals);
};
