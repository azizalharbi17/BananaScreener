"use client";
import { useRouter } from "next/navigation";
import { formatNumber, formatAge, formatPrice, formatUsdCompact, PLACEHOLDER_LOGO } from "@/utils/formatters";
import { NETWORK_LABELS } from "@/utils/networks";

// Fixed height keeps the virtualized scrollbar geometry exact.
export const ROW_HEIGHT = 56;

const TokenRow = ({ token, rank }) => {
  const router = useRouter();
  // chainId is already the URL path (e.g. "solana", "ethereum", "bsc") from gecko-transform
  const href = `/${token.chainId}/${token.tokenAddress}`;

  const get = (obj, path) => {
    let v = obj;
    for (const k of path.split(".")) {
      if (!v || typeof v !== "object") return 0;
      v = v[k];
    }
    return v ?? 0;
  };

  const PriceChangeCell = ({ value }) => (
    <td className={`px-4 text-right text-[13px] ${!value ? "text-dex-text-secondary" : value >= 0 ? "text-dex-green" : "text-dex-red"}`}>
      {value ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%` : "-"}
    </td>
  );

  return (
    <tr
      onClick={() => router.push(href)}
      className="cursor-pointer hover:bg-dex-bg-highlight border-b border-dex-border/40"
      style={{ height: ROW_HEIGHT }}
    >
      <td className="px-4 text-dex-text-tertiary text-center text-xs">{rank}</td>
      <td className="px-4">
        <span className="flex items-center">
          <img
            src={token.logo || PLACEHOLDER_LOGO}
            alt={token.symbol}
            className="w-8 h-8 rounded-full mr-3 bg-dex-bg-tertiary flex-shrink-0"
            onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_LOGO; }}
          />
          <span className="min-w-0">
            <span className="font-medium text-dex-text-primary flex items-center gap-1.5">
              <span>{token.symbol}</span>
              <span className="px-1 py-px text-[9px] rounded bg-dex-blue/15 text-dex-blue border border-dex-blue/30 flex-shrink-0">
                {NETWORK_LABELS[token.network] || token.network}
              </span>
              {token.dexName && <span className="text-[10px] text-dex-text-tertiary truncate">{token.dexName}</span>}
            </span>
            <span className="text-xs text-dex-text-secondary block truncate">{token.name}</span>
          </span>
        </span>
      </td>
      <td className="px-4 text-right text-[13px] font-medium">${formatPrice(token.usdPrice)}</td>
      <td className="px-4 text-right text-xs text-dex-text-secondary">{formatAge(token.createdAt * 1000)}</td>
      <td className="px-4 text-right text-[13px]">{formatNumber(get(token, "transactions.24h"))}</td>
      <td className="px-4 text-right text-[13px]">{formatUsdCompact(get(token, "totalVolume.24h"))}</td>
      <td className="px-4 text-right text-[13px]">{formatNumber(get(token, "buyers.24h") + get(token, "sellers.24h"))}</td>
      <PriceChangeCell value={token.pricePercentChange?.["5m"]} />
      <PriceChangeCell value={token.pricePercentChange?.["1h"]} />
      <PriceChangeCell value={token.pricePercentChange?.["6h"]} />
      <PriceChangeCell value={token.pricePercentChange?.["24h"]} />
      <td className="px-4 text-right text-[13px]">{formatUsdCompact(token.liquidityUsd)}</td>
      <td className="px-4 text-right text-[13px]">{formatUsdCompact(token.marketCap)}</td>
    </tr>
  );
};

export default TokenRow;
