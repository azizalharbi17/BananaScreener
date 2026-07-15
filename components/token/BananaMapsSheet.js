"use client";
import { useEffect, useState } from "react";
import { bananaMapsEmbedUrl, bananaMapsAppUrl } from "@/utils/bananamaps";

// BananaMaps holder map as an overlay (like DexScreener's Bubblemaps): a
// slide-up bottom sheet on mobile, a centered modal on desktop. Only rendered
// for chains BananaMaps supports — callers must hide their trigger otherwise.
//
// Cross-origin iframes can't report HTTP errors, so a stalled load counts as
// a failure after this timeout. (/embed always answers 200; real errors are
// handled inside the embed app.)
const EMBED_TIMEOUT_MS = 15000;

const EmbedSkeleton = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-dex-bg-secondary">
    <div className="animate-pulse flex flex-col items-center">
      <div className="text-4xl mb-4">🍌</div>
      <div className="h-3 w-44 rounded bg-dex-bg-highlight mb-2"></div>
      <div className="h-3 w-28 rounded bg-dex-bg-highlight"></div>
    </div>
  </div>
);

// disableEscape: yield the Escape key while another overlay (search modal)
// is stacked on top, so Escape closes overlays outside-in.
const BananaMapsSheet = ({ open, onClose, token, network, disableEscape = false }) => {
  const embedUrl = bananaMapsEmbedUrl(network, token?.address);
  const appUrl = bananaMapsAppUrl(network, token?.address);
  const [status, setStatus] = useState("loading");

  // Stall timeout for the embed.
  useEffect(() => {
    if (!open || !embedUrl) return;
    setStatus("loading");
    const timer = setTimeout(
      () => setStatus((s) => (s === "loading" ? "error" : s)),
      EMBED_TIMEOUT_MS
    );
    return () => clearTimeout(timer);
  }, [open, embedUrl]);

  // Escape closes; page behind must not scroll while the sheet is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape" && !disableEscape) onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, disableEscape]);

  if (!open || !embedUrl) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 h-[85dvh] rounded-t-2xl animate-sheet-up
                   md:animate-none md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                   md:h-[80vh] md:w-[min(64rem,calc(100vw-4rem))] md:rounded-xl
                   bg-dex-bg-secondary border border-dex-border flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={`BananaMaps holder map for ${token?.symbol || "token"}`}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-dex-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">🍌</span>
            <span className="font-semibold truncate">
              {token?.name || token?.symbol}
              <span className="ml-2 text-xs font-normal text-dex-text-secondary">holder map</span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline text-xs text-dex-blue hover:underline"
            >
              Open full map ↗
            </a>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-dex-text-secondary hover:text-dex-text-primary hover:bg-dex-bg-highlight"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 3 L13 13 M13 3 L3 13" />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative flex-1 min-h-0 bg-dex-bg-secondary">
          {status === "loading" && <EmbedSkeleton />}
          {status === "error" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <div className="text-4xl mb-3">🍌</div>
              <p className="text-sm text-dex-text-secondary mb-4">
                The embedded map didn&apos;t load — you can still open it on BananaMaps directly.
              </p>
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-dex-blue text-white rounded-lg text-sm font-medium hover:opacity-90"
              >
                View on BananaMaps ↗
              </a>
            </div>
          ) : (
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={`BananaMaps holder map for ${token?.symbol || "token"}`}
              className={`w-full h-full border-0 transition-opacity duration-300 ${
                status === "loaded" ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              style={{ colorScheme: "dark" }}
              onLoad={() => setStatus("loaded")}
              onError={() => setStatus("error")}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BananaMapsSheet;
