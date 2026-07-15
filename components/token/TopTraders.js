"use client";
import { useState, useEffect } from "react";
import { getTrades } from "@/utils/api";
import { BLOCK_EXPLORERS } from "@/utils/networks";
import { formatUsdCompact, formatAge, truncateAddress } from "@/utils/formatters";

// Most active wallets aggregated from GT's recent-trades feed for this pool.
// Honest scope: only the trades GT returns (typically the last few hundred) —
// the actual window is computed from the data and shown in the header.
// No PnL columns: we don't have cost-basis data and won't fabricate it.
const TopTraders = ({ pair, network }) => {
  const [traders, setTraders] = useState([]);
  const [windowLabel, setWindowLabel] = useState("");
  const [tradeCount, setTradeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pair?.pairAddress || !network) return;
    setLoading(true);
    getTrades(network, pair.pairAddress)
      .then((trades) => {
        const walletMap = {};
        let oldest = Infinity;
        trades.forEach((tx) => {
          const addr = tx.walletAddress;
          if (!addr) return;
          const ts = tx.blockTimestamp ? Date.parse(tx.blockTimestamp) : null;
          if (ts && ts < oldest) oldest = ts;
          if (!walletMap[addr]) {
            walletMap[addr] = { address: addr, buys: 0, sells: 0, buyVolume: 0, sellVolume: 0, totalVolume: 0, tradeCount: 0 };
          }
          const w = walletMap[addr];
          const vol = tx.totalValueUsd || 0;
          w.tradeCount++;
          w.totalVolume += vol;
          if (tx.transactionType === "buy") { w.buys++; w.buyVolume += vol; }
          else if (tx.transactionType === "sell") { w.sells++; w.sellVolume += vol; }
        });
        setTraders(Object.values(walletMap).sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 50));
        setTradeCount(trades.length);
        setWindowLabel(oldest !== Infinity ? `last ${formatAge(oldest)}` : "");
      })
      .catch(() => setTraders([]))
      .finally(() => setLoading(false));
  }, [pair?.pairAddress, network]);

  const explorer = BLOCK_EXPLORERS[network] || "";
  const walletUrl = (addr) =>
    !explorer ? "#" : network === "solana" ? `${explorer}/account/${addr}` : `${explorer}/address/${addr}`;

  if (loading)
    return (
      <div className="p-10 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dex-blue mx-auto mb-3" />
        <div className="text-sm text-dex-text-secondary">Aggregating recent trades…</div>
      </div>
    );

  if (traders.length === 0)
    return <div className="p-10 text-center text-dex-text-secondary text-sm">No recent trades to aggregate.</div>;

  return (
    <div className="overflow-x-auto">
      <div className="px-4 py-2.5 text-xs text-dex-text-secondary border-b border-dex-border">
        Most active wallets by volume · {tradeCount} recent trades{windowLabel ? ` · ${windowLabel}` : ""}
      </div>
      <table className="w-full text-sm text-left border-collapse">
        <thead className="text-xs uppercase bg-dex-bg-secondary sticky top-0 z-10">
          <tr className="border-b border-dex-border">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">WALLET</th>
            <th className="px-4 py-3 text-right">BUY VOL</th>
            <th className="px-4 py-3 text-right">SELL VOL</th>
            <th className="px-4 py-3 text-right">TOTAL VOL</th>
            <th className="px-4 py-3 text-right">BUYS</th>
            <th className="px-4 py-3 text-right">SELLS</th>
            <th className="px-4 py-3 text-right">TXNS</th>
            <th className="px-4 py-3 text-right">EXP</th>
          </tr>
        </thead>
        <tbody>
          {traders.map((t, i) => (
            <tr key={t.address} className="border-b border-dex-border hover:bg-dex-bg-secondary/50">
              <td className="px-4 py-2.5 text-dex-text-tertiary">{i + 1}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{truncateAddress(t.address)}</td>
              <td className="px-4 py-2.5 text-right text-dex-green">{formatUsdCompact(t.buyVolume)}</td>
              <td className="px-4 py-2.5 text-right text-dex-red">{formatUsdCompact(t.sellVolume)}</td>
              <td className="px-4 py-2.5 text-right font-medium">{formatUsdCompact(t.totalVolume)}</td>
              <td className="px-4 py-2.5 text-right text-dex-green">{t.buys}</td>
              <td className="px-4 py-2.5 text-right text-dex-red">{t.sells}</td>
              <td className="px-4 py-2.5 text-right">{t.tradeCount}</td>
              <td className="px-4 py-2.5 text-right">
                <a href={walletUrl(t.address)} target="_blank" rel="noopener noreferrer" className="text-dex-text-secondary hover:text-dex-text-primary">↗</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopTraders;
