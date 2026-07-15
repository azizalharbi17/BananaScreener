"use client";
import { useState, useEffect, useRef } from "react";
import TradingViewChart from "./TradingViewChart";
import GeckoChart from "./GeckoChart";
import ChainDexBreadcrumb from "@/components/common/ChainDexBreadcrumb";

const TokenChart = ({ pair }) => {
  const [chartMode, setChartMode] = useState("tradingview");
  const userToggledRef = useRef(false);
  const timerRef = useRef(null);

  // Auto-switch to GeckoChart after 4 seconds unless user manually toggled
  useEffect(() => {
    userToggledRef.current = false;
    setChartMode("tradingview");

    timerRef.current = setTimeout(() => {
      if (!userToggledRef.current) {
        setChartMode("gecko");
      }
    }, 4000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pair?.pairAddress]);

  const handleToggle = (mode) => {
    userToggledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setChartMode(mode);
  };

  if (!pair) {
    return (
      <div className="h-full flex items-center justify-center text-dex-text-secondary">
        No chart data available
      </div>
    );
  }

  const rawSymbol = pair.pair?.[0]?.tokenSymbol || "BTC";
  const cleanSymbol = rawSymbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const tradingViewSymbol = cleanSymbol + "USD";

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center flex-wrap gap-2 mb-3">
        <span className="font-medium text-dex-text-primary">{pair.pairLabel}</span>
        <ChainDexBreadcrumb network={pair.chainId} exchangeName={pair.exchangeName} className="text-sm" />
        <span className="text-dex-text-secondary text-sm">
          Vol: ${(pair.volume24hrUsd || 0).toLocaleString()} | Liq: ${(pair.liquidityUsd || 0).toLocaleString()}
        </span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => handleToggle("gecko")}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              chartMode === "gecko"
                ? "bg-dex-blue text-white"
                : "bg-dex-bg-tertiary text-dex-text-secondary hover:bg-dex-bg-highlight"
            }`}
          >
            📊 OHLCV
          </button>
          <button
            onClick={() => handleToggle("tradingview")}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              chartMode === "tradingview"
                ? "bg-dex-blue text-white"
                : "bg-dex-bg-tertiary text-dex-text-secondary hover:bg-dex-bg-highlight"
            }`}
          >
            📺 TradingView
          </button>
        </div>
      </div>
      <div className="flex-1 bg-dex-bg-secondary rounded-lg overflow-hidden">
        {chartMode === "tradingview" ? (
          <TradingViewChart symbol={tradingViewSymbol} />
        ) : (
          <GeckoChart pair={pair} />
        )}
      </div>
    </div>
  );
};

export default TokenChart;
