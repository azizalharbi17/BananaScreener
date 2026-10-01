"use client";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import TableHeader from "./TableHeader";
import TokenRow, { ROW_HEIGHT } from "./TokenRow";
import { formatUsdCompact, formatPrice, formatAge, PLACEHOLDER_LOGO } from "@/utils/formatters";
import { NETWORK_LABELS } from "@/utils/networks";

// Windowed rendering: only rows near the viewport are mounted, so 200+ row
// lists stay smooth. Fixed row height + spacer rows keep scrollbar geometry.
const OVERSCAN = 8;
// Infinite scroll: a sentinel at the end of the list is watched inside the
// scroll container; the next page starts loading this many px before the end
// so scrolling never catches up with an empty bottom.
const PREFETCH_PX = 400;

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

const MobileSkeletonCards = ({ count = 8 }) =>
  Array.from({ length: count }, (_, i) => (
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

const TrendingTable = ({
  tokens, loading, sortBy, sortDirection, onSortChange,
  // Infinite scroll (optional): omit onLoadMore for a plain, non-paged list.
  hasMore = false, loadingMore = false, loadError = false, onLoadMore, onRetry,
}) => {
  const router = useRouter();
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(800);

  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
    setViewportH(e.currentTarget.clientHeight);
  }, []);

  // A fresh page 1 (chain or sort change) starts back at the top.
  useEffect(() => {
    if (!loading || !scrollRef.current) return;
    scrollRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [loading]);

  // Watch the sentinel inside the list's own scroll container (not the page),
  // so it works whether the page or the inner area is what scrolls. The
  // observer is only armed while a load can actually start — never while one
  // is in flight — and is rebuilt after every page lands, which re-checks the
  // sentinel: on a tall viewport the list keeps filling until it overflows.
  const canLoadMore = Boolean(onLoadMore) && !loading && !loadingMore && hasMore && !loadError && tokens.length > 0;
  useEffect(() => {
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!canLoadMore || !root || !target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries.some((entry) => entry.isIntersecting)) onLoadMore(); },
      { root, rootMargin: `0px 0px ${PREFETCH_PX}px 0px`, threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [canLoadMore, onLoadMore, tokens.length]);

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
              {loadingMore && <SkeletonRows count={3} />}
            </>
          )}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="md:hidden">
        {loading ? (
          <MobileSkeletonCards />
        ) : total === 0 ? (
          <div className="text-center py-16 text-dex-text-secondary">
            <div className="text-3xl mb-2">🍌</div>
            No tokens found
          </div>
        ) : (
          <>
            {sortedTokens.map((token) => (
              <MobileCard key={token.id} token={token} onClick={() => router.push(`/${token.chainId}/${token.tokenAddress}`)} />
            ))}
            {loadingMore && <MobileSkeletonCards count={2} />}
          </>
        )}
      </div>

      {/* Infinite-scroll footer: sentinel while more may come, then a quiet end state */}
      {onLoadMore && !loading && total > 0 && (
        <div className="text-center text-xs text-dex-text-tertiary">
          {hasMore && !loadError && <div ref={sentinelRef} aria-hidden className="h-px" />}
          {loadingMore && (
            <div className="flex items-center justify-center gap-2 py-3" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-dex-blue" />
              Loading more tokens…
            </div>
          )}
          {loadError && (
            <div className="py-6">
              Couldn&apos;t load more tokens.{" "}
              <button onClick={onRetry} className="text-dex-blue hover:underline">Retry</button>
            </div>
          )}
          {!hasMore && <div className="py-6">You&apos;ve reached the end · {total} tokens</div>}
        </div>
      )}
    </div>
  );
};

export default TrendingTable;
