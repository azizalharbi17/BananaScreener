"use client";
import { useState, useEffect, useCallback } from "react";
import TradingViewChart from "./TradingViewChart";
import GeckoChart from "./GeckoChart";
import ChainDexBreadcrumb from "@/components/common/ChainDexBreadcrumb";
import { getTokenDetails, getTokenInfo, resolveTradingViewSymbol } from "@/utils/api";

// The pool (OHLCV) chart is the primary chart on every chain: it is the only
// chart of the pair this page describes, and it works for every pool
// GeckoTerminal indexes, Robinhood included.
//
// TradingView is an opt-in secondary view of the token's centralized-exchange
// price, offered only when BOTH hold:
//   1. the token has a CoinGecko coin id (GeckoTerminal token info) — i.e. it
//      is actually listed somewhere TradingView could index; and
//   2. TradingView's symbol search returns an instrument whose base-asset NAME
//      matches this token (see /api/tv-symbol), not merely its ticker.
// Bare tickers collide constantly ("AI", "MEME", "PONS" all resolved to other
// coins) and TradingView has no DEX feed for newer chains, so the previous
// ticker-only "exists" check rendered other projects' charts. A failed lookup
// counts as unavailable: a missing CEX toggle is harmless, a wrong chart is not.
const TokenChart = ({ pair }) => {
  const [chartMode, setChartMode] = useState("pool"); // "pool" | "tv"
  const [tv, setTv] = useState({ status: "checking" }); // checking | available | unavailable
  const [tvFailed, setTvFailed] = useState(false);

  const network = pair?.chainId;
  const base = pair?.pair?.[0];
  const baseAddress = base?.tokenAddress;
  const tokenKey = network && baseAddress ? `${network}:${baseAddress}` : "";

  useEffect(() => {
    setChartMode("pool");
    setTvFailed(false);
    if (!tokenKey) {
      setTv({ status: "unavailable", reason: "no-token" });
      return;
    }
    setTv({ status: "checking" });
    let cancelled = false;
    (async () => {
      const [details, info] = await Promise.allSettled([
        getTokenDetails(network, baseAddress),
        getTokenInfo(network, baseAddress),
      ]);
      const d = details.status === "fulfilled" ? details.value : null;
      const i = info.status === "fulfilled" ? info.value : null;
      const coinId = d?.coingecko_coin_id || i?.coingecko_coin_id || null;
      if (cancelled) return;
      if (!coinId) {
        setTv({ status: "unavailable", reason: "not-listed" });
        return;
      }
      const ticker = String(d?.symbol || i?.symbol || base?.tokenSymbol || "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();
      const name = d?.name || i?.name || base?.tokenName || "";
      const r = await resolveTradingViewSymbol({ ticker, name, coinId });
      if (cancelled) return;
      if (r?.match) {
        setTv({ status: "available", symbol: r.symbol, description: r.description, exchange: r.exchange });
      } else {
        setTv({ status: "unavailable", reason: r?.match === null ? "lookup-failed" : "no-match" });
      }
    })().catch(() => {
      if (!cancelled) setTv({ status: "unavailable", reason: "error" });
    });
    return () => {
      cancelled = true;
    };
  }, [tokenKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // If the TradingView embed itself dies, go straight back to the pool chart.
  const handleTvFail = useCallback(() => {
    setTvFailed(true);
    setChartMode("pool");
  }, []);

  if (!pair) {
    return (
      <div className="h-full flex items-center justify-center text-dex-text-secondary">
        No chart data available
      </div>
    );
  }

  const tvAvailable = tv.status === "available";
  const showingTv = chartMode === "tv" && tvAvailable;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center flex-wrap gap-2 mb-3">
        <span className="font-medium text-dex-text-primary">{pair.pairLabel}</span>
        <ChainDexBreadcrumb network={pair.chainId} exchangeName={pair.exchangeName} className="text-sm" />
        <span className="text-dex-text-secondary text-sm hidden sm:inline">
          Vol: ${(pair.volume24hrUsd || 0).toLocaleString()} | Liq: ${(pair.liquidityUsd || 0).toLocaleString()}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {tvFailed && (
            <span className="text-[10px] text-dex-text-tertiary mr-1">TradingView didn&apos;t load</span>
          )}
          <button
            onClick={() => setChartMode("pool")}
            title="On-chain candles for this exact pool (GeckoTerminal)"
            data-testid="chart-mode-pool"
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              !showingTv ? "bg-dex-blue text-white" : "bg-dex-bg-tertiary text-dex-text-secondary hover:bg-dex-bg-highlight"
            }`}
          >
            📊 Pool chart
          </button>
          {tvAvailable && (
            <button
              onClick={() => setChartMode("tv")}
              title={`${tv.description} on ${tv.exchange} via TradingView — centralized-exchange price, not this pool`}
              data-testid="chart-mode-tv"
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                showingTv ? "bg-dex-blue text-white" : "bg-dex-bg-tertiary text-dex-text-secondary hover:bg-dex-bg-highlight"
              }`}
            >
              📺 CEX · TradingView
            </button>
          )}
        </div>
      </div>
      {showingTv && (
        <div
          className="mb-2 px-3 py-1.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-[11px] text-yellow-300"
          data-testid="cex-chart-notice"
        >
          Centralized-exchange price via TradingView ({tv.symbol}). This is not this pool&apos;s trades.
          Switch to Pool chart for on-chain candles.
        </div>
      )}
      <div className="flex-1 min-h-0 bg-dex-bg-secondary rounded-lg overflow-hidden">
        {showingTv ? (
          <TradingViewChart symbol={tv.symbol} onFail={handleTvFail} />
        ) : (
          <GeckoChart pair={pair} />
        )}
      </div>
    </div>
  );
};

export default TokenChart;
