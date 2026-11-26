"use client";
import { useState, useEffect, useRef } from "react";
import { getTrades } from "@/utils/api";
import { BLOCK_EXPLORERS } from "@/utils/networks";

// compact: condensed mobile layout — 4 columns (age, USD, price, maker),
// fills its parent's height instead of the desktop resizable panel.
const TokenTransactions = ({ pair, network, compact = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTxIds, setNewTxIds] = useState(new Set());
  const [tableHeight, setTableHeight] = useState(400);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const resizeRef = useRef(null);
  const startY = useRef(0);
  const startH = useRef(0);

  useEffect(() => {
    const el = resizeRef.current;
    if (!el || compact) return;
    const down = (e) => { startY.current = e.clientY; startH.current = tableHeight; document.addEventListener("mousemove", move); document.addEventListener("mouseup", up); };
    const move = (e) => setTableHeight(Math.max(200, startH.current + (startY.current - e.clientY)));
    const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    el.addEventListener("mousedown", down);
    return () => { el.removeEventListener("mousedown", down); };
  }, [tableHeight]);

  useEffect(() => {
    fetchTx();
    pollRef.current = setInterval(fetchNewTx, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pair, network]);

  const fetchTx = async () => {
    if (!pair?.pairAddress || !network) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTrades(network, pair.pairAddress);
      setTransactions(data);
    } catch (e) {
      console.error(e);
      if (transactions.length === 0) setError("Failed to load transactions. GeckoTerminal may be rate limiting.");
    }
    finally { setLoading(false); }
  };

  const fetchNewTx = async () => {
    if (!pair?.pairAddress || !network) return;
    try {
      const data = await getTrades(network, pair.pairAddress);
      // dedupe against prev inside the updater: `transactions` here is a
      // stale closure from mount, so it can't be used as the seen-set
      setTransactions((prev) => {
        const seen = new Set(prev.map((tx) => tx.transactionHash));
        const fresh = data.filter((tx) => !seen.has(tx.transactionHash));
        if (fresh.length === 0) return prev;
        setNewTxIds(new Set(fresh.map((tx) => tx.transactionHash)));
        setTimeout(() => setNewTxIds(new Set()), 5000);
        return [...fresh, ...prev].slice(0, 500);
      });
    } catch (e) {}
  };

  const fmtTime = (d) => { if (!d) return ""; const s = Math.floor((Date.now() - new Date(d)) / 1000); if (s < 60) return s + "s ago"; if (s < 3600) return Math.floor(s / 60) + "m ago"; if (s < 86400) return Math.floor(s / 3600) + "h ago"; return Math.floor(s / 86400) + "d ago"; };
  const fmtNum = (n, d = 0) => n == null ? "0" : parseFloat(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtPrice = (p) => { if (!p) return "$0.00"; const n = parseFloat(p); if (n < 0.0001) return "$" + n.toFixed(8); if (n < 1) return "$" + n.toFixed(6); if (n < 10000) return "$" + n.toFixed(5); return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  const fmtAddr = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "";
  const txType = (t) => { if (t === "buy") return { text: "Buy", color: "text-dex-green" }; if (t === "sell") return { text: "Sell", color: "text-dex-red" }; return { text: t || "?", color: "text-gray-500" }; };

  const explorer = BLOCK_EXPLORERS[network] || "";
  const expUrl = (hash) => explorer ? (network === "solana" ? `${explorer}/tx/${hash}` : `${explorer}/tx/${hash}`) : "#";
  const walletUrl = (addr) => explorer ? (network === "solana" ? `${explorer}/account/${addr}` : `${explorer}/address/${addr}`) : "#";

  const baseSymbol = pair?.pair?.[0]?.tokenSymbol || "TOKEN";
  const quoteSymbol = pair?.pair?.[1]?.tokenSymbol || "QUOTE";

  if (!pair) return <div className="p-4 text-center text-dex-text-secondary">No pair data available</div>;
  if (loading && transactions.length === 0) return <div className="p-4 text-center text-dex-text-secondary">Loading transactions...</div>;
  if (error && transactions.length === 0) return (
    <div className="p-4 text-center">
      <div className="text-dex-text-secondary mb-2">{error}</div>
      <button onClick={fetchTx} className="px-4 py-2 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-sm">Retry</button>
    </div>
  );
  if (!loading && transactions.length === 0) return (
    <div className="p-4 text-center">
      <div className="text-dex-text-secondary mb-2">No transactions found for this pool</div>
      <button onClick={fetchTx} className="px-4 py-2 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-sm">Refresh</button>
    </div>
  );

  if (compact) {
    return (
      <div className="h-full w-full overflow-y-auto bg-dex-bg-primary">
        <table className="w-full text-xs text-left border-collapse table-fixed">
          <thead className="text-[10px] uppercase bg-dex-bg-secondary text-dex-text-secondary sticky top-0 z-10">
            <tr className="border-b border-dex-border">
              <th className="px-2 py-2 w-[18%]">Age</th>
              <th className="px-2 py-2 text-right w-[27%]">USD</th>
              <th className="px-2 py-2 text-right w-[30%]">Price</th>
              <th className="px-2 py-2 text-right w-[25%]">Maker</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => {
              const tt = txType(tx.transactionType);
              const isNew = newTxIds.has(tx.transactionHash);
              return (
                <tr key={`${tx.transactionHash}_${i}`} className={`border-b border-dex-border ${isNew ? "animate-slide-in bg-dex-bg-highlight" : ""}`}>
                  <td className="px-2 py-2 text-dex-text-secondary whitespace-nowrap">{fmtTime(tx.blockTimestamp)}</td>
                  <td className={`px-2 py-2 text-right font-medium whitespace-nowrap ${tt.color}`}>{tx.totalValueUsd ? "$" + fmtNum(tx.totalValueUsd, 2) : "-"}</td>
                  <td className={`px-2 py-2 text-right whitespace-nowrap ${tt.color}`}>{fmtPrice(tx.baseTokenPriceUsd)}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <a href={walletUrl(tx.walletAddress)} target="_blank" rel="noopener noreferrer" className="font-mono text-dex-text-secondary hover:text-dex-blue">
                      {tx.walletAddress ? `${tx.walletAddress.slice(0, 4)}…${tx.walletAddress.slice(-3)}` : "-"}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-auto border border-dex-border bg-dex-bg-primary" style={{ height: `${tableHeight}px` }}>
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs uppercase bg-dex-bg-secondary sticky top-0 z-10">
            <tr className="border-b border-dex-border">
              <th className="px-4 py-3">DATE</th><th className="px-4 py-3">TYPE</th>
              <th className="px-4 py-3 text-right">USD</th><th className="px-4 py-3 text-right">{baseSymbol}</th>
              <th className="px-4 py-3 text-right">{quoteSymbol}</th><th className="px-4 py-3 text-right">PRICE</th>
              <th className="px-4 py-3">MAKER</th><th className="px-4 py-3 text-right">TXN</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => {
              const tt = txType(tx.transactionType);
              const isNew = newTxIds.has(tx.transactionHash);
              return (
                <tr key={`${tx.transactionHash}_${i}`} className={`border-b border-dex-border hover:bg-dex-bg-secondary/50 ${isNew ? "animate-slide-in bg-dex-bg-highlight" : ""}`}>
                  <td className="px-4 py-3 text-dex-text-secondary whitespace-nowrap">{fmtTime(tx.blockTimestamp)}</td>
                  <td className={`px-4 py-3 ${tt.color} font-medium whitespace-nowrap`}>{tt.text}</td>
                  <td className={`px-4 py-3 text-right ${tt.color} whitespace-nowrap`}>{tx.totalValueUsd ? "$" + fmtNum(tx.totalValueUsd, 2) : "-"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{tx.baseTokenAmount ? fmtNum(tx.baseTokenAmount, 4) : "-"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{tx.quoteTokenAmount ? fmtNum(tx.quoteTokenAmount, 4) : "-"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{fmtPrice(tx.baseTokenPriceUsd)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><a href={walletUrl(tx.walletAddress)} target="_blank" rel="noopener noreferrer" className="font-mono hover:text-dex-blue">{fmtAddr(tx.walletAddress)}</a></td>
                  <td className="px-4 py-3 text-right"><a href={expUrl(tx.transactionHash)} target="_blank" rel="noopener noreferrer" className="text-dex-text-secondary hover:text-dex-blue">&#x2197;</a></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div ref={resizeRef} className="h-2 bg-dex-bg-secondary hover:bg-dex-blue cursor-ns-resize flex items-center justify-center"><div className="w-10 h-1 bg-gray-600 rounded-full"></div></div>
    </div>
  );
};

export default TokenTransactions;
