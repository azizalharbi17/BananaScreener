"use client";
import { useState } from "react";
import FilterCondition from "./FilterCondition";
import SortBySelector from "./SortBySelector";

const METRICS = [{ value: "tokenAge", label: "Token Age" },{ value: "holders", label: "Holders" },{ value: "buyers", label: "Buyers" },{ value: "sellers", label: "Sellers" },{ value: "netBuyers", label: "Net Buyers" },{ value: "experiencedBuyers", label: "Experienced Buyers" },{ value: "experiencedSellers", label: "Experienced Sellers" },{ value: "netExperiencedBuyers", label: "Net Experienced Buyers" },{ value: "fullyDilutedValuation", label: "Fully Diluted Valuation" },{ value: "marketCap", label: "Market Cap" },{ value: "usdPricePercentChange", label: "Price Change %" },{ value: "liquidityChange", label: "Liquidity Change" },{ value: "liquidityChangeUSD", label: "Liquidity Change USD" },{ value: "volumeUsd", label: "Volume USD" },{ value: "buyVolumeUsd", label: "Buy Volume USD" },{ value: "sellVolumeUsd", label: "Sell Volume USD" },{ value: "netVolumeUsd", label: "Net Volume USD" },{ value: "securityScore", label: "Security Score" }];
const TIME_FRAMES = [{ value: "tenMinutes", label: "10 Minutes" },{ value: "thirtyMinutes", label: "30 Minutes" },{ value: "oneHour", label: "1 Hour" },{ value: "fourHours", label: "4 Hours" },{ value: "twelveHours", label: "12 Hours" },{ value: "oneDay", label: "1 Day" },{ value: "oneWeek", label: "1 Week" },{ value: "oneMonth", label: "1 Month" }];
const OPERATORS = [{ value: "gt", label: "Greater Than" },{ value: "lt", label: "Less Than" },{ value: "eq", label: "Equal To" }];
const CHAINS = [{ value: "0x1", label: "Ethereum" },{ value: "solana", label: "Solana" },{ value: "0x38", label: "BSC" },{ value: "0x89", label: "Polygon" },{ value: "0x2105", label: "Base" },{ value: "0xa4b1", label: "Arbitrum" },{ value: "0xa", label: "Optimism" },{ value: "0xa86a", label: "Avalanche" },{ value: "0x171", label: "Pulse" },{ value: "0x7e4", label: "Ronin" }];

const FiltersModal = ({ isOpen, onClose, onApplyFilters }) => {
  const [chain, setChain] = useState("0x1");
  const [filters, setFilters] = useState([{ id: 1, metric: "experiencedBuyers", timeFrame: "oneMonth", operator: "gt", value: "10" }]);
  const [sortBy, setSortBy] = useState({ metric: "experiencedBuyers", timeFrame: "oneMonth", type: "DESC" });
  const [limit, setLimit] = useState(20);

  const addFilter = () => { const newId = filters.length > 0 ? Math.max(...filters.map(f => f.id)) + 1 : 1; setFilters([...filters, { id: newId, metric: "experiencedBuyers", timeFrame: "oneMonth", operator: "gt", value: "10" }]); };
  const removeFilter = (id) => setFilters(filters.filter(f => f.id !== id));
  const updateFilter = (id, field, value) => setFilters(filters.map(f => f.id === id ? { ...f, [field]: value } : f));

  const applyFilters = async () => {
    try {
      const payload = { chain, filters: filters.map(({ metric, timeFrame, operator, value }) => ({ metric, timeFrame, [operator]: value })), sortBy, timeFramesToReturn: ["tenMinutes","oneHour","fourHours","twelveHours","oneDay","oneWeek","oneMonth"], metricsToReturn: ["holders","buyers","sellers","netBuyers","volumeUsd","buyVolumeUsd","sellVolumeUsd","marketCap","fullyDilutedValuation","usdPricePercentChange","liquidityChangeUSD"], limit };
      const response = await fetch("/api/moralis/discovery", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const transformedData = data.map((item) => {
        const metrics = item.metrics || {};
        return { chainId: item.metadata.chainId, tokenAddress: item.metadata.tokenAddress, name: item.metadata.name, symbol: item.metadata.symbol, decimals: item.metadata.decimals, logo: item.metadata.logo, usdPrice: item.metadata.usdPrice || 0, createdAt: item.metadata.blockNumberMinted || Math.floor(Date.now() / 1000 - 86400), marketCap: parseFloat(item.metadata.marketCap || 0), liquidityUsd: parseFloat(item.metadata.fullyDilutedValue || 0) * 0.1, holders: parseInt(item.metadata.totalSupply || 0), pricePercentChange: { "1h": metrics.usdPricePercentChange?.oneHour || 0, "4h": metrics.usdPricePercentChange?.fourHours || 0, "12h": metrics.usdPricePercentChange?.twelveHours || 0, "24h": metrics.usdPricePercentChange?.oneDay || 0 }, totalVolume: { "1h": metrics.volumeUsd?.oneHour || 0, "4h": metrics.volumeUsd?.fourHours || 0, "12h": metrics.volumeUsd?.twelveHours || 0, "24h": metrics.volumeUsd?.oneDay || 0 }, transactions: { "1h": (metrics.buyVolumeUsd?.oneHour || 0) + (metrics.sellVolumeUsd?.oneHour || 0), "4h": (metrics.buyVolumeUsd?.fourHours || 0) + (metrics.sellVolumeUsd?.fourHours || 0), "12h": (metrics.buyVolumeUsd?.twelveHours || 0) + (metrics.sellVolumeUsd?.twelveHours || 0), "24h": (metrics.buyVolumeUsd?.oneDay || 0) + (metrics.sellVolumeUsd?.oneDay || 0) }, buyers: { "1h": metrics.buyers?.oneHour || 0, "4h": metrics.buyers?.fourHours || 0, "12h": metrics.buyers?.twelveHours || 0, "24h": metrics.buyers?.oneDay || 0 }, sellers: { "1h": metrics.sellers?.oneHour || 0, "4h": metrics.sellers?.fourHours || 0, "12h": metrics.sellers?.twelveHours || 0, "24h": metrics.sellers?.oneDay || 0 } };
      });
      onApplyFilters(transformedData); onClose();
    } catch (error) { console.error("Error applying filters:", error); alert("Error applying filters. Please try again."); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={onClose}>
      <div className="bg-dex-bg-secondary rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-dex-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-dex-text-primary">Advanced Filters</h2>
          <button className="text-dex-text-secondary hover:text-dex-text-primary" onClick={onClose}>&#x2715;</button>
        </div>
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-70px)]">
          <div className="mb-6"><label className="block text-dex-text-secondary uppercase text-sm font-semibold mb-2">Chain</label><select className="w-full px-3 py-2 bg-dex-bg-tertiary border border-dex-border rounded text-dex-text-primary" value={chain} onChange={(e) => setChain(e.target.value)}>{CHAINS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div className="mb-6"><div className="flex justify-between items-center mb-2"><label className="block text-dex-text-secondary uppercase text-sm font-semibold">Filter Conditions</label><button className="px-2 py-1 bg-dex-blue text-white rounded text-sm" onClick={addFilter}>+ Add Condition</button></div>{filters.length === 0 ? <div className="bg-dex-bg-tertiary rounded-lg p-4 text-center text-dex-text-secondary">No filter conditions. Add one to get started.</div> : <div className="space-y-4">{filters.map(f => <FilterCondition key={f.id} filter={f} metrics={METRICS} timeFrames={TIME_FRAMES} operators={OPERATORS} onUpdate={(field, value) => updateFilter(f.id, field, value)} onRemove={() => removeFilter(f.id)} />)}</div>}</div>
          <div className="mb-6"><label className="block text-dex-text-secondary uppercase text-sm font-semibold mb-2">Sort By</label><SortBySelector sortBy={sortBy} metrics={METRICS} timeFrames={TIME_FRAMES} onChange={setSortBy} /></div>
          <div className="mb-6"><label className="block text-dex-text-secondary uppercase text-sm font-semibold mb-2">Number of Results</label><select className="w-full px-3 py-2 bg-dex-bg-tertiary border border-dex-border rounded text-dex-text-primary" value={limit} onChange={(e) => setLimit(Number(e.target.value))}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select></div>
        </div>
        <div className="px-6 py-4 border-t border-dex-border flex justify-end space-x-3">
          <button className="px-4 py-2 bg-dex-bg-tertiary text-dex-text-primary rounded hover:bg-dex-bg-highlight" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-dex-blue text-white rounded hover:opacity-90 font-medium" onClick={applyFilters}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
};

export default FiltersModal;
