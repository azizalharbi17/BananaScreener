"use client";
import { useRouter } from "next/navigation";
import { formatNumber, formatAge, formatPrice } from "@/utils/formatters";

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
    <td className={`px-4 py-3 text-right ${!value ? "text-dex-text-secondary" : value >= 0 ? "text-dex-green" : "text-dex-red"}`}>
      {value ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%` : "-"}
    </td>
  );

  return (
    <tr onClick={() => router.push(href)} className="cursor-pointer hover:bg-dex-bg-highlight">
      <td className="px-4 py-3 text-dex-text-tertiary text-center">{rank}</td>
      <td className="px-4 py-3">
        <span className="flex items-center">
          <img
            src={token.logo || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iIzM0Mzk0NyIvPjwvc3ZnPg=="}
            alt={token.symbol}
            className="w-8 h-8 rounded-full mr-3 bg-dex-bg-tertiary"
            onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iIzM0Mzk0NyIvPjwvc3ZnPg=="; }}
          />
          <span>
            <span className="font-medium text-dex-text-primary flex items-center">
              <span>{token.symbol}</span>
              {token.dexName && <span className="ml-2 text-xs text-dex-text-tertiary">{token.dexName}</span>}
            </span>
            <span className="text-xs text-dex-text-secondary block">{token.name}</span>
          </span>
        </span>
      </td>
      <td className="px-4 py-3 text-right">${formatPrice(token.usdPrice)}</td>
      <td className="px-4 py-3 text-right text-dex-text-secondary">{formatAge(token.createdAt * 1000)}</td>
      <td className="px-4 py-3 text-right">{formatNumber(get(token, "transactions.24h"))}</td>
      <td className="px-4 py-3 text-right">${formatNumber(get(token, "totalVolume.24h"))}</td>
      <td className="px-4 py-3 text-right">{formatNumber(get(token, "buyers.24h") + get(token, "sellers.24h"))}</td>
      <PriceChangeCell value={token.pricePercentChange?.["5m"]} />
      <PriceChangeCell value={token.pricePercentChange?.["1h"]} />
      <PriceChangeCell value={token.pricePercentChange?.["6h"]} />
      <PriceChangeCell value={token.pricePercentChange?.["24h"]} />
      <td className="px-4 py-3 text-right">${formatNumber(token.liquidityUsd)}</td>
      <td className="px-4 py-3 text-right">${formatNumber(token.marketCap)}</td>
    </tr>
  );
};

export default TokenRow;
