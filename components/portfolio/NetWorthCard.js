"use client";

const getChainIcon = (id) => { const m = { eth: "ethereum", bsc: "binance", polygon: "polygon", base: "base", arbitrum: "arbitrum", optimism: "optimism", avalanche: "avalanche", fantom: "fantom", linea: "linea", pulse: "pulse", ronin: "ronin" }; return `/chains/${m[id] || "generic"}.svg`; };
const getChainColor = (id) => ({ eth: "#627EEA", bsc: "#F3BA2F", polygon: "#8247E5", arbitrum: "#28A0F0", avalanche: "#E84142", optimism: "#FF0420", base: "#0052FF", fantom: "#1969FF" }[id] || "#888");
const fmt = (v) => { if (!v) return "$0.00"; const n = parseFloat(v); if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`; if (n >= 1e3) return `$${(n/1e3).toFixed(2)}K`; return `$${n.toFixed(2)}`; };

const NetWorthCard = ({ netWorth, loading, error }) => {
  if (loading && !netWorth) return <div className="bg-dex-bg-secondary rounded-lg p-6 mb-4 animate-pulse"><div className="h-8 bg-dex-bg-tertiary rounded w-2/3 mb-4"></div><div className="h-12 bg-dex-bg-tertiary rounded w-1/2"></div></div>;
  if (error && !netWorth) return <div className="bg-dex-bg-secondary rounded-lg p-6 mb-4"><div className="text-dex-red">{error}</div></div>;
  if (!netWorth) return <div className="bg-dex-bg-secondary rounded-lg p-6 mb-4"><div className="text-dex-text-secondary">Wallet data not available</div></div>;

  return (
    <div className="bg-dex-bg-secondary rounded-lg p-6 mb-4">
      <h2 className="text-dex-text-secondary text-sm mb-1">TOTAL NET WORTH</h2>
      <div className="text-3xl font-bold mb-4">{fmt(netWorth.total_networth_usd)}</div>
      {netWorth.chains?.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {netWorth.chains.map(c => (
            <div key={c.chain} className="bg-dex-bg-tertiary rounded-lg p-3">
              <div className="flex items-center mb-1"><div className="w-5 h-5 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: getChainColor(c.chain) }}><img src={getChainIcon(c.chain)} alt={c.chain} className="w-full h-full object-contain" /></div><div className="text-xs font-medium uppercase">{c.chain}</div></div>
              <div className="text-lg font-medium">{fmt(c.networth_usd)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetWorthCard;
