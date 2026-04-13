"use client";

const SortBySelector = ({ sortBy, metrics, timeFrames, onChange }) => (
  <div className="flex flex-wrap gap-3">
    <div className="flex-1 min-w-[180px]"><select className="w-full px-3 py-2 bg-dex-bg-tertiary border border-dex-border rounded text-dex-text-primary" value={sortBy.metric} onChange={(e) => onChange({ ...sortBy, metric: e.target.value })}>{metrics.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
    <div className="flex-1 min-w-[180px]"><select className="w-full px-3 py-2 bg-dex-bg-tertiary border border-dex-border rounded text-dex-text-primary" value={sortBy.timeFrame} onChange={(e) => onChange({ ...sortBy, timeFrame: e.target.value })}>{timeFrames.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
    <div className="flex-1 min-w-[180px]"><select className="w-full px-3 py-2 bg-dex-bg-tertiary border border-dex-border rounded text-dex-text-primary" value={sortBy.type} onChange={(e) => onChange({ ...sortBy, type: e.target.value })}><option value="DESC">Descending</option><option value="ASC">Ascending</option></select></div>
  </div>
);

export default SortBySelector;
