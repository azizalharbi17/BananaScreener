"use client";
import { useState, useEffect, useRef } from "react";

const blockExplorers = { "0x1": "https://etherscan.io", "0x38": "https://bscscan.com", "0x89": "https://polygonscan.com", "0xa4b1": "https://arbiscan.io", "0xa": "https://optimistic.etherscan.io", "0x2105": "https://basescan.org", solana: "https://solscan.io" };

const TokenSnipers = ({ pair, chainId }) => {
  const [snipers, setSnipers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableHeight, setTableHeight] = useState(400);
  const resizeRef = useRef(null); const startY = useRef(0); const startH = useRef(0);
  const isSolana = chainId === "solana";

  useEffect(() => {
    const el = resizeRef.current; if (!el) return;
    const down = (e) => { startY.current = e.clientY; startH.current = tableHeight; document.addEventListener("mousemove", move); document.addEventListener("mouseup", up); };
    const move = (e) => setTableHeight(Math.max(200, startH.current + (startY.current - e.clientY)));
    const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    el.addEventListener("mousedown", down);
    return () => { el.removeEventListener("mousedown", down); };
  }, [tableHeight]);

  useEffect(() => {
    if (!pair?.pairAddress) return; setLoading(true);
    fetch(`/api/moralis/snipers?pairAddress=${pair.pairAddress}&chainId=${chainId}`)
      .then(r => r.json()).then(data => { if (data?.result) setSnipers(data.result); }).catch(() => {}).finally(() => setLoading(false));
  }, [pair, chainId]);

  const walletUrl = (addr) => { const e = blockExplorers[chainId] || ""; if (!e) return "#"; return isSolana ? `${e}/account/${addr}` : `${e}/address/${addr}`; };
  const fmtAddr = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "";
  const fmtUsd = (v) => v ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parseFloat(v)) : "$0.00";
  const fmtPct = (v) => v ? new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 2 }).format(parseFloat(v) / 100) : "0%";

  if (!pair) return <div className="p-4 text-center text-dex-text-secondary">No pair data available</div>;
  if (loading && snipers.length === 0) return <div className="p-4 text-center text-dex-text-secondary">Loading snipers data...</div>;

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-auto border border-dex-border bg-dex-bg-primary" style={{ height: `${tableHeight}px` }}>
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs uppercase bg-dex-bg-secondary sticky top-0 z-10">
            <tr className="border-b border-dex-border"><th className="px-4 py-3">WALLET</th><th className="px-4 py-3">FIRST BUY</th><th className="px-4 py-3 text-right">BUYS</th><th className="px-4 py-3 text-right">SELLS</th><th className="px-4 py-3 text-right">BOUGHT (USD)</th><th className="px-4 py-3 text-right">SOLD (USD)</th><th className="px-4 py-3 text-right">PROFIT (USD)</th><th className="px-4 py-3 text-right">ROI</th><th className="px-4 py-3 text-right">CURRENT BALANCE</th></tr>
          </thead>
          <tbody>
            {snipers.map((s, i) => { const profitColor = s.realizedProfitPercentage > 0 ? "text-dex-green" : s.realizedProfitPercentage < 0 ? "text-dex-red" : "text-gray-500"; return (
              <tr key={`${s.walletAddress}_${i}`} className="border-b border-dex-border hover:bg-dex-bg-secondary/50">
                <td className="px-4 py-3"><a href={walletUrl(s.walletAddress)} target="_blank" rel="noopener noreferrer" className="font-mono hover:text-dex-blue">{fmtAddr(s.walletAddress)}</a></td>
                <td className="px-4 py-3 text-dex-text-secondary">{s.snipedTransactions?.[0]?.transactionTimestamp ? new Date(s.snipedTransactions[0].transactionTimestamp).toLocaleString() : "Unknown"}</td>
                <td className="px-4 py-3 text-right">{s.totalSnipedTransactions || 0}</td>
                <td className="px-4 py-3 text-right">{s.totalSellTransactions || 0}</td>
                <td className="px-4 py-3 text-right">{fmtUsd(s.totalSnipedUsd)}</td>
                <td className="px-4 py-3 text-right">{fmtUsd(s.totalSoldUsd)}</td>
                <td className={`px-4 py-3 text-right ${profitColor} font-medium`}>{fmtUsd(s.realizedProfitUsd)}</td>
                <td className={`px-4 py-3 text-right ${profitColor} font-medium`}>{fmtPct(s.realizedProfitPercentage)}</td>
                <td className="px-4 py-3 text-right">{fmtUsd(s.currentBalanceUsdValue)}</td>
              </tr>
            ); })}
          </tbody>
        </table>
      </div>
      <div ref={resizeRef} className="h-2 bg-dex-bg-secondary hover:bg-dex-blue cursor-ns-resize flex items-center justify-center"><div className="w-10 h-1 bg-gray-600 rounded-full"></div></div>
    </div>
  );
};

export default TokenSnipers;
