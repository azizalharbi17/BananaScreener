"use client";
import { useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import TableHeader from "./TableHeader";
import TokenRow, { ROW_HEIGHT } from "./TokenRow";
import { formatUsdCompact, formatPrice, formatAge, PLACEHOLDER_LOGO } from "@/utils/formatters";
import { NETWORK_LABELS } from "@/utils/networks";

// Windowed rendering: only rows near the viewport are mounted, so 200+ row
// lists stay smooth. Fixed row height + spacer rows keep scrollbar geometry.
const OVERSCAN = 8;

const SkeletonRows = ({ count = 12 }) =>
  Array.from({ length: count }, (_, i) => (
    <tr key={i} className="border-b border-dex-border/40" style={{ height: ROW_HEIGHT }}>
      <td className="px-4"><div className="h-3 w-4 bg-dex-bg-tertiary rounded animate-pulse" /></td>
      <td className="px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-dex-bg-tertiary animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-dex-bg-tertiary rounded animate-pulse" />
            <div className="h-2.5 w-16 bg-dex-bg-tertiary rounded animate-pulse" />
          </div>
        </div>
      </td>
      {Array.from({ length: 11 }, (_, j) => (
        <td key={j} className="px-4"><div className="h-3 w-12 bg-dex-bg-tertiary rounded animate-pulse ml-auto" /></td>
      ))}
    </tr>
  ));

const MobileCard = ({ token, onClick }) => {
  const pct = token.pricePercentChange?.["24h"] || 0;
  return (
    <button onClick={onClick} className="w-full text-left p-3 border-b border-dex-border hover:bg-dex-bg-highlight">
      <div className="flex items-center gap-3">
        <img
          src={token.logo || PLACEHOLDER_LOGO}
          alt={token.symbol}
          className="w-9 h-9 rounded-full bg-dex-bg-tertiary"
          onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_LOGO; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{token.symbol}</span>
            <span className="px-1 py-px text-[9px] rounded bg-dex-blue/15 text-dex-blue border border-dex-blue/30">
              {NETWORK_LABELS[token.network] || token.network}
            </span>
            <span className="text-[10px] text-dex-text-tertiary truncate">{token.dexName}</span>
          </div>
          <div className="text-xs text-dex-text-secondary truncate">{token.name}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">${formatPrice(token.usdPrice)}</div>
          <div className={`text-xs font-medium ${pct >= 0 ? "text-dex-green" : "text-dex-red"}`}>
            {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-dex-text-secondary">
        <span>VOL {formatUsdCompact(token.totalVolume?.["24h"])}</span>
        <span>LIQ {formatUsdCompact(token.liquidityUsd)}</span>
        <span>MCAP {formatUsdCompact(token.marketCap)}</span>
        <span>{formatAge(token.createdAt * 1000)}</span>
      </div>
    </button>
  );
};

const TrendingTable = ({ tokens, loading, sortBy, sortDirection, onSortChange }) => {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(800);

  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
    setViewportH(e.currentTarget.clientHeight);
  }, []);

  const sortedTokens = useMemo(() => {
    const arr = Array.isArray(tokens) ? [...tokens] : [];
    if (sortBy) {
      const get = (obj, path) => { let v = obj; for (const k of path.split(".")) { if (!v || typeof v !== "object") return 0; v = v[k]; } return v ?? 0; };
      arr.sort((a, b) => (sortDirection === "asc" ? get(a, sortBy) - get(b, sortBy) : get(b, sortBy) - get(a, sortBy)));
    }
    return arr;
  }, [tokens, sortBy, sortDirection]);

  const total = sortedTokens.length;
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(total, Math.ceil((scrollTop + viewportH) / ROW_HEIGHT) + OVERSCAN);
  const topPad = start * ROW_HEIGHT;
  const bottomPad = (total - end) * ROW_HEIGHT;

  return (
    <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-auto max-h-[calc(100vh-81px)]">
      {/* Desktop table */}
      <table className="w-full border-collapse hidden md:table">
        <TableHeader sortBy={sortBy} sortDirection={sortDirection} onSortChange={onSortChange} />
        <tbody>
          {loading ? (
            <SkeletonRows />
          ) : total === 0 ? (
            <tr>
              <td colSpan="13" className="text-center py-16 text-dex-text-secondary">
                <div className="text-3xl mb-2">🍌</div>
                No tokens found — try another chain or check back shortly.
              </td>
            </tr>
          ) : (
            <>
              {topPad > 0 && <tr style={{ height: topPad }} aria-hidden />}
              {sortedTokens.slice(start, end).map((token, i) => (
                <TokenRow key={token.id || start + i} token={token} rank={start + i + 1} />
              ))}
              {bottomPad > 0 && <tr style={{ height: bottomPad }} aria-hidden />}
            </>
          )}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="md:hidden">
        {loading ? (
          Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="p-3 border-b border-dex-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-dex-bg-tertiary animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 bg-dex-bg-tertiary rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-dex-bg-tertiary rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-dex-bg-tertiary rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : total === 0 ? (
          <div className="text-center py-16 text-dex-text-secondary">
            <div className="text-3xl mb-2">🍌</div>
            No tokens found
          </div>
        ) : (
          sortedTokens.map((token) => (
            <MobileCard key={token.id} token={token} onClick={() => router.push(`/${token.chainId}/${token.tokenAddress}`)} />
          ))
        )}
      </div>
    </div>
  );
};

export default TrendingTable;
