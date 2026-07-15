"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import TradingViewChart from "./TradingViewChart";
import GeckoChart from "./GeckoChart";
import ChainDexBreadcrumb from "@/components/common/ChainDexBreadcrumb";

// TradingView is always the primary chart. The OHLCV fallback renders only if
// the TV widget errors / times out, or the symbol doesn't exist on TV at all
// (very new tokens) — a successfully rendered TV chart is never replaced.
const TokenChart = ({ pair }) => {
  const [chartMode, setChartMode] = useState("tradingview");
  const userToggledRef = useRef(false);
  const tvReadyRef = useRef(false);

  const pairAddress = pair?.pairAddress;
  const rawSymbol = pair?.pair?.[0]?.tokenSymbol || "BTC";
  const cleanSymbol = rawSymbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const tradingViewSymbol = cleanSymbol + "USD";

  useEffect(() => {
    userToggledRef.current = false;
    tvReadyRef.current = false;
    setChartMode("tradingview");

    // Ask our proxy whether TV knows this symbol. exists:false → fall back
    // immediately (the widget would only show "Invalid symbol", which the
    // iframe-load check can't detect cross-origin). exists:null (proxy
    // unavailable) → keep TV and let the widget timeout be the judge.
    let cancelled = false;
    fetch(`/api/tv-symbol?symbol=${encodeURIComponent(tradingViewSymbol)}`)
      .then((res) => (res.ok ? res.json() : { exists: null }))
      .then(({ exists }) => {
        if (cancelled || userToggledRef.current) return;
        if (exists === false) setChartMode("gecko");
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pairAddress, tradingViewSymbol]);

  const handleTvReady = useCallback(() => {
    tvReadyRef.current = true;
  }, []);

  const handleTvFail = useCallback(() => {
    if (!userToggledRef.current && !tvReadyRef.current) setChartMode("gecko");
  }, []);

  const handleToggle = (mode) => {
    userToggledRef.current = true;
    setChartMode(mode);
  };

  if (!pair) {
    return (
      <div className="h-full flex items-center justify-center text-dex-text-secondary">
        No chart data available
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center flex-wrap gap-2 mb-3">
        <span className="font-medium text-dex-text-primary">{pair.pairLabel}</span>
        <ChainDexBreadcrumb network={pair.chainId} exchangeName={pair.exchangeName} className="text-sm" />
        <span className="text-dex-text-secondary text-sm hidden sm:inline">
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
      <div className="flex-1 min-h-0 bg-dex-bg-secondary rounded-lg overflow-hidden">
        {chartMode === "tradingview" ? (
          <TradingViewChart symbol={tradingViewSymbol} onReady={handleTvReady} onFail={handleTvFail} />
        ) : (
          <GeckoChart pair={pair} />
        )}
      </div>
    </div>
  );
};

export default TokenChart;
