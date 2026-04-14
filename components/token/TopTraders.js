"use client";
import { useState, useEffect } from "react";
import { getTrades } from "@/utils/api";
import { BLOCK_EXPLORERS } from "@/utils/networks";

const TopTraders = ({ pair, network }) => {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pair?.pairAddress || !network) return;
    setLoading(true);
    getTrades(network, pair.pairAddress)
      .then((trades) => {
        // Aggregate trades by wallet
        const walletMap = {};
        trades.forEach((tx) => {
          const addr = tx.walletAddress;
          if (!addr) return;
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

        // Sort by total volume descending
        const sorted = Object.values(walletMap).sort((a, b) => b.totalVolume - a.totalVolume);
        setTraders(sorted.slice(0, 50));
      })
      .catch(() => setTraders([]))
      .finally(() => setLoading(false));
  }, [pair?.pairAddress, network]);

  const fmtAddr = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "";
  const fmtUsd = (v) => {
    if (!v) return "$0";
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
    return `$${v.toFixed(2)}`;
  };

  const explorer = BLOCK_EXPLORERS[network] || "";
  const walletUrl = (addr) => {
    if (!explorer) return "#";
    return network === "solana" ? `${explorer}/account/${addr}` : `${explorer}/address/${addr}`;
  };

  if (loading) return <div className="p-4 text-center text-dex-text-secondary">Analyzing top traders...</div>;
  if (traders.length === 0) return <div className="p-4 text-center text-dex-text-secondary">No trade data available</div>;

  return (
    <div className="overflow-auto" style={{ maxHeight: "500px" }}>
      <table className="w-full text-sm text-left border-collapse">
        <thead className="text-xs uppercase bg-dex-bg-secondary sticky top-0 z-10">
          <tr className="border-b border-dex-border">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">WALLET</th>
            <th className="px-4 py-3 text-right">TRADES</th>
            <th className="px-4 py-3 text-right">BUYS</th>
            <th className="px-4 py-3 text-right">SELLS</th>
            <th className="px-4 py-3 text-right">BUY VOL</th>
            <th className="px-4 py-3 text-right">SELL VOL</th>
            <th className="px-4 py-3 text-right">TOTAL VOL</th>
          </tr>
        </thead>
        <tbody>
          {traders.map((t, i) => (
            <tr key={t.address} className="border-b border-dex-border hover:bg-dex-bg-secondary/50">
              <td className="px-4 py-3 text-dex-text-tertiary">{i + 1}</td>
              <td className="px-4 py-3">
                <a href={walletUrl(t.address)} target="_blank" rel="noopener noreferrer" className="font-mono hover:text-dex-blue text-xs">
                  {fmtAddr(t.address)}
                </a>
              </td>
              <td className="px-4 py-3 text-right">{t.tradeCount}</td>
              <td className="px-4 py-3 text-right text-dex-green">{t.buys}</td>
              <td className="px-4 py-3 text-right text-dex-red">{t.sells}</td>
              <td className="px-4 py-3 text-right text-dex-green">{fmtUsd(t.buyVolume)}</td>
              <td className="px-4 py-3 text-right text-dex-red">{fmtUsd(t.sellVolume)}</td>
              <td className="px-4 py-3 text-right font-medium">{fmtUsd(t.totalVolume)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopTraders;
