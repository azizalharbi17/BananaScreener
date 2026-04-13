"use client";
import { useState, useEffect } from "react";
import { getTokenInfo } from "@/utils/api";
import { BLOCK_EXPLORERS } from "@/utils/networks";

const timeFrameMap = { "5m": "5min", "1h": "1h", "4h": "4h", "24h": "24h" };

const TokenInfo = ({ token, pair, network }) => {
  const [tokenMetadata, setTokenMetadata] = useState(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("24h");

  useEffect(() => {
    if (!token?.address || !network) return;
    getTokenInfo(network, token.address).then(setTokenMetadata).catch(() => {});
  }, [token, network]);

  const formatPrice = (p) => { if (!p) return "$0"; const n = typeof p === "string" ? parseFloat(p) : p; if (n < 0.00001) return "$" + n.toFixed(10).replace(/\.?0+$/, ""); if (n < 0.01) return "$" + n.toFixed(6); if (n < 1000) return "$" + n.toFixed(4); return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  const formatNumber = (n) => { if (!n) return "0"; const v = typeof n === "string" ? parseFloat(n) : n; if (v >= 1e9) return (v / 1e9).toFixed(1) + "B"; if (v >= 1e6) return (v / 1e6).toFixed(1) + "M"; if (v >= 1e3) return (v / 1e3).toFixed(1) + "K"; return v.toLocaleString(); };
  const formatPct = (v) => (!v && v !== 0) ? "-" : (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
  const calcRatio = (a, b) => (!a || !b || a + b === 0) ? 0.5 : a / (a + b);
  const shortenAddr = (a) => a ? `${a.slice(0, 4)}...${a.slice(-4)}` : "";
  const handleCopy = (t) => navigator.clipboard.writeText(t);

  const getExplorerUrl = (address, type = "address") => {
    const exp = BLOCK_EXPLORERS[network] || "";
    if (!exp) return "#";
    if (network === "solana") return `${exp}/${type === "token" ? "token" : "account"}/${address}`;
    return `${exp}/${type === "token" ? "token" : "address"}/${address}`;
  };

  if (!token || !pair) return <div className="p-4 text-dex-text-secondary">No token data available</div>;

  const pairStats = pair.pairStats || {};
  const usdPrice = pairStats.currentUsdPrice || pair.usdPrice || 0;
  const nativePrice = pairStats.currentNativePrice || pair.nativePrice || 0;
  const totalLiquidity = pairStats.totalLiquidityUsd || pair.liquidityUsd || 0;
  const fdv = tokenMetadata?.fdv_usd || 0;
  const mktCap = tokenMetadata?.market_cap_usd || fdv;
  const quoteSymbol = pair.pair?.[1]?.tokenSymbol || "USD";
  const creationTime = pairStats.pairCreated || null;
  const tokenLinks = tokenMetadata?.websites?.[0] ? { website: tokenMetadata.websites[0].url } : {};
  if (tokenMetadata?.discord_url) tokenLinks.discord = tokenMetadata.discord_url;
  if (tokenMetadata?.telegram_handle) tokenLinks.telegram = `https://t.me/${tokenMetadata.telegram_handle}`;
  if (tokenMetadata?.twitter_handle) tokenLinks.twitter = `https://twitter.com/${tokenMetadata.twitter_handle}`;

  const getTimePeriodData = (period) => {
    const api = timeFrameMap[period] || "24h";
    return {
      priceChange: pairStats.pricePercentChange?.[api] || 0,
      buys: pairStats.buys?.[api] || 0, sells: pairStats.sells?.[api] || 0,
      buyVolume: pairStats.buyVolume?.[api] || 0, sellVolume: pairStats.sellVolume?.[api] || 0,
      buyers: pairStats.buyers?.[api] || 0, sellers: pairStats.sellers?.[api] || 0,
      totalVolume: pairStats.totalVolume?.[api] || 0,
    };
  };

  const cur = getTimePeriodData(selectedTimeFrame);
  const ProgressBar = ({ a, b }) => (
    <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className="flex h-full"><div className="h-full bg-dex-green" style={{ width: `${calcRatio(a, b) * 100}%` }}></div><div className="h-full bg-dex-red" style={{ width: `${calcRatio(b, a) * 100}%` }}></div></div></div>
  );

  return (
    <div className="text-dex-text-primary h-full overflow-y-auto text-sm">
      <div className="p-3 border-b border-dex-border">
        <div className="flex items-center mb-2">
          <img src={token.logo || tokenMetadata?.image_url || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iIzM0Mzk0NyIvPjwvc3ZnPg=="} alt={token.symbol} className="w-8 h-8 mr-2 rounded-full bg-dex-bg-tertiary" onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iIzM0Mzk0NyIvPjwvc3ZnPg=="; }} />
          <div>
            <h1 className="text-lg font-bold">{tokenMetadata?.name || token.name} <span className="text-sm text-dex-text-secondary">({tokenMetadata?.symbol || token.symbol})</span></h1>
            <div className="text-sm text-dex-text-secondary">{pair.pairLabel} on {pair.exchangeName}</div>
          </div>
        </div>
        <div className="flex space-x-2 mt-3">
          {tokenLinks.website && <a href={tokenLinks.website} target="_blank" rel="noopener noreferrer" className="flex-1 px-3 py-1.5 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-sm font-medium text-center">Website</a>}
          {tokenLinks.twitter && <a href={tokenLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex-1 px-3 py-1.5 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-sm font-medium text-center">Twitter</a>}
          {tokenLinks.telegram && <a href={tokenLinks.telegram} target="_blank" rel="noopener noreferrer" className="flex-1 px-3 py-1.5 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-sm font-medium text-center">Telegram</a>}
        </div>
      </div>
      <div className="grid grid-cols-2 p-3 border-b border-dex-border">
        <div><div className="text-xs text-dex-text-secondary mb-0.5">PRICE USD</div><div className="text-sm font-medium">{formatPrice(usdPrice)}</div></div>
        <div><div className="text-xs text-dex-text-secondary mb-0.5">PRICE {quoteSymbol}</div><div className="text-sm font-medium">{nativePrice ? parseFloat(nativePrice).toFixed(6) + " " + quoteSymbol : "0"}</div></div>
      </div>
      <div className="grid grid-cols-3 p-3 border-b border-dex-border">
        <div><div className="text-xs text-dex-text-secondary mb-0.5">LIQUIDITY</div><div className="text-xs font-medium">${formatNumber(totalLiquidity)}</div></div>
        <div><div className="text-xs text-dex-text-secondary mb-0.5">FDV</div><div className="text-xs font-medium">${formatNumber(fdv)}</div></div>
        <div><div className="text-xs text-dex-text-secondary mb-0.5">MKT CAP</div><div className="text-xs font-medium">${formatNumber(mktCap)}</div></div>
      </div>
      <div className="grid grid-cols-4 border-b border-dex-border">
        {["5m", "1h", "4h", "24h"].map((p) => { const d = getTimePeriodData(p); return (
          <div key={p} className={`p-2 text-center cursor-pointer ${selectedTimeFrame === p ? "bg-dex-bg-secondary" : ""}`} onClick={() => setSelectedTimeFrame(p)}>
            <div className="text-xs text-dex-text-secondary mb-0.5">{p}</div>
            <div className={`text-sm font-medium ${d.priceChange >= 0 ? "text-dex-green" : "text-dex-red"}`}>{formatPct(d.priceChange)}</div>
          </div>
        ); })}
      </div>
      <div className="grid grid-cols-3 border-b border-dex-border">
        <div className="border-r border-dex-border p-2"><div className="text-xs text-dex-text-secondary mb-0.5">TXNS</div><div className="text-sm font-medium">{formatNumber(cur.buys + cur.sells)}</div></div>
        <div className="col-span-2 p-2"><div className="grid grid-cols-2"><div><div className="text-xs text-dex-text-secondary mb-0.5">BUYS</div><div className="text-xs">{formatNumber(cur.buys)}</div></div><div className="text-right"><div className="text-xs text-dex-text-secondary mb-0.5">SELLS</div><div className="text-xs">{formatNumber(cur.sells)}</div></div></div><ProgressBar a={cur.buys} b={cur.sells} /></div>
      </div>
      <div className="grid grid-cols-3 border-b border-dex-border">
        <div className="border-r border-dex-border p-2"><div className="text-xs text-dex-text-secondary mb-0.5">VOLUME</div><div className="text-sm font-medium">${formatNumber(cur.totalVolume)}</div></div>
        <div className="col-span-2 p-2"><div className="grid grid-cols-2"><div><div className="text-xs text-dex-text-secondary mb-0.5">BUYERS</div><div className="text-xs">{formatNumber(cur.buyers)}</div></div><div className="text-right"><div className="text-xs text-dex-text-secondary mb-0.5">SELLERS</div><div className="text-xs">{formatNumber(cur.sellers)}</div></div></div><ProgressBar a={cur.buyers} b={cur.sellers} /></div>
      </div>
      <div className="border-b border-dex-border">
        <div className="p-2 border-b border-dex-border flex justify-between items-center">
          <div className="text-xs text-dex-text-secondary">Pair</div>
          <div className="flex items-center space-x-1"><span className="font-mono text-xs">{shortenAddr(pair.pairAddress)}</span><button onClick={() => handleCopy(pair.pairAddress)} className="px-1.5 py-0.5 text-xs bg-dex-bg-tertiary rounded hover:bg-dex-bg-highlight">📋</button><a href={getExplorerUrl(pair.pairAddress, "token")} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 text-xs bg-dex-bg-tertiary rounded hover:bg-dex-bg-highlight">EXP</a></div>
        </div>
        <div className="p-2 flex justify-between items-center">
          <div className="text-xs text-dex-text-secondary">{token.symbol}</div>
          <div className="flex items-center space-x-1"><span className="font-mono text-xs">{shortenAddr(token.address)}</span><button onClick={() => handleCopy(token.address)} className="px-1.5 py-0.5 text-xs bg-dex-bg-tertiary rounded hover:bg-dex-bg-highlight">📋</button><a href={getExplorerUrl(token.address, "token")} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 text-xs bg-dex-bg-tertiary rounded hover:bg-dex-bg-highlight">EXP</a></div>
        </div>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        <a href={`https://twitter.com/intent/tweet?text=Check%20out%20${token.symbol}%20on%20BananaScreener&url=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`} target="_blank" rel="noopener noreferrer" className="flex justify-center items-center p-2 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-xs"><span className="mr-1">🐦</span>Search on Twitter</a>
        <button className="flex justify-center items-center p-2 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-xs"><span className="mr-1">🔍</span>Other pairs</button>
      </div>
    </div>
  );
};

export default TokenInfo;
