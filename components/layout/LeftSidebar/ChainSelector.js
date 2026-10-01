"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// logo = filename in /public/chains/
// Display order only (Robinhood sits second, under Solana, to match the TopBar pills).
const CHAINS = [
  { id: "solana", name: "Solana", logo: "solana" }, { id: "robinhood", name: "Robinhood", logo: "robinhood" },
  { id: "0x1", name: "Ethereum", logo: "ethereum" }, { id: "0x38", name: "BSC", logo: "binance" },
  { id: "0x2105", name: "Base", logo: "base" }, { id: "0xa4b1", name: "Arbitrum", logo: "arbitrum" },
  { id: "0x89", name: "Polygon", logo: "polygon" }, { id: "0xa86a", name: "Avalanche", logo: "avalanche" },
  { id: "0xa", name: "Optimism", logo: "optimism" }, { id: "0xe708", name: "Linea", logo: "linea" },
  { id: "0xfa", name: "Fantom", logo: "fantom" }, { id: "0x171", name: "Pulse", logo: "pulse" },
  { id: "0x7e4", name: "Ronin", logo: "ronin" },
];

const CHAIN_PATH_MAP = {
  solana: "solana", "0x1": "ethereum", "0x7e4": "ronin", "0x38": "binance",
  "0x2105": "base", "0xa4b1": "arbitrum", "0x89": "polygon", "0xa86a": "avalanche",
  "0xa": "optimism", "0xe708": "linea", "0xfa": "fantom", "0x171": "pulse",
  robinhood: "robinhood",
};

const ChainSelector = () => {
  const [selectedChain, setSelectedChain] = useState("");
  const router = useRouter();

  const handleChainClick = (chainId) => {
    setSelectedChain(chainId);
    router.push(chainId ? `/${CHAIN_PATH_MAP[chainId] || chainId}` : "/");
  };

  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">Networks</h3>
      <nav className="space-y-px">
        {CHAINS.map((chain) => (
          <button key={chain.id} onClick={() => handleChainClick(chain.id)}
            className={`flex items-center px-4 py-2 text-sm w-full text-left ${selectedChain === chain.id ? "bg-dex-bg-highlight" : "hover:bg-dex-bg-tertiary"} transition-colors`}>
            <img
              src={`/chains/${chain.logo}.svg`}
              alt=""
              className="mr-3 w-5 h-5 rounded-full"
              onError={(e) => { e.target.onerror = null; e.target.src = "/chains/generic.svg"; }}
            />
            {chain.name}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default ChainSelector;
