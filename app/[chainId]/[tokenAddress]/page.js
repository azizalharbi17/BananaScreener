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
import TopTraders from "@/components/token/TopTraders";
import BananaMapsSheet from "@/components/token/BananaMapsSheet";
import HoldersTab from "@/components/token/HoldersTab";
import MobileTabBar from "@/components/token/MobileTabBar";
import useIsMobile from "@/components/common/useIsMobile";
import { getTokenPools } from "@/utils/api";
import { PATH_TO_GT_NETWORK } from "@/utils/networks";
import { isBananaMapsSupported } from "@/utils/bananamaps";

export default function TokenPage() {
  const { chainId: chainPath, tokenAddress } = useParams();
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const [loadingState, setLoadingState] = useState("initial");
  const [tokenInfo, setTokenInfo] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);
  const [activeTab, setActiveTab] = useState("transactions");
  const [mobileTab, setMobileTab] = useState("combo"); // info | combo | chart | txns
  const [mapsOpen, setMapsOpen] = useState(false);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  const network = PATH_TO_GT_NETWORK[chainPath] || chainPath;
  const mapsSupported = isBananaMapsSupported(network);
  const openMaps = mapsSupported ? () => setMapsOpen(true) : undefined;

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
      {isMobile ? (
        /* ── Mobile: fixed-height app shell, bottom tab bar, zero horizontal
           scroll. All three panes stay mounted (class-toggled) so switching
           tabs never reloads the TV widget or restarts trade polling. ── */
        <div className="flex flex-col h-[calc(100vh-3.5rem)] supports-[height:100dvh]:h-[calc(100dvh-3.5rem)] overflow-hidden bg-dex-bg-primary">
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div
              className={
                mobileTab === "chart"
                  ? "flex-1 min-h-0 p-2"
                  : mobileTab === "combo"
                    ? "h-[45%] shrink-0 p-2 pb-0"
                    : "hidden"
              }
            >
              <TokenChart pair={selectedPair} />
            </div>
            <div
              className={
                mobileTab === "txns" || mobileTab === "combo"
                  ? "flex-1 min-h-0 flex flex-col border-t border-dex-border"
                  : "hidden"
              }
            >
              <TokenTransactions pair={selectedPair} network={network} compact />
            </div>
            <div className={mobileTab === "info" ? "flex-1 min-h-0 overflow-y-auto" : "hidden"}>
              {pairs.length > 1 && (
                <div className="border-b border-dex-border p-3">
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
              <TokenInfo token={tokenInfo} pair={selectedPair} network={network} onOpenMaps={openMaps} />
            </div>
          </div>
          <MobileTabBar active={mobileTab} onChange={setMobileTab} />
        </div>
      ) : (
        /* ── Desktop: unchanged layout ── */
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
              <TokenInfo token={tokenInfo} pair={selectedPair} network={network} onOpenMaps={openMaps} />
            </div>
          </div>
          <div className="border-t border-dex-border">
            <TokenTabs activeTab={activeTab} onChange={setActiveTab} onOpenMaps={openMaps} />
          </div>
          <div className="flex-1 overflow-auto">
            {activeTab === "transactions" && (
              <TokenTransactions pair={selectedPair} network={network} />
            )}
            {activeTab === "holders" && (
              <HoldersTab token={tokenInfo} network={network} />
            )}
            {activeTab === "top-traders" && (
              <TopTraders pair={selectedPair} network={network} />
            )}
          </div>
        </div>
      )}
      <BananaMapsSheet
        open={mapsOpen}
        onClose={() => setMapsOpen(false)}
        token={tokenInfo}
        network={network}
        disableEscape={isSearchModalOpen}
      />
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </MainLayout>
  );
}
