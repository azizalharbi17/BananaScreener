"use client";
import React from "react";
import { useRouter } from "next/navigation";

const SearchResults = ({ results, onClose, activeIndex = -1 }) => {
  const router = useRouter();
  const resultsList = Array.isArray(results) ? results : (results?.result || results?.data || []);

  const formatPrice = (price) => {
    if (!price) return "$0.00";
    if (price < 0.00001) return "$" + price.toFixed(10).replace(/\.?0+$/, "");
    if (price < 0.01) return "$" + price.toFixed(6);
    if (price < 1000) return "$" + price.toFixed(4);
    return "$" + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getChainIcon = (chainId) => {
    const chainMap = { ethereum: "ethereum", eth: "ethereum", solana: "solana", bsc: "binance", polygon: "polygon", polygon_pos: "polygon", base: "base", arbitrum: "arbitrum", optimism: "optimism", avax: "avalanche", fantom: "fantom" };
    return `/images/chains/${chainMap[chainId] || "generic"}.svg`;
  };

  const handleTokenClick = (token) => {
    router.push(`/${token.chainId}/${token.tokenAddress}`);
    onClose();
  };

  if (resultsList.length === 0) {
    return <div className="p-4 text-center text-gray-400">No results found</div>;
  }

  return (
    <div>
      {resultsList.map((token, index) => (
        <div
          key={`${token.chainId}-${token.tokenAddress}-${token.poolAddress || index}`}
          data-search-result={index}
          ref={index === activeIndex ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
          className={`p-4 cursor-pointer border-b border-dex-border flex items-center ${index === activeIndex ? "bg-dex-bg-highlight" : "hover:bg-dex-bg-highlight"}`}
          onClick={() => handleTokenClick(token)}
        >
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0 relative mr-3">
              <img
                src={token.logo || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iIzU0NTQ1NCIvPjwvc3ZnPg=="}
                alt={token.symbol}
                className="w-10 h-10 rounded-full bg-dex-bg-tertiary"
                onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iIzU0NTQ1NCIvPjwvc3ZnPg=="; }}
              />
              <img src={getChainIcon(token.chainId || token.network)} alt="Chain" className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full border border-dex-border bg-dex-bg-secondary" onError={(e) => { e.target.src = "/images/chains/generic.svg"; }} />
            </div>
            <div>
              <div className="font-medium flex items-center">
                <span className="text-white">{token.symbol}</span>
                {token.pairLabel && <span className="ml-2 text-xs text-dex-text-tertiary">{token.pairLabel}</span>}
              </div>
              <div className="text-sm text-dex-text-secondary">{token.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{formatPrice(token.usdPrice)}</div>
            {token.pricePercentChange?.["24h"] !== undefined && (
              <div className={`text-sm ${token.pricePercentChange["24h"] >= 0 ? "text-dex-green" : "text-dex-red"}`}>
                {(token.pricePercentChange["24h"] >= 0 ? "+" : "") + token.pricePercentChange["24h"].toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
