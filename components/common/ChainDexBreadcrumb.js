"use client";
import { NETWORK_LABELS } from "@/utils/networks";

// DexScreener-style "Robinhood › Uniswap V3" breadcrumb. GT names DEXes on
// newer chains with the chain in parentheses ("Uniswap V3 (Robinhood)") —
// strip that suffix when the breadcrumb already names the chain.
const ChainDexBreadcrumb = ({ network, exchangeName, className = "" }) => {
  const chainLabel = NETWORK_LABELS[network] || network || "";
  let dex = exchangeName || "";
  if (chainLabel && dex.toLowerCase().endsWith(`(${chainLabel.toLowerCase()})`)) {
    dex = dex.slice(0, dex.toLowerCase().lastIndexOf(`(${chainLabel.toLowerCase()})`)).trim();
  }

  if (!chainLabel && !dex) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-dex-text-secondary ${className}`}>
      {chainLabel && <span className="font-medium text-dex-text-primary">{chainLabel}</span>}
      {chainLabel && dex && <span className="text-dex-text-tertiary">›</span>}
      {dex && <span>{dex}</span>}
    </span>
  );
};

export default ChainDexBreadcrumb;
