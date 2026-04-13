"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import SearchModal from "@/components/modals/SearchModal";
import TokenChart from "@/components/token/TokenChart";
import TokenInfo from "@/components/token/TokenInfo";
import TokenTabs from "@/components/token/TokenTabs";
import PairSelector from "@/components/token/PairSelector";
import TokenTransactions from "@/components/token/TokenTransactions";
import { getTokenPools } from "@/utils/api";
import { PATH_TO_GT_NETWORK } from "@/utils/networks";

export default function TokenPage() {
  const { chainId: chainPath, tokenAddress } = useParams();
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const [loadingState, setLoadingState] = useState("initial");
  const [tokenInfo, setTokenInfo] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);
  const [activeTab, setActiveTab] = useState("transactions");
  const [error, setError] = useState(null);

  const network = PATH_TO_GT_NETWORK[chainPath] || chainPath;

  useEffect(() => {
    setLoadingState("initial");
    const timer = setTimeout(() => setLoadingState("data"), 300);
    return () => clearTimeout(timer);
  }, [chainPath, tokenAddress]);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const poolPairs = await getTokenPools(network, tokenAddress);
        if (poolPairs.length > 0) {
          setPairs(poolPairs);
          setSelectedPair(poolPairs[0]);
          const base = poolPairs[0].pair?.[0];
          if (base) {
            setTokenInfo({
              address: tokenAddress,
              name: base.tokenName || "Unknown",
              symbol: base.tokenSymbol || "???",
              logo: base.tokenLogo || null,
              decimals: base.tokenDecimals || "18",
            });
          }
          setLoadingState("complete");
        } else {
          setError("No trading pairs found for this token");
          setLoadingState("complete");
        }
      } catch (e) {
        setError(`Error loading token data: ${e.message}`);
        setLoadingState("complete");
      }
    };
    if (tokenAddress && network && loadingState === "data") fetchPairs();
  }, [network, tokenAddress, loadingState]);

  if (loadingState !== "complete") return (
    <MainLayout openSearchModal={() => setSearchModalOpen(true)}>
      <div className="flex-1 relative h-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-dex-blue mx-auto mb-4"></div>
            <div className="text-xl text-dex-text-secondary">Loading token data...</div>
          </div>
        </div>
      </div>
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </MainLayout>
  );

  if (error) return (
    <MainLayout openSearchModal={() => setSearchModalOpen(true)}>
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-xl text-dex-text-secondary">{error}</div>
      </div>
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </MainLayout>
  );

  return (
    <MainLayout openSearchModal={() => setSearchModalOpen(true)}>
      <div className="flex flex-col h-full bg-dex-bg-primary">
        <div className="flex flex-col lg:flex-row h-[70vh]">
          <div className="flex-1 p-4">
            <TokenChart pair={selectedPair} />
          </div>
          <div className="w-full lg:w-80 xl:w-96 border-l border-dex-border overflow-y-auto">
            {pairs.length > 1 && (
              <div className="border-b border-dex-border p-4">
                <PairSelector
                  pairs={pairs}
                  selectedPair={selectedPair}
                  onSelect={(addr) => {
                    const p = pairs.find((p) => p.pairAddress === addr);
                    if (p) setSelectedPair(p);
                  }}
                />
              </div>
            )}
            <TokenInfo token={tokenInfo} pair={selectedPair} network={network} />
          </div>
        </div>
        <div className="border-t border-dex-border">
          <TokenTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <div className="flex-1 overflow-auto">
          {activeTab === "transactions" && (
            <TokenTransactions pair={selectedPair} network={network} />
          )}
        </div>
      </div>
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </MainLayout>
  );
}
