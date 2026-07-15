"use client";
import { useState, useEffect, useMemo } from "react";
import { getTokenInfo, getTokenDetails, getTrades } from "@/utils/api";
import { BLOCK_EXPLORERS, NETWORK_LABELS } from "@/utils/networks";
import { formatUsdCompact, formatNumber, PLACEHOLDER_LOGO, truncateAddress } from "@/utils/formatters";
import UpdatedAgo from "@/components/common/UpdatedAgo";
import GTScoreGauge from "@/components/token/GTScoreGauge";

const TIMEFRAMES = ["5m", "1h", "6h", "24h"];
const WATCHLIST_KEY = "bs:watchlist";

const readWatchlist = () => {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
  } catch {
    return [];
  }
};

// Split green/red ratio bar (buys vs sells, buyers vs sellers, buy vol vs sell vol)
const RatioBar = ({ a, b }) => {
  const total = (a || 0) + (b || 0);
  const pct = total === 0 ? 50 : ((a || 0) / total) * 100;
  return (
    <div className="mt-1.5 h-1 bg-dex-bg-highlight rounded-full overflow-hidden flex">
      <div className="h-full bg-dex-green" style={{ width: `${pct}%` }} />
      <div className="h-full bg-dex-red" style={{ width: `${100 - pct}%` }} />
    </div>
  );
};

const SplitStat = ({ label, total, leftLabel, leftValue, rightLabel, rightValue, leftDisplay, rightDisplay }) => (
  <div className="grid grid-cols-3 gap-2 py-2.5 border-b border-dex-border px-3">
    <div>
      <div className="text-[10px] text-dex-text-secondary uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{total}</div>
    </div>
    <div className="col-span-2">
      <div className="flex justify-between text-[10px] text-dex-text-secondary uppercase tracking-wider">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="flex justify-between text-xs font-medium mt-0.5">
        <span className="text-dex-green">{leftDisplay ?? formatNumber(leftValue)}</span>
        <span className="text-dex-red">{rightDisplay ?? formatNumber(rightValue)}</span>
      </div>
      <RatioBar a={leftValue} b={rightValue} />
    </div>
  </div>
);

const TokenInfo = ({ token, pair, network }) => {
  const [tokenMetadata, setTokenMetadata] = useState(null);
  const [tokenDetails, setTokenDetails] = useState(null);
  const [trades, setTrades] = useState([]);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("24h");
  const [descExpanded, setDescExpanded] = useState(false);
  const [copied, setCopied] = useState("");
  const [watched, setWatched] = useState(false);

  const watchKey = `${network}:${token?.address}`;

  useEffect(() => {
    if (!token?.address || !network) return;
    getTokenInfo(network, token.address).then(setTokenMetadata).catch(() => {});
    const fetchDetails = (retries = 2) => {
      getTokenDetails(network, token.address)
        .then(setTokenDetails)
        .catch(() => {
          if (retries > 0) setTimeout(() => fetchDetails(retries - 1), 3000);
        });
    };
    fetchDetails();
    setWatched(readWatchlist().includes(watchKey));
  }, [token, network]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recent trades power the BUY VOL / SELL VOL split (GT has no per-pool
  // buy/sell volume buckets — this split is real data from recent trades).
  useEffect(() => {
    if (!pair?.pairAddress || !network) return;
    getTrades(network, pair.pairAddress).then(setTrades).catch(() => {});
  }, [pair?.pairAddress, network]);

  const volSplit = useMemo(() => {
    let buy = 0;
    let sell = 0;
    for (const t of trades) {
      if (t.transactionType === "buy") buy += t.totalValueUsd || 0;
      else if (t.transactionType === "sell") sell += t.totalValueUsd || 0;
    }
    return { buy, sell, has: trades.length > 0 };
  }, [trades]);

  const toggleWatch = () => {
    const list = readWatchlist();
    const next = list.includes(watchKey) ? list.filter((k) => k !== watchKey) : [...list, watchKey];
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
    setWatched(next.includes(watchKey));
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  };

  const getExplorerUrl = (address, type = "address") => {
    const exp = BLOCK_EXPLORERS[network] || "";
    if (!exp) return "#";
    if (network === "solana") return `${exp}/${type === "token" ? "token" : "account"}/${address}`;
    return `${exp}/${type === "token" ? "token" : "address"}/${address}`;
  };

  const formatPrice = (p) => {
    if (!p) return "$0";
    const n = typeof p === "string" ? parseFloat(p) : p;
    if (n < 0.00001) return "$" + n.toFixed(10).replace(/\.?0+$/, "");
    if (n < 0.01) return "$" + n.toFixed(6);
    if (n < 1000) return "$" + n.toFixed(4);
    return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const formatPct = (v) => ((!v && v !== 0) ? "-" : (v >= 0 ? "+" : "") + v.toFixed(2) + "%");

  if (!token || !pair) return <div className="p-4 text-dex-text-secondary">No token data available</div>;

  const pairStats = pair.pairStats || {};
  const usdPrice = pairStats.currentUsdPrice || pair.usdPrice || 0;
  const nativePrice = pairStats.currentNativePrice || pair.nativePrice || 0;
  const totalLiquidity = pairStats.totalLiquidityUsd || pair.liquidityUsd || 0;
  const fdv = tokenMetadata?.fdv_usd || 0;
  const mktCap = tokenMetadata?.market_cap_usd || fdv;
  const quoteSymbol = pair.pair?.[1]?.tokenSymbol || "USD";
  const chainLabel = NETWORK_LABELS[network] || network;

  const details = tokenDetails || {};
  const description = details.description || "";
  const websites = details.websites || [];
  const twitterHandle = details.twitter_handle;
  const telegramHandle = details.telegram_handle;
  const discordUrl = details.discord_url;
  const imageUrl = details.image_url || tokenMetadata?.image_url || token.logo;
  const holderCount = typeof details.holders === "object" ? details.holders?.count : details.holders;
  const categories = details.categories || [];
  const gtScore = typeof details.gt_score === "number" ? details.gt_score : parseFloat(details.gt_score);

  const cleanDex = (() => {
    let d = pair.exchangeName || "";
    const suffix = `(${chainLabel.toLowerCase()})`;
    if (d.toLowerCase().endsWith(suffix)) d = d.slice(0, d.toLowerCase().lastIndexOf(suffix)).trim();
    return d;
  })();

  const tf = selectedTimeFrame;
  const buys = pairStats.buys?.[tf] || 0;
  const sells = pairStats.sells?.[tf] || 0;
  const buyers = pairStats.buyers?.[tf] || 0;
  const sellers = pairStats.sellers?.[tf] || 0;
  const tfVolume = pairStats.totalVolume?.[tf] || 0;

  return (
    <div className="text-dex-text-primary h-full overflow-y-auto text-sm">
      {/* ── Header: banner gradient, logo, identity, watch/alerts ── */}
      <div className="relative border-b border-dex-border">
        <div className="h-14 bg-gradient-to-r from-dex-blue/20 via-dex-bg-tertiary to-dex-bg-secondary" />
        <div className="px-3 pb-3 -mt-7">
          <div className="flex items-end justify-between">
            <img
              src={imageUrl || PLACEHOLDER_LOGO}
              alt={token.symbol}
              className="w-14 h-14 rounded-full ring-4 ring-dex-bg-primary bg-dex-bg-tertiary"
              onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_LOGO; }}
            />
            <div className="flex gap-1.5 mb-1">
              <button
                onClick={toggleWatch}
                title={watched ? "Remove from watchlist" : "Add to watchlist"}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                  watched
                    ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                    : "bg-dex-bg-tertiary border-dex-border text-dex-text-secondary hover:text-dex-text-primary"
                }`}
              >
                {watched ? "★ Watching" : "☆ Watch"}
              </button>
              <button
                disabled
                title="Price alerts are coming soon"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-dex-bg-tertiary border border-dex-border text-dex-text-tertiary cursor-not-allowed"
              >
                🔔 Alerts <span className="ml-1 text-[9px] uppercase bg-dex-bg-highlight px-1 py-0.5 rounded">soon</span>
              </button>
            </div>
          </div>

          <div className="mt-2">
            <h1 className="text-lg font-bold leading-tight">
              {details.name || tokenMetadata?.name || token.name}
              <span className="text-sm text-dex-text-secondary font-medium ml-1.5">{details.symbol || tokenMetadata?.symbol || token.symbol}</span>
            </h1>
            <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
              <span className="px-1.5 py-0.5 text-[11px] font-medium rounded bg-dex-blue/15 text-dex-blue border border-dex-blue/30">{chainLabel}</span>
              <span className="px-1.5 py-0.5 text-[11px] font-medium rounded bg-dex-bg-tertiary text-dex-text-secondary border border-dex-border">{cleanDex}</span>
              <span className="text-xs text-dex-text-secondary">{pair.pairLabel}</span>
            </div>
            <div className="mt-1">
              <UpdatedAgo updatedAt={tokenMetadata?._updatedAt} />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {categories.slice(0, 4).map((cat, i) => (
                <span key={i} className="px-1.5 py-0.5 text-[10px] bg-dex-bg-tertiary rounded-full text-dex-text-secondary">{cat}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Price ── */}
      <div className="grid grid-cols-2 border-b border-dex-border">
        <div className="p-3 border-r border-dex-border">
          <div className="text-[10px] text-dex-text-secondary uppercase tracking-wider">Price USD</div>
          <div className="text-base font-bold mt-0.5">{formatPrice(usdPrice)}</div>
        </div>
        <div className="p-3">
          <div className="text-[10px] text-dex-text-secondary uppercase tracking-wider">Price {quoteSymbol}</div>
          <div className="text-base font-bold mt-0.5">{formatPrice(nativePrice).replace("$", "")}</div>
        </div>
      </div>

      {/* ── Timeframe strip ── */}
      <div className="grid grid-cols-4 border-b border-dex-border">
        {TIMEFRAMES.map((p) => {
          const v = pairStats.pricePercentChange?.[p] || 0;
          const active = selectedTimeFrame === p;
          return (
            <button
              key={p}
              onClick={() => setSelectedTimeFrame(p)}
              className={`py-2 text-center border-r border-dex-border last:border-r-0 ${active ? "bg-dex-bg-highlight" : "hover:bg-dex-bg-tertiary"}`}
            >
              <div className={`text-[10px] uppercase ${active ? "text-dex-text-primary font-semibold" : "text-dex-text-secondary"}`}>{p}</div>
              <div className={`text-xs font-semibold mt-0.5 ${v >= 0 ? "text-dex-green" : "text-dex-red"}`}>{formatPct(v)}</div>
            </button>
          );
        })}
      </div>

      {/* ── TXNS / VOLUME / TRADERS with split bars ── */}
      <SplitStat label="Txns" total={formatNumber(buys + sells)} leftLabel="Buys" leftValue={buys} rightLabel="Sells" rightValue={sells} />
      <SplitStat
        label="Volume"
        total={formatUsdCompact(tfVolume)}
        leftLabel="Buy vol"
        leftValue={volSplit.has ? volSplit.buy : 0}
        rightLabel="Sell vol"
        rightValue={volSplit.has ? volSplit.sell : 0}
        leftDisplay={volSplit.has ? formatUsdCompact(volSplit.buy) : "—"}
        rightDisplay={volSplit.has ? formatUsdCompact(volSplit.sell) : "—"}
      />
      {volSplit.has && (
        <div className="px-3 pt-1 pb-0 -mt-2 text-[9px] text-dex-text-tertiary border-b border-dex-border pb-1.5">
          buy/sell volume split from recent trades
        </div>
      )}
      <SplitStat label="Traders" total={formatNumber(buyers + sellers)} leftLabel="Buyers" leftValue={buyers} rightLabel="Sellers" rightValue={sellers} />

      {/* ── Liquidity / FDV / MCap ── */}
      <div className="grid grid-cols-3 border-b border-dex-border">
        <div className="p-3 border-r border-dex-border">
          <div className="text-[10px] text-dex-text-secondary uppercase tracking-wider">
            Liquidity{pair.lockedLiquidityPct != null && pair.lockedLiquidityPct > 0 && (
              <span className="ml-1" title={`${pair.lockedLiquidityPct.toFixed(0)}% locked`}>🔒</span>
            )}
          </div>
          <div className="text-sm font-semibold mt-0.5">{formatUsdCompact(totalLiquidity)}</div>
        </div>
        <div className="p-3 border-r border-dex-border">
          <div className="text-[10px] text-dex-text-secondary uppercase tracking-wider">FDV</div>
          <div className="text-sm font-semibold mt-0.5">{formatUsdCompact(fdv)}</div>
        </div>
        <div className="p-3">
          <div className="text-[10px] text-dex-text-secondary uppercase tracking-wider">Mkt Cap</div>
          <div className="text-sm font-semibold mt-0.5">{formatUsdCompact(mktCap)}</div>
        </div>
      </div>

      {/* ── GT Score gauge + Holders ── */}
      {(gtScore != null && !Number.isNaN(gtScore)) || holderCount ? (
        <div className="flex items-center justify-between p-3 border-b border-dex-border">
          {gtScore != null && !Number.isNaN(gtScore) ? <GTScoreGauge score={gtScore} /> : <div />}
          {holderCount ? (
            <div className="text-right">
              <div className="text-[10px] text-dex-text-secondary uppercase tracking-wider">Holders</div>
              <div className="text-base font-bold mt-0.5">{formatNumber(holderCount)}</div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Socials ── */}
      {(websites[0] || twitterHandle || telegramHandle || discordUrl) && (
        <div className="flex flex-wrap gap-2 p-3 border-b border-dex-border">
          {websites[0] && <a href={websites[0]} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-xs font-medium">🌐 Website</a>}
          {twitterHandle && <a href={`https://twitter.com/${twitterHandle}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-xs font-medium">🐦 @{twitterHandle}</a>}
          {telegramHandle && <a href={`https://t.me/${telegramHandle}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-xs font-medium">📱 Telegram</a>}
          {discordUrl && <a href={discordUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-xs font-medium">💬 Discord</a>}
        </div>
      )}

      {/* ── Description ── */}
      {description && (
        <div className="p-3 border-b border-dex-border">
          <p className={`text-xs text-dex-text-secondary leading-relaxed ${descExpanded ? "" : "line-clamp-3"}`}>{description}</p>
          {description.length > 150 && (
            <button onClick={() => setDescExpanded(!descExpanded)} className="text-xs text-dex-blue mt-1 hover:underline">
              {descExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* ── Addresses ── */}
      <div className="border-b border-dex-border">
        {[
          { label: "Pair", addr: pair.pairAddress, copyKey: "pair" },
          { label: token.symbol, addr: token.address, copyKey: "token" },
        ].map(({ label, addr, copyKey }) => (
          <div key={copyKey} className="px-3 py-2 flex justify-between items-center border-b border-dex-border last:border-b-0">
            <div className="text-xs text-dex-text-secondary">{label}</div>
            <div className="flex items-center space-x-1">
              <span className="font-mono text-xs">{truncateAddress(addr)}</span>
              <button onClick={() => handleCopy(addr, copyKey)} className="px-1.5 py-0.5 text-xs bg-dex-bg-tertiary rounded hover:bg-dex-bg-highlight">
                {copied === copyKey ? "✓" : "📋"}
              </button>
              <a href={getExplorerUrl(addr, "token")} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 text-xs bg-dex-bg-tertiary rounded hover:bg-dex-bg-highlight">EXP</a>
            </div>
          </div>
        ))}
      </div>

      {/* ── Share / BananaMaps ── */}
      <div className="p-3 grid grid-cols-2 gap-2">
        <a
          href={`https://twitter.com/intent/tweet?text=Check%20out%20${token.symbol}%20on%20BananaScreener&url=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`}
          target="_blank" rel="noopener noreferrer"
          className="flex justify-center items-center p-2 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-xs"
        >
          <span className="mr-1">🐦</span>Share on Twitter
        </a>
        <a
          href={`https://bananamaps.io/?token=${token.address}&chain=${network}`}
          target="_blank" rel="noopener noreferrer"
          className="flex justify-center items-center p-2 bg-dex-bg-tertiary hover:bg-dex-bg-highlight rounded-lg text-xs"
        >
          <span className="mr-1">🍌</span>BananaMaps
        </a>
      </div>
    </div>
  );
};

export default TokenInfo;
