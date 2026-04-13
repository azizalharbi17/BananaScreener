export const formatNumber = (num) => {
  if (!num) return "0";
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
  return `/images/chains/${chainMap[chainId] || "generic"}.svg`;
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
