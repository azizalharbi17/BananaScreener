"use client";
import { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, ChartTooltip, Legend);

const TokenHolderInsights = ({ token, chainId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const isSolana = chainId === "solana";

  useEffect(() => {
    if (!token?.address || isSolana) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/moralis/holder-insights?tokenAddress=${token.address}&chainId=${chainId}`)
      .then(r => r.json()).then(setInsights).catch(() => {}).finally(() => setLoading(false));
  }, [token, chainId]);

  const fmtNum = (n) => n == null ? "0" : parseFloat(n).toLocaleString();
  const fmtPct = (v) => v ? new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 2 }).format(v / 100) : "0%";

  if (isSolana) return <div className="p-4 text-center text-dex-text-secondary">Holder insights are not available for Solana tokens</div>;
  if (loading) return <div className="p-4 text-center text-dex-text-secondary">Loading holder insights...</div>;
  if (!insights) return <div className="p-4 text-center text-dex-text-secondary">No holder insights available</div>;

  const { swap = 0, transfer = 0, airdrop = 0 } = insights.holdersByAcquisition || {};
  const total = insights.totalHolders || 1;
  const acqData = { labels: ["Swap", "Transfer", "Airdrop"], datasets: [{ data: [swap, transfer, airdrop], backgroundColor: ["rgba(240, 185, 11, 0.8)", "rgba(139, 92, 246, 0.8)", "rgba(16, 185, 129, 0.8)"], borderWidth: 1 }] };
  const acqOptions = { responsive: true, maintainAspectRatio: false, cutout: "50%", plugins: { legend: { position: "right", labels: { color: "#a89878", usePointStyle: true, padding: 20 } }, tooltip: { backgroundColor: "#121008", titleColor: "#f3f4f6", bodyColor: "#f3f4f6", borderColor: "#2e2818", borderWidth: 1 } } };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      <div className="bg-dex-bg-secondary rounded-lg p-4 border border-dex-border">
        <h3 className="text-lg font-semibold mb-1">Holders Trend</h3><p className="text-sm text-dex-text-secondary mb-4">Change in amount over time.</p>
        <div className="space-y-4">
          {insights.holderChange && Object.entries(insights.holderChange).sort((a, b) => { const o = ["5min","1h","6h","24h","3d","7d","30d"]; return o.indexOf(a[0]) - o.indexOf(b[0]); }).map(([tf, data]) => (
            <div key={tf} className="flex justify-between items-center border-b border-dex-border pb-2">
              <span className="uppercase font-medium">{tf}</span>
              <div className="flex items-center"><span className={`mr-2 ${data.change > 0 ? "text-dex-green" : data.change < 0 ? "text-dex-red" : "text-dex-text-secondary"}`}>{data.change > 0 ? "+" : ""}{fmtNum(data.change)}</span><span className={data.changePercent > 0 ? "text-dex-green" : data.changePercent < 0 ? "text-dex-red" : "text-dex-text-secondary"}>{Math.abs(data.changePercent).toFixed(2)}%</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-dex-bg-secondary rounded-lg p-4 border border-dex-border">
        <h3 className="text-lg font-semibold mb-1">Supply Distribution</h3><p className="text-sm text-dex-text-secondary mb-4">Total supply distribution among top holders.</p>
        <div className="space-y-4">
          {insights.holderSupply && Object.entries(insights.holderSupply).map(([tier, data]) => (
            <div key={tier} className="mb-3"><div className="flex justify-between items-center mb-1"><span className="capitalize font-medium">{tier.replace("top", "Top ")}</span><span>{data.supplyPercent}%</span></div><div className="w-full bg-dex-bg-primary rounded-full h-2.5"><div className="bg-dex-blue h-2.5 rounded-full" style={{ width: `${data.supplyPercent}%` }}></div></div></div>
          ))}
        </div>
      </div>
      <div className="bg-dex-bg-secondary rounded-lg p-4 border border-dex-border">
        <h3 className="text-lg font-semibold mb-1">Holders Acquisition</h3><p className="text-sm text-dex-text-secondary mb-4">Based on wallet&apos;s first interaction.</p>
        <div className="h-64 flex items-center justify-center"><Doughnut data={acqData} options={acqOptions} /></div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2 bg-dex-blue"></span><span>Swap</span><span className="ml-auto">{fmtPct(swap/total*100)}</span></div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2 bg-purple-500"></span><span>Transfer</span><span className="ml-auto">{fmtPct(transfer/total*100)}</span></div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2 bg-green-500"></span><span>Airdrop</span><span className="ml-auto">{fmtPct(airdrop/total*100)}</span></div>
        </div>
      </div>
    </div>
  );
};

export default TokenHolderInsights;
