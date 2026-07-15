"use client";
import { useRouter } from "next/navigation";

const TopBar = ({ chainId, sortBy, onSortChange }) => {
  const router = useRouter();
  const networks = [
    { id: "", name: "All Chains", icon: "🌐" },
    { id: "solana", name: "Solana", icon: "🟣" },
    { id: "ethereum", name: "Ethereum", icon: "🔷" },
    { id: "base", name: "Base", icon: "🅱️" },
    { id: "bsc", name: "BSC", icon: "🟡" },
    { id: "arbitrum", name: "Arbitrum", icon: "🔵" },
    { id: "polygon", name: "Polygon", icon: "🟣" },
    { id: "robinhood", name: "Robinhood", icon: "🪶" },
  ];
  const pages = [
    { id: "portfolio", name: "Portfolio", icon: "💼" },
    { id: "pumpfun", name: "Pump.fun", icon: "🚀" },
  ];

  return (
    <div className="bg-dex-bg-secondary border-b border-dex-border p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex space-x-2">
            {networks.map((network) => (
              <button
                key={network.id}
                className={`flex items-center px-3 py-2 rounded text-sm ${
                  (network.id === "" && chainId === undefined) || chainId === network.id
                    ? "bg-dex-blue text-white"
                    : "bg-dex-bg-tertiary text-dex-text-primary hover:bg-dex-bg-highlight"
                }`}
                onClick={() => router.push(`/${network.id}`)}
              >
                <span className="mr-1">{network.icon}</span>
                {network.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex space-x-2">
            {pages.map((page) => (
              <button
                key={page.id}
                className="flex items-center bg-dex-bg-tertiary hover:bg-dex-bg-highlight text-dex-text-primary rounded px-3 py-2 text-sm"
                onClick={() => router.push(`/${page.id}`)}
              >
                <span className="mr-1">{page.icon}</span>
                {page.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center text-dex-text-secondary">
          <span className="mr-2">Sort by:</span>
          <select className="bg-dex-bg-tertiary rounded px-2 py-1 text-dex-text-primary" value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
            <option value="">Default</option>
            <option value="totalVolume.24h">Volume 24H</option>
            <option value="marketCap">Market Cap</option>
            <option value="liquidityUsd">Liquidity</option>
            <option value="pricePercentChange.24h">Price Change 24H</option>
            <option value="transactions.24h">Transactions 24H</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
