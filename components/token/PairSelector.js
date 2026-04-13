"use client";
import { useState } from "react";

const PairSelector = ({ pairs, selectedPair, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const fmt = (v) => { if (!v) return "$0"; if (v >= 1e9) return `$${(v/1e9).toFixed(2)}B`; if (v >= 1e6) return `$${(v/1e6).toFixed(2)}M`; if (v >= 1e3) return `$${(v/1e3).toFixed(2)}K`; return `$${v.toFixed(2)}`; };

  return (
    <div className="relative">
      <button className="flex items-center justify-between w-full p-2 bg-dex-bg-tertiary rounded hover:bg-dex-bg-highlight transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex flex-col">
          <div className="flex items-center">
            <img src={selectedPair?.exchangeLogo || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM0Mzk0NyIvPjwvc3ZnPg=="} alt="" className="w-5 h-5 mr-2 rounded-full" />
            <span className="font-medium">{selectedPair?.pairLabel}</span>
          </div>
          <span className="text-dex-text-secondary text-xs ml-7">on {selectedPair?.exchangeName}</span>
        </div>
        <span className="text-dex-text-secondary text-xs mr-3">Liquidity: {fmt(selectedPair?.liquidityUsd)}</span>
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-dex-bg-tertiary rounded-md shadow-lg max-h-60 overflow-auto">
          {pairs.map((pair) => (
            <button key={pair.pairAddress} className={`flex items-center justify-between w-full p-3 text-left hover:bg-dex-bg-highlight ${selectedPair?.pairAddress === pair.pairAddress ? "bg-dex-bg-highlight" : ""}`}
              onClick={() => { onSelect(pair.pairAddress); setIsOpen(false); }}>
              <div><div className="flex items-center"><img src={pair.exchangeLogo || ""} alt="" className="w-5 h-5 mr-2 rounded-full" /><span className="font-medium">{pair.pairLabel}</span></div><span className="text-dex-text-secondary text-xs ml-7">on {pair.exchangeName}</span></div>
              <div className="text-dex-text-secondary text-xs">{fmt(pair.liquidityUsd)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PairSelector;
