"use client";
import TradingViewChart from "./TradingViewChart";

const TokenChart = ({ pair }) => {
  if (!pair) {
    return (
      <div className="h-full flex items-center justify-center text-dex-text-secondary">
        No chart data available
      </div>
    );
  }

  const rawSymbol = (pair.pair?.[0]?.tokenSymbol || "BTC");
  const cleanSymbol = rawSymbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const tradingViewSymbol = cleanSymbol + "USD";

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center flex-wrap gap-2 mb-3">
        <span className="font-medium text-dex-text-primary">{pair.pairLabel}</span>
        <span className="text-dex-text-secondary text-sm">on {pair.exchangeName}</span>
        <span className="text-dex-text-secondary text-sm">
          Vol: ${(pair.volume24hrUsd || 0).toLocaleString()} | Liq: ${(pair.liquidityUsd || 0).toLocaleString()}
        </span>
      </div>
      <div className="flex-1 bg-dex-bg-secondary rounded-lg overflow-hidden">
        <TradingViewChart symbol={tradingViewSymbol} />
      </div>
    </div>
  );
};

export default TokenChart;
