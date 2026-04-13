"use client";

const BondingTokenCard = ({ token, formatPrice, formatNumber, onClick }) => {
  const progress = token.bondingCurveProgress || 0;
  const progressColor = progress < 33 ? "from-amber-600 to-amber-800" : progress < 66 ? "from-amber-500 to-yellow-500" : "from-yellow-500 to-amber-400";

  return (
    <div className="bg-dex-bg-secondary rounded-lg overflow-hidden border border-dex-border cursor-pointer transition-all hover:border-dex-accent" onClick={onClick}>
      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className="h-10 w-10 rounded-full bg-amber-900 mr-3 flex items-center justify-center overflow-hidden">{token.logo ? <img src={token.logo} alt={token.symbol} className="h-full w-full object-cover" onError={e => { e.target.onerror = null; e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iIzFjMzU2NCIvPjwvc3ZnPg=="; }} /> : <span className="text-white font-bold">{token.symbol?.charAt(0) || "?"}</span>}</div>
          <div><h3 className="font-bold text-white">{token.symbol}</h3><p className="text-sm text-dex-text-secondary truncate max-w-[200px]">{token.name}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div><p className="text-xs text-dex-text-secondary">Price</p><p className="font-medium text-white">{formatPrice(token.priceUsd)}</p></div>
          <div><p className="text-xs text-dex-text-secondary">Liquidity</p><p className="font-medium text-white">{formatNumber(token.liquidity)}</p></div>
          <div><p className="text-xs text-dex-text-secondary">FDV</p><p className="font-medium text-white">{formatNumber(token.fullyDilutedValuation)}</p></div>
          <div><p className="text-xs text-dex-text-secondary">Progress</p><p className="font-medium text-white">{Math.round(progress)}%</p></div>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${progressColor}`} style={{ width: `${progress}%` }}></div></div>
        <div className="mt-2 text-xs bg-amber-900/30 text-amber-400 py-1 px-2 rounded-full inline-block">Bonding Curve: {Math.round(progress)}%</div>
      </div>
    </div>
  );
};

export default BondingTokenCard;
