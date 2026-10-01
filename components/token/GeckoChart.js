"use client";
import { useEffect, useRef, useState } from "react";
import { getOHLCV } from "@/utils/api";
import UpdatedAgo from "@/components/common/UpdatedAgo";
import { formatUsdPrice, usdPriceDecimals, formatUsdAxis } from "@/utils/formatters";

// Pool (DEX) candle chart — the primary chart on every token page, every chain.
// Data: GeckoTerminal OHLCV for this exact pool, served from our cache.
//
// Live: after the first paint it re-polls every POLL_MS and appends/updates
// only the trailing candles (series.update), so zoom and scroll are preserved.
// Never dead-ends: a cold pool (cache row still pending) retries fast, a quiet
// pool (no candles yet at this resolution) and a failed fetch keep polling at
// the normal cadence. Resolution defaults to 15m and remembers the last choice.
//
// Unit: candles are the base token's USD price (lib/refreshers.js requests
// currency=usd), and the price axis is formatted in dollars at a precision that
// fits the token, so the axis reads "$0.004762" like the panel — not "0.00".
const TIMEFRAMES = [
  { label: "1m", timeframe: "minute", aggregate: "1" },
  { label: "5m", timeframe: "minute", aggregate: "5" },
  { label: "15m", timeframe: "minute", aggregate: "15" },
  { label: "1h", timeframe: "hour", aggregate: "1" },
  { label: "4h", timeframe: "hour", aggregate: "4" },
  { label: "1D", timeframe: "day", aggregate: "1" },
];
const DEFAULT_TF_LABEL = "15m";
const TF_STORAGE_KEY = "bs:chartTf";

const POLL_MS = 30_000; // live refresh; the server row itself refreshes every 60s
const PENDING_RETRY_MS = 3_000; // cold start: first candles usually land within seconds
const PENDING_FAST_RETRIES = 20; // ~60s of fast retries, then settle to POLL_MS

const CHART_OPTIONS = {
  layout: {
    background: { color: "#0e1118" },
    textColor: "#9ca3af",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  grid: {
    vertLines: { color: "rgba(46, 46, 46, 0.3)" },
    horzLines: { color: "rgba(46, 46, 46, 0.3)" },
  },
  crosshair: { mode: 0 },
  rightPriceScale: { borderColor: "#2e2e2e", autoScale: true },
  timeScale: { borderColor: "#2e2e2e", timeVisible: true, secondsVisible: false },
  autoSize: true,
};
const CANDLE_OPTIONS = {
  upColor: "#26a69a",
  downColor: "#ef5350",
  borderDownColor: "#ef5350",
  borderUpColor: "#26a69a",
  wickDownColor: "#ef5350",
  wickUpColor: "#26a69a",
};
const AREA_OPTIONS = {
  lineColor: "#f0b90b",
  topColor: "rgba(240, 185, 11, 0.25)",
  bottomColor: "rgba(240, 185, 11, 0.02)",
  lineWidth: 2,
};

const toBars = (r) => r.ohlc.map((b, i) => ({ ...b, volume: r.volumes[i] || 0 }));
const toSeriesBar = (b, chartType) =>
  chartType === "candles"
    ? { time: b.time, open: b.open, high: b.high, low: b.low, close: b.close }
    : { time: b.time, value: b.close };
const toVolumeBar = (b) => ({
  time: b.time,
  value: b.volume,
  color: b.close >= b.open ? "rgba(38, 166, 154, 0.3)" : "rgba(239, 83, 80, 0.3)",
});

const GeckoChart = ({ pair }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeRef = useRef(null);
  const barsRef = useRef([]); // merged candles, ascending by time
  const fittedRef = useRef(false); // fitContent only on the first paint per pool/resolution
  const chartTypeRef = useRef("candles");
  const decimalsRef = useRef(null); // current axis precision, re-derived from the last close

  const [tf, setTf] = useState(null); // resolved after mount (localStorage) to avoid SSR mismatch
  const [chartType, setChartType] = useState("candles"); // "candles" | "line"
  // loading | pending | ready | empty | unknown | error — overlays only show while no bars exist
  const [status, setStatus] = useState("loading");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [lastClose, setLastClose] = useState(null); // last candle close (USD), shown in the toolbar
  chartTypeRef.current = chartType;

  const network = pair?.chainId;
  const poolAddress = pair?.pairAddress;

  // Remembered resolution, else 15m.
  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(TF_STORAGE_KEY);
    } catch {}
    setTf(TIMEFRAMES.find((t) => t.label === saved) || TIMEFRAMES.find((t) => t.label === DEFAULT_TF_LABEL));
  }, []);

  const chooseTf = (t) => {
    setTf(t);
    try {
      localStorage.setItem(TF_STORAGE_KEY, t.label);
    } catch {}
  };

  // Dollar axis with token-appropriate precision (mirrors the panel's formatter
  // so axis == panel). lightweight-charts' default 2-decimal price format is
  // what made $0.004762 read as "0.00" / "0.01".
  const applyPriceFormat = () => {
    const s = seriesRef.current;
    const bars = barsRef.current;
    if (!s || !bars.length) return;
    const d = usdPriceDecimals(bars[bars.length - 1].close);
    if (d === decimalsRef.current) return;
    decimalsRef.current = d;
    s.applyOptions({
      priceFormat: { type: "custom", minMove: 10 ** -d, formatter: (p) => formatUsdAxis(p, d) },
    });
  };

  const noteLastClose = () => {
    const bars = barsRef.current;
    setLastClose(bars.length ? bars[bars.length - 1].close : null);
  };

  const paintAll = (fit) => {
    const s = seriesRef.current;
    const v = volumeRef.current;
    if (!s || !v) return;
    const bars = barsRef.current;
    applyPriceFormat();
    s.setData(bars.map((b) => toSeriesBar(b, chartTypeRef.current)));
    v.setData(bars.map(toVolumeBar));
    if (fit) {
      chartRef.current?.timeScale().fitContent();
      fittedRef.current = true;
    }
  };

  // Merge a fresh OHLCV window into the chart. First data paints everything and
  // fits; later polls update only bars at/after the last known time so the
  // user's zoom and scroll position survive.
  const applyResult = (r) => {
    const bars = toBars(r);
    const prev = barsRef.current;
    if (!prev.length) {
      barsRef.current = bars;
      paintAll(true);
      noteLastClose();
      return;
    }
    const lastTime = prev[prev.length - 1].time;
    if (bars[0].time > lastTime) {
      // Gap (tab slept past the whole window): repaint without refitting.
      barsRef.current = bars;
      paintAll(false);
      noteLastClose();
      return;
    }
    const tail = bars.filter((b) => b.time >= lastTime);
    if (!tail.length) return;
    barsRef.current = [...prev.filter((b) => b.time < lastTime), ...tail];
    noteLastClose();
    const s = seriesRef.current;
    const v = volumeRef.current;
    if (!s || !v) return;
    applyPriceFormat();
    for (const b of tail) {
      s.update(toSeriesBar(b, chartTypeRef.current));
      v.update(toVolumeBar(b));
    }
  };

  // Chart + series lifecycle. The chart instance lives for the component's
  // life; series are rebuilt when the chart type changes.
  useEffect(() => {
    let disposed = false;
    (async () => {
      const lc = await import("lightweight-charts");
      if (disposed || !containerRef.current) return;
      if (!chartRef.current) chartRef.current = lc.createChart(containerRef.current, CHART_OPTIONS);
      const chart = chartRef.current;
      if (seriesRef.current) chart.removeSeries(seriesRef.current);
      if (volumeRef.current) chart.removeSeries(volumeRef.current);
      seriesRef.current =
        chartType === "candles"
          ? chart.addSeries(lc.CandlestickSeries, CANDLE_OPTIONS)
          : chart.addSeries(lc.AreaSeries, AREA_OPTIONS);
      volumeRef.current = chart.addSeries(lc.HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      decimalsRef.current = null; // new series: re-apply the dollar price format
      if (barsRef.current.length) paintAll(!fittedRef.current);
    })();
    return () => {
      disposed = true;
    };
  }, [chartType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeRef.current = null;
    },
    []
  );

  // Fetch + live poll loop per (pool, resolution).
  useEffect(() => {
    if (!poolAddress || !network || !tf) return;
    let cancelled = false;
    let timer = null;
    let pendingTries = 0;

    barsRef.current = [];
    fittedRef.current = false;
    seriesRef.current?.setData([]);
    volumeRef.current?.setData([]);
    setStatus("loading");
    setUpdatedAt(null);
    setLastClose(null);

    const schedule = (ms) => {
      if (!cancelled) timer = setTimeout(tick, ms);
    };

    const tick = async () => {
      // Don't burn requests in background tabs once we have something to show.
      if (typeof document !== "undefined" && document.hidden && barsRef.current.length) {
        schedule(POLL_MS);
        return;
      }
      try {
        const r = await getOHLCV(network, poolAddress, tf.timeframe, tf.aggregate);
        if (cancelled) return;
        if (r.pending) {
          pendingTries += 1;
          if (!barsRef.current.length) setStatus("pending");
          schedule(pendingTries < PENDING_FAST_RETRIES ? PENDING_RETRY_MS : POLL_MS);
          return;
        }
        if (!r.ohlc.length) {
          if (!barsRef.current.length) setStatus(r.notFound ? "unknown" : "empty");
          schedule(POLL_MS);
          return;
        }
        applyResult(r);
        setStatus("ready");
        setUpdatedAt(r.updatedAt || new Date().toISOString());
        schedule(POLL_MS);
      } catch (e) {
        if (cancelled) return;
        console.error("GeckoChart fetch failed:", e?.message || e);
        if (!barsRef.current.length) setStatus("error");
        schedule(POLL_MS);
      }
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [poolAddress, network, tf]); // eslint-disable-line react-hooks/exhaustive-deps

  const overlay = (() => {
    switch (status) {
      case "loading":
        return { spin: true, text: "Loading candles…" };
      case "pending":
        return { spin: true, text: "Building this pool's chart… first candles usually appear within seconds." };
      case "empty":
        return { spin: false, text: `No ${tf?.label || ""} candles for this pool yet. Try another timeframe — this chart keeps checking.` };
      case "unknown":
        return { spin: false, text: "GeckoTerminal has no candle data for this pool yet. This chart keeps checking." };
      case "error":
        return { spin: false, text: "Couldn't load candles. Retrying…" };
      default:
        return null;
    }
  })();

  return (
    <div className="h-full w-full flex flex-col">
      {/* ── Toolbar: resolutions left, live indicator + series type right ── */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-dex-border bg-dex-bg-secondary shrink-0">
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.label}
              onClick={() => chooseTf(t)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                tf?.label === t.label
                  ? "bg-dex-bg-highlight text-dex-text-primary font-semibold"
                  : "text-dex-text-secondary hover:text-dex-text-primary hover:bg-dex-bg-tertiary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {lastClose != null && (
            <span className="flex items-baseline gap-1" title="Last candle close, in USD">
              <span className="text-xs font-semibold text-dex-text-primary" data-testid="pool-chart-last">{formatUsdPrice(lastClose)}</span>
              <span className="text-[10px] text-dex-text-tertiary">USD</span>
            </span>
          )}
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-dex-text-tertiary" title="Pool candles from GeckoTerminal, refreshed automatically" data-testid="pool-chart-live" data-live={status === "ready" ? "1" : "0"}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${status === "ready" ? "bg-dex-green" : "bg-dex-text-tertiary"}`} />
            {status === "ready" ? "live" : "pool chart"}
            {status === "ready" && updatedAt && <UpdatedAgo updatedAt={updatedAt} />}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setChartType("candles")}
              title="Candles"
              className={`px-2 py-1 text-xs rounded transition-colors ${
                chartType === "candles"
                  ? "bg-dex-bg-highlight text-dex-text-primary"
                  : "text-dex-text-secondary hover:text-dex-text-primary hover:bg-dex-bg-tertiary"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                <rect x="2" y="4" width="3" height="6" rx="0.5" />
                <rect x="3.25" y="1.5" width="0.9" height="11" rx="0.45" />
                <rect x="9" y="2.5" width="3" height="7" rx="0.5" />
                <rect x="10.25" y="1" width="0.9" height="11.5" rx="0.45" />
              </svg>
            </button>
            <button
              onClick={() => setChartType("line")}
              title="Line"
              className={`px-2 py-1 text-xs rounded transition-colors ${
                chartType === "line"
                  ? "bg-dex-bg-highlight text-dex-text-primary"
                  : "text-dex-text-secondary hover:text-dex-text-primary hover:bg-dex-bg-tertiary"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1.5 10.5 L5 6 L8 8.5 L12.5 3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* The chart container is always mounted so the instance survives
          pool/resolution changes; status overlays sit on top while no bars exist. */}
      <div className="relative flex-1 min-h-0">
        <div ref={containerRef} className="h-full w-full" data-testid="pool-chart" />
        {overlay && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-dex-bg-secondary/90 px-6 text-center" data-testid="pool-chart-status" data-status={status}>
            <div>
              {overlay.spin && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dex-blue mx-auto mb-2" />}
              <div className="text-xs text-dex-text-secondary">{overlay.text}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeckoChart;
