"use client";
import { useEffect, useRef, useState } from "react";
import { getOHLCV } from "@/utils/api";

// GeckoTerminal OHLCV resolutions exposed in the toolbar.
const TIMEFRAMES = [
  { label: "1m", timeframe: "minute", aggregate: "1" },
  { label: "5m", timeframe: "minute", aggregate: "5" },
  { label: "15m", timeframe: "minute", aggregate: "15" },
  { label: "1h", timeframe: "hour", aggregate: "1" },
  { label: "4h", timeframe: "hour", aggregate: "4" },
  { label: "1D", timeframe: "day", aggregate: "1" },
];

const GeckoChart = ({ pair }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [tf, setTf] = useState(TIMEFRAMES[3]); // 1h default
  const [chartType, setChartType] = useState("candles"); // "candles" | "line"
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const network = pair?.chainId;
  const poolAddress = pair?.pairAddress;

  // Fetch OHLCV whenever the pool or resolution changes.
  useEffect(() => {
    if (!poolAddress || !network) return;
    let disposed = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getOHLCV(network, poolAddress, tf.timeframe, tf.aggregate);
        if (disposed) return;
        if (!result.ohlc || result.ohlc.length === 0) {
          setError("No OHLCV data available for this pool");
          setData(null);
        } else {
          setData(result);
        }
        setLoading(false);
      } catch (e) {
        if (!disposed) {
          console.error("GeckoChart error:", e);
          setError("Failed to load chart data");
          // Clearing data triggers the render effect's cleanup, so the old
          // chart isn't left alive on a detached container.
          setData(null);
          setLoading(false);
        }
      }
    })();

    return () => { disposed = true; };
  }, [poolAddress, network, tf]);

  // Render (or re-render) the chart from fetched data.
  useEffect(() => {
    if (!data || !containerRef.current) return;
    let disposed = false;

    (async () => {
      const lc = await import("lightweight-charts");
      if (disposed || !containerRef.current) return;

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      const chart = lc.createChart(containerRef.current, {
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
        rightPriceScale: {
          borderColor: "#2e2e2e",
          autoScale: true,
        },
        timeScale: {
          borderColor: "#2e2e2e",
          timeVisible: true,
          secondsVisible: false,
        },
        autoSize: true,
      });

      chartRef.current = chart;

      if (chartType === "candles") {
        const candleSeries = chart.addSeries(lc.CandlestickSeries, {
          upColor: "#26a69a",
          downColor: "#ef5350",
          borderDownColor: "#ef5350",
          borderUpColor: "#26a69a",
          wickDownColor: "#ef5350",
          wickUpColor: "#26a69a",
        });
        candleSeries.setData(data.ohlc);
      } else {
        const lineSeries = chart.addSeries(lc.AreaSeries, {
          lineColor: "#f0b90b",
          topColor: "rgba(240, 185, 11, 0.25)",
          bottomColor: "rgba(240, 185, 11, 0.02)",
          lineWidth: 2,
        });
        lineSeries.setData(data.ohlc.map((d) => ({ time: d.time, value: d.close })));
      }

      const volumeSeries = chart.addSeries(lc.HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(
        data.ohlc.map((d, i) => ({
          time: d.time,
          value: data.volumes[i] || 0,
          color: d.close >= d.open ? "rgba(38, 166, 154, 0.3)" : "rgba(239, 83, 80, 0.3)",
        }))
      );

      chart.timeScale().fitContent();
    })();

    return () => {
      disposed = true;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, chartType]);

  return (
    <div className="h-full w-full flex flex-col">
      {/* ── TV-style toolbar: resolutions left, series type right ── */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-dex-border bg-dex-bg-secondary shrink-0">
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.label}
              onClick={() => setTf(t)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                tf.label === t.label
                  ? "bg-dex-bg-highlight text-dex-text-primary font-semibold"
                  : "text-dex-text-secondary hover:text-dex-text-primary hover:bg-dex-bg-tertiary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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

      <div className="relative flex-1 min-h-0">
        {error ? (
          <div className="h-full flex items-center justify-center text-dex-text-secondary text-sm">
            {error}
          </div>
        ) : (
          <>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-dex-bg-secondary">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dex-blue mx-auto mb-2"></div>
                  <div className="text-xs text-dex-text-secondary">Loading OHLCV data…</div>
                </div>
              </div>
            )}
            <div ref={containerRef} className="h-full w-full" />
          </>
        )}
      </div>
    </div>
  );
};

export default GeckoChart;
