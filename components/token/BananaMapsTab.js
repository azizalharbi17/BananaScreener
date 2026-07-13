"use client";
import { useEffect, useState } from "react";

// GeckoTerminal network ID → BananaMaps chain slug.
// BananaMaps only supports these chains; unmapped networks fall back to the link card.
const GT_TO_BANANAMAPS_CHAIN = {
  solana: "sol",
  eth: "eth",
  bsc: "bsc",
  base: "base",
};

// Cross-origin iframes can't report HTTP errors, so treat a stalled load as a failure.
const EMBED_TIMEOUT_MS = 15000;

const FallbackCard = ({ token, chain }) => {
  const url = `https://bananamaps.io/?token=${token.address}&chain=${chain}`;

  return (
    <div className="p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-5xl mb-4">🍌</div>
        <h3 className="text-xl font-bold text-dex-text-primary mb-2">BananaMaps</h3>
        <p className="text-dex-text-secondary mb-6">
          View holder distribution, whale wallets, and token flow analytics for {token.symbol} on BananaMaps.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 bg-dex-blue text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <span className="mr-2">🍌</span>
          View on BananaMaps
        </a>
        <p className="text-xs text-dex-text-tertiary mt-4">
          Opens in a new tab at bananamaps.io
        </p>
      </div>
    </div>
  );
};

const EmbedSkeleton = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-dex-bg-secondary">
    <div className="animate-pulse flex flex-col items-center">
      <div className="text-4xl mb-4">🍌</div>
      <div className="h-3 w-44 rounded bg-dex-bg-highlight mb-2"></div>
      <div className="h-3 w-28 rounded bg-dex-bg-highlight"></div>
    </div>
  </div>
);

const BananaMapsTab = ({ token, network }) => {
  const chain = GT_TO_BANANAMAPS_CHAIN[network];
  const embedUrl = token?.address && chain
    ? `https://www.bananamaps.io/embed?token=${token.address}&chain=${chain}&theme=dark`
    : null;
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!embedUrl) return;
    setStatus("loading");
    const timer = setTimeout(
      () => setStatus((s) => (s === "loading" ? "error" : s)),
      EMBED_TIMEOUT_MS
    );
    return () => clearTimeout(timer);
  }, [embedUrl]);

  if (!token?.address) return <div className="p-4 text-center text-dex-text-secondary">No token data available</div>;

  if (!embedUrl || status === "error") return <FallbackCard token={token} chain={chain || network} />;

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm text-dex-text-secondary">
          🍌 BananaMaps holder map for {token.symbol}
        </span>
        <a
          href={`https://bananamaps.io/app?token=${token.address}&chain=${chain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-dex-blue hover:underline"
        >
          Open full map ↗
        </a>
      </div>
      <div className="relative w-full h-[600px] min-h-[600px] overflow-hidden bg-dex-bg-secondary">
        {status === "loading" && <EmbedSkeleton />}
        <iframe
          key={embedUrl}
          src={embedUrl}
          title={`BananaMaps holder map for ${token.symbol}`}
          loading="lazy"
          className={`w-full h-full border-0 transition-opacity duration-300 ${
            status === "loaded" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{ colorScheme: "dark" }}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      </div>
    </div>
  );
};

export default BananaMapsTab;
