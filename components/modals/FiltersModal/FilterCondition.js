"use client";

const FilterCondition = ({ filter, metrics, timeFrames, operators, onUpdate, onRemove }) => (
  <div className="bg-dex-bg-tertiary rounded-lg p-4">
    <div className="flex flex-wrap gap-3">
      <div className="flex-1 min-w-[180px]"><label className="block text-dex-text-secondary text-xs mb-1">Metric</label><select className="w-full px-3 py-2 bg-dex-bg-highlight border border-dex-border rounded text-dex-text-primary" value={filter.metric} onChange={(e) => onUpdate("metric", e.target.value)}>{metrics.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
      <div className="flex-1 min-w-[180px]"><label className="block text-dex-text-secondary text-xs mb-1">Time Frame</label><select className="w-full px-3 py-2 bg-dex-bg-highlight border border-dex-border rounded text-dex-text-primary" value={filter.timeFrame} onChange={(e) => onUpdate("timeFrame", e.target.value)}>{timeFrames.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
      <div className="flex-1 min-w-[180px]"><label className="block text-dex-text-secondary text-xs mb-1">Condition</label><select className="w-full px-3 py-2 bg-dex-bg-highlight border border-dex-border rounded text-dex-text-primary" value={filter.operator} onChange={(e) => onUpdate("operator", e.target.value)}>{operators.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
      <div className="flex-1 min-w-[120px]"><label className="block text-dex-text-secondary text-xs mb-1">Value</label><input type="text" className="w-full px-3 py-2 bg-dex-bg-highlight border border-dex-border rounded text-dex-text-primary" value={filter.value} onChange={(e) => onUpdate("value", e.target.value)} /></div>
      <div className="flex items-end"><button className="px-3 py-2 text-dex-text-secondary hover:text-dex-red" onClick={onRemove}>&#x2715;</button></div>
    </div>
  </div>
);

export default FilterCondition;
