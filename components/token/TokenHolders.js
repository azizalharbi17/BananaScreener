"use client";
import { useState, useEffect, useRef } from "react";

const blockExplorers = { "0x1": "https://etherscan.io", "0x38": "https://bscscan.com", "0x89": "https://polygonscan.com", "0xa4b1": "https://arbiscan.io", "0xa": "https://optimistic.etherscan.io", "0x2105": "https://basescan.org", solana: "https://solscan.io" };

const TokenHolders = ({ token, chainId }) => {
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
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

  useEffect(() => { if (token?.address && !isSolana) fetchHolders(); }, [token, chainId]);

  const fetchHolders = async (nextCursor = null) => {
    if (!token?.address || isSolana) return; setLoading(true);
    try {
      const url = `/api/moralis/token-holders?tokenAddress=${token.address}&chainId=${chainId}${nextCursor ? `&cursor=${nextCursor}` : ""}`;
      const data = await fetch(url).then(r => r.json());
      if (data?.result) { nextCursor ? setHolders(prev => [...prev, ...data.result]) : setHolders(data.result); setCursor(data.cursor); setHasMore(data.result.length > 0 && data.cursor); }
    } catch (e) {} finally { setLoading(false); }
  };

  const walletUrl = (addr) => { const e = blockExplorers[chainId] || ""; return e ? `${e}/address/${addr}` : "#"; };
  const fmtAddr = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "";
  const fmtUsd = (v) => v ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parseFloat(v)) : "$0.00";
  const fmtPct = (v) => v ? new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 2 }).format(parseFloat(v) / 100) : "0%";

  if (isSolana) return <div className="p-4 text-center text-dex-text-secondary">Holder data is not available for Solana tokens</div>;
  if (loading && holders.length === 0) return <div className="p-4 text-center text-dex-text-secondary">Loading holders data...</div>;

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-auto border border-dex-border bg-dex-bg-primary" style={{ height: `${tableHeight}px` }}>
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs uppercase bg-dex-bg-secondary sticky top-0 z-10">
            <tr className="border-b border-dex-border"><th className="px-4 py-3">RANK</th><th className="px-4 py-3">WALLET</th><th className="px-4 py-3">ENTITY</th><th className="px-4 py-3">TYPE</th><th className="px-4 py-3 text-right">BALANCE</th><th className="px-4 py-3 text-right">VALUE (USD)</th><th className="px-4 py-3 text-right">% OF SUPPLY</th><th className="px-4 py-3 text-right">EXP</th></tr>
          </thead>
          <tbody>
            {holders.map((h, i) => (
              <tr key={`${h.owner_address}_${i}`} className="border-b border-dex-border hover:bg-dex-bg-secondary/50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3"><a href={walletUrl(h.owner_address)} target="_blank" rel="noopener noreferrer" className="font-mono hover:text-dex-blue">{h.is_contract ? "📄" : "👤"} {fmtAddr(h.owner_address)}</a></td>
                <td className="px-4 py-3">{h.owner_address_label || <span className="text-dex-text-secondary">-</span>}</td>
                <td className="px-4 py-3">{h.is_contract ? <span className="bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded text-xs">Contract</span> : <span className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-xs">Wallet</span>}</td>
                <td className="px-4 py-3 text-right font-mono">{parseFloat(h.balance_formatted || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                <td className="px-4 py-3 text-right">{fmtUsd(h.usd_value)}</td>
                <td className="px-4 py-3 text-right">{fmtPct(h.percentage_relative_to_total_supply)}</td>
                <td className="px-4 py-3 text-right"><a href={walletUrl(h.owner_address)} target="_blank" rel="noopener noreferrer" className="text-dex-text-secondary hover:text-dex-blue">&#x2197;</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && <div className="mt-2 text-center"><button onClick={() => fetchHolders(cursor)} disabled={loading} className="px-4 py-2 bg-dex-bg-secondary hover:bg-dex-blue/20 text-dex-text-primary rounded">{loading ? "Loading..." : "Load More"}</button></div>}
      <div ref={resizeRef} className="h-2 bg-dex-bg-secondary hover:bg-dex-blue cursor-ns-resize flex items-center justify-center"><div className="w-10 h-1 bg-gray-600 rounded-full"></div></div>
    </div>
  );
};

export default TokenHolders;
