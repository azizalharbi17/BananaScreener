"use client";

const fmt = (v) => { if (!v && v !== 0) return "$0.00"; const n = parseFloat(v); if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`; if (n >= 1e3) return `$${(n/1e3).toFixed(2)}K`; return `$${n.toFixed(2)}`; };
const fmtPct = (v) => (!v && v !== 0) ? "-" : (v >= 0 ? "+" : "") + v.toFixed(2) + "%";

const TokenHoldings = ({ tokens, loading, error, onTokenClick, selectedChain }) => {
  if (loading && tokens.length === 0) return <div className="bg-dex-bg-secondary rounded-lg p-4 animate-pulse"><div className="h-6 bg-dex-bg-tertiary rounded w-1/4 mb-4"></div>{[...Array(5)].map((_, i) => <div key={i} className="flex items-center mb-4"><div className="w-10 h-10 bg-dex-bg-tertiary rounded-full mr-3"></div><div className="flex-1"><div className="h-4 bg-dex-bg-tertiary rounded w-1/4 mb-2"></div></div></div>)}</div>;
  if (error && tokens.length === 0) return <div className="bg-dex-bg-secondary rounded-lg p-6"><div className="text-dex-red">{error}</div></div>;
  if (tokens.length === 0) return <div className="bg-dex-bg-secondary rounded-lg p-6 text-center"><p className="text-dex-text-secondary">No tokens found{selectedChain !== "all" && ` on ${selectedChain.toUpperCase()}`}</p></div>;

  return (
    <div className="bg-dex-bg-secondary rounded-lg overflow-hidden">
      <div className="p-4 border-b border-dex-border"><h2 className="font-medium">Token Holdings</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="text-xs text-dex-text-secondary uppercase border-b border-dex-border"><tr><th className="p-3 text-left">Token</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">24h</th><th className="p-3 text-right">Amount</th><th className="p-3 text-right">Value</th><th className="p-3 text-right">Portfolio %</th></tr></thead>
          <tbody>
            {tokens.map(t => (
              <tr key={t.token_address} className="border-b border-dex-border hover:bg-dex-bg-tertiary cursor-pointer" onClick={() => onTokenClick(t, selectedChain === "all" ? t.chain || "eth" : selectedChain)}>
                <td className="p-3"><div className="flex items-center"><img src={t.logo || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iIzM0Mzk0NyIvPjwvc3ZnPg=="} alt={t.symbol} className="w-8 h-8 rounded-full mr-3" onError={e => { e.target.onerror = null; e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iIzM0Mzk0NyIvPjwvc3ZnPg=="; }} /><div><div className="font-medium">{t.symbol}</div><div className="text-xs text-dex-text-secondary">{t.name}</div></div></div></td>
                <td className="p-3 text-right">${parseFloat(t.usd_price).toFixed(8)}</td>
                <td className={`p-3 text-right ${t.usd_price_24hr_percent_change >= 0 ? "text-dex-green" : "text-dex-red"}`}>{fmtPct(t.usd_price_24hr_percent_change)}</td>
                <td className="p-3 text-right">{parseFloat(t.balance_formatted || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                <td className="p-3 text-right font-medium">{fmt(t.usd_value)}</td>
                <td className="p-3 text-right">{t.portfolio_percentage?.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokenHoldings;
