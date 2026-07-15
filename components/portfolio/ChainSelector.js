"use client";
import { useRef, useState, useEffect } from "react";

const getChainIcon = (id) => { const m = { eth: "ethereum", bsc: "binance", polygon: "polygon", base: "base", arbitrum: "arbitrum", optimism: "optimism", avalanche: "avalanche", fantom: "fantom", linea: "linea", pulse: "pulse", ronin: "ronin" }; return `/chains/${m[id] || "generic"}.svg`; };
const fmt = (v) => { if (!v) return "$0.00"; const n = parseFloat(v); if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`; if (n >= 1e3) return `$${(n/1e3).toFixed(2)}K`; return `$${n.toFixed(2)}`; };
const chainNames = { eth: "Ethereum", bsc: "BSC", polygon: "Polygon", arbitrum: "Arbitrum", avalanche: "Avalanche", optimism: "Optimism", base: "Base", fantom: "Fantom" };

const ChainSelector = ({ chains, selectedChain, onChainSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const sorted = [...(chains || [])].sort((a, b) => parseFloat(b.networth_usd) - parseFloat(a.networth_usd));

  return (
    <div className="relative mb-4" ref={ref}>
      <button className="flex items-center justify-between w-full bg-dex-bg-secondary rounded-lg p-3" onClick={() => setIsOpen(!isOpen)}>
        <span className="font-medium">{selectedChain === "all" ? "All Chains" : (chainNames[selectedChain] || selectedChain.toUpperCase())}</span>
        <svg className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-dex-bg-secondary rounded-lg shadow-lg overflow-hidden">
          <div className={`p-3 cursor-pointer hover:bg-dex-bg-highlight ${selectedChain === "all" ? "bg-dex-bg-highlight" : ""}`} onClick={() => { onChainSelect("all"); setIsOpen(false); }}><div className="font-medium">All Chains</div></div>
          {sorted.map(c => (
            <div key={c.chain} className={`p-3 cursor-pointer hover:bg-dex-bg-highlight ${selectedChain === c.chain ? "bg-dex-bg-highlight" : ""}`} onClick={() => { onChainSelect(c.chain); setIsOpen(false); }}>
              <div className="flex items-center justify-between"><div className="flex items-center"><div className="w-6 h-6 rounded-full mr-2"><img src={getChainIcon(c.chain)} alt={c.chain} className="w-full h-full object-contain" /></div><div className="font-medium">{chainNames[c.chain] || c.chain.toUpperCase()}</div></div><div className="text-sm">{fmt(c.networth_usd)}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChainSelector;
