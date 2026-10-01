"use client";
import React, { useEffect, useRef, memo } from 'react';

// Opt-in CEX chart. Only mounted when TokenChart has verified that TradingView
// lists this token (CoinGecko coin id + base-asset name match); `symbol` is the
// verified "EXCHANGE:SYMBOL", never a bare ticker. The pool chart is primary.
//
// How long the embed script gets to produce a loaded iframe before we declare
// the widget dead (network issue, adblocker, TV outage).
const LOAD_TIMEOUT_MS = 8000;

function TradingViewChart({ symbol = "BTCUSD", onReady, onFail }) {
  const container = useRef();
  // Latest callbacks without retriggering the widget effect (which must only
  // re-run when the symbol changes — rebuilding the widget drops its state).
  const callbacks = useRef({ onReady, onFail });
  callbacks.current = { onReady, onFail };

  useEffect(() => {
    const el = container.current;
    if (!el) return;

    el.innerHTML = '';
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    widget.style.width = "100%";
    el.appendChild(widget);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "allow_symbol_change": true,
        "calendar": false,
        "details": false,
        "hide_side_toolbar": true,
        "hide_top_toolbar": false,
        "hide_legend": false,
        "hide_volume": false,
        "hotlist": false,
        "interval": "15",
        "locale": "en",
        "save_image": true,
        "style": "1",
        "symbol": "${symbol}",
        "theme": "dark",
        "timezone": "Etc/UTC",
        "backgroundColor": "rgba(14, 17, 24, 1)",
        "gridColor": "rgba(46, 46, 46, 0.06)",
        "withdateranges": false,
        "autosize": true
      }`;

    // The embed script injects a cross-origin iframe; we can't read inside it,
    // but the iframe element's load event + a timeout tell us whether the
    // widget came up at all.
    let settled = false;
    const settle = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      observer.disconnect();
      (ok ? callbacks.current.onReady : callbacks.current.onFail)?.();
    };

    const timer = setTimeout(() => settle(false), LOAD_TIMEOUT_MS);
    const observer = new MutationObserver(() => {
      const iframe = el.querySelector("iframe");
      if (!iframe) return;
      observer.disconnect();
      iframe.addEventListener("load", () => settle(true), { once: true });
    });
    observer.observe(el, { childList: true, subtree: true });
    script.onerror = () => settle(false);

    el.appendChild(script);

    return () => {
      settled = true;
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }} />
  );
}

// Only the symbol should rebuild the widget; callback identity changes are
// handled through the ref above.
export default memo(TradingViewChart, (prev, next) => prev.symbol === next.symbol);
