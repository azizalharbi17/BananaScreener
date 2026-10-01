"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { getTrendingPage } from "@/utils/api";

// A cold page answers "pending" while the server's background refresh lands
// (fetchApi already waits a few seconds for it). Re-arm a couple of times
// before giving up so a chain nobody has paged through yet still fills in
// instead of ending early.
const PENDING_RETRIES = 2;
const PENDING_RETRY_MS = 1500;
// Transient failures (network blip, 503) back off and retry before the list
// surfaces a "Retry" affordance.
const ERROR_RETRIES = 2;
const ERROR_RETRY_MS = 2500;

// Append-only dedupe: trending rankings shift between requests, so a pool can
// land on two consecutive pages. Keep the first occurrence so row keys stay
// unique and nothing renders twice.
function appendUnique(prev, more) {
  const seen = new Set(prev.map((t) => t.id));
  const fresh = more.filter((t) => {
    if (!t.id || seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
  return fresh.length ? [...prev, ...fresh] : prev;
}

/**
 * Paged trending feed driven by infinite scroll. Same data source, page size
 * and ordering as the old "Load More" button — only the trigger changed.
 *
 *  - loadMore() is safe to call repeatedly: it no-ops while a page (or its
 *    backoff) is in flight, during the initial load, and after the end.
 *  - A network change, or reset(), drops everything and refetches page 1;
 *    responses from before the reset are ignored.
 */
export default function useInfiniteTrending(network) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [resetTick, setResetTick] = useState(0);

  const pageRef = useRef(1); // last page appended
  const inFlightRef = useRef(false); // a request (or its retry backoff) is active
  const hasMoreRef = useRef(true);
  const requestIdRef = useRef(0); // bumps on every reset; stale responses are dropped
  const retriesRef = useRef({ pending: 0, error: 0 });
  const timerRef = useRef(null);

  useEffect(() => {
    const reqId = ++requestIdRef.current;
    clearTimeout(timerRef.current);
    pageRef.current = 1;
    inFlightRef.current = true; // page 1 is loading: block loadMore until it lands
    hasMoreRef.current = true;
    retriesRef.current = { pending: 0, error: 0 };
    setTokens([]);
    setLoading(true);
    setLoadingMore(false);
    setHasMore(true);
    setLoadError(false);

    getTrendingPage(network, 1)
      .then(({ tokens: first }) => {
        if (reqId !== requestIdRef.current) return;
        setTokens(appendUnique([], first));
        if (first.length === 0) {
          hasMoreRef.current = false;
          setHasMore(false);
        }
      })
      .catch(() => {
        if (reqId !== requestIdRef.current) return;
        setTokens([]);
        hasMoreRef.current = false;
        setHasMore(false);
      })
      .finally(() => {
        if (reqId !== requestIdRef.current) return;
        inFlightRef.current = false;
        setLoading(false);
      });

    return () => clearTimeout(timerRef.current);
  }, [network, resetTick]);

  const loadMore = useCallback(() => {
    if (inFlightRef.current || !hasMoreRef.current) return;
    const reqId = requestIdRef.current;
    const nextPage = pageRef.current + 1;
    inFlightRef.current = true;
    setLoadingMore(true);

    // Release the in-flight guard now or after a backoff. The sentinel
    // observer re-arms when loadingMore flips back to false and re-checks
    // visibility, so a still-visible sentinel keeps the list filling.
    const settle = (delayMs = 0) => {
      const done = () => {
        if (reqId !== requestIdRef.current) return;
        inFlightRef.current = false;
        setLoadingMore(false);
      };
      if (delayMs > 0) timerRef.current = setTimeout(done, delayMs);
      else done();
    };

    getTrendingPage(network, nextPage)
      .then(({ tokens: more, pending }) => {
        if (reqId !== requestIdRef.current) return;
        if (more.length > 0) {
          pageRef.current = nextPage;
          retriesRef.current = { pending: 0, error: 0 };
          setTokens((prev) => appendUnique(prev, more));
          settle();
        } else if (pending && retriesRef.current.pending < PENDING_RETRIES) {
          retriesRef.current.pending += 1;
          settle(PENDING_RETRY_MS);
        } else {
          // Empty page (or negative-cached past the last page): that's the end.
          hasMoreRef.current = false;
          setHasMore(false);
          settle();
        }
      })
      .catch(() => {
        if (reqId !== requestIdRef.current) return;
        if (retriesRef.current.error < ERROR_RETRIES) {
          retriesRef.current.error += 1;
          settle(ERROR_RETRY_MS * retriesRef.current.error);
        } else {
          setLoadError(true);
          settle();
        }
      });
  }, [network]);

  const retry = useCallback(() => {
    retriesRef.current.error = 0;
    setLoadError(false);
    loadMore();
  }, [loadMore]);

  const reset = useCallback(() => setResetTick((t) => t + 1), []);

  return { tokens, loading, loadingMore, hasMore, loadError, loadMore, retry, reset };
}
