"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import SearchModal from "@/components/modals/SearchModal";
import { getTrendingTokens } from "@/utils/api";

export default function PumpFunPage() {
  const router = useRouter();
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchTokens();
    pollRef.current = setInterval(fetchTokens, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const fetchTokens = async () => {
    try {
      // Get Solana trending pools — pump.fun tokens dominate Solana trending
      const data = await getTrendingTokens("solana");
      setTokens(data);
      setError(null);
    } catch (e) {
      setError("Failed to load tokens. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTokenClick = (token) => {
    router.push(`/${token.chainId}/${token.tokenAddress}`);
  };

  const formatPrice = (p) => {
    if (!p) return "$0";
    if (p < 0.000001) return "$" + p.toExponential(4);
    if (p < 0.001) return "$" + p.toFixed(8);
    if (p < 1) return "$" + p.toFixed(6);
    return "$" + p.toFixed(4);
  };

  const formatNumber = (n) => {
    if (!n) return "$0";
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
  };

  const formatTimeAgo = (ts) => {
    if (!ts) return "N/A";
    const s = Math.floor((Date.now() / 1000) - ts);
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  };

  return (
    <MainLayout openSearchModal={() => setSearchModalOpen(true)}>
      <div className="container px-4 py-8 mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <span className="mr-2">🚀</span> Solana Trending Tokens
        </h1>
        {loading && tokens.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dex-blue"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokens.map((token) => (
              <div
                key={token.id || token.poolAddress}
                className="bg-dex-bg-secondary rounded-lg overflow-hidden border border-dex-border cursor-pointer transition-all hover:border-dex-blue"
                onClick={() => handleTokenClick(token)}
              >
                <div className="p-4">
                  <div className="flex items-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-dex-bg-tertiary mr-3 flex items-center justify-center overflow-hidden">
                      {token.logo ? (
                        <img src={token.logo} alt={token.symbol} className="h-full w-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }} />
                      ) : (
                        <span className="text-white font-bold">{token.symbol?.charAt(0) || "?"}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{token.symbol}</h3>
                      <p className="text-sm text-dex-text-secondary truncate max-w-[200px]">{token.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div><p className="text-xs text-dex-text-secondary">Price</p><p className="font-medium text-white">{formatPrice(token.usdPrice)}</p></div>
                    <div><p className="text-xs text-dex-text-secondary">Liquidity</p><p className="font-medium text-white">{formatNumber(token.liquidityUsd)}</p></div>
                    <div><p className="text-xs text-dex-text-secondary">FDV</p><p className="font-medium text-white">{formatNumber(token.fdv || token.marketCap)}</p></div>
                    <div><p className="text-xs text-dex-text-secondary">Created</p><p className="font-medium text-white">{formatTimeAgo(token.createdAt)}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${(token.pricePercentChange?.["24h"] || 0) >= 0 ? "text-dex-green" : "text-dex-red"}`}>
                      {(token.pricePercentChange?.["24h"] || 0) >= 0 ? "+" : ""}{(token.pricePercentChange?.["24h"] || 0).toFixed(2)}% (24h)
                    </span>
                    {token.dexName && <span className="text-xs bg-dex-bg-tertiary text-dex-text-secondary px-2 py-0.5 rounded">{token.dexName}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </MainLayout>
  );
}
