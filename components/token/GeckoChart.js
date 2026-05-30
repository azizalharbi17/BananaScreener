"use client";
import { useEffect, useRef, useState } from "react";
import { getOHLCV } from "@/utils/api";

const GeckoChart = ({ pair }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const network = pair?.chainId;
    const poolAddress = pair?.pairAddress;
    if (!poolAddress || !network || !containerRef.current) return;

    let disposed = false;

    const loadChart = async () => {
      try {
        setLoading(true);
        setError(null);

        const [lc, data] = await Promise.all([
          import("lightweight-charts"),
          getOHLCV(network, poolAddress),
        ]);

        if (disposed) return;

        if (!data.ohlc || data.ohlc.length === 0) {
          setError("No OHLCV data available for this pool");
          setLoading(false);
          return;
        }

        // Clear any previous chart
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

        // Candlestick series
        const candleSeries = chart.addSeries(lc.CandlestickSeries, {
          upColor: "#26a69a",
          downColor: "#ef5350",
          borderDownColor: "#ef5350",
          borderUpColor: "#26a69a",
          wickDownColor: "#ef5350",
          wickUpColor: "#26a69a",
        });

        candleSeries.setData(data.ohlc);

        // Volume histogram
        const volumeSeries = chart.addSeries(lc.HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "volume",
        });

        chart.priceScale("volume").applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });

        const volumeData = data.ohlc.map((d, i) => ({
          time: d.time,
          value: data.volumes[i] || 0,
          color: d.close >= d.open ? "rgba(38, 166, 154, 0.3)" : "rgba(239, 83, 80, 0.3)",
        }));

        volumeSeries.setData(volumeData);
        chart.timeScale().fitContent();
        setLoading(false);
      } catch (e) {
        if (!disposed) {
          console.error("GeckoChart error:", e);
          setError("Failed to load chart data");
          setLoading(false);
        }
      }
    };

    loadChart();

    return () => {
      disposed = true;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [pair?.pairAddress, pair?.chainId]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-dex-text-secondary text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" style={{ minHeight: "300px" }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-dex-bg-secondary">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dex-blue mx-auto mb-2"></div>
            <div className="text-xs text-dex-text-secondary">Loading OHLCV data…</div>
          </div>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default GeckoChart;
