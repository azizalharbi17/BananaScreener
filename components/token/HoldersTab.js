"use client";
import { useState, useEffect, useRef } from "react";
import { BLOCK_EXPLORERS, NETWORK_LABELS } from "@/utils/networks";
import { formatNumber, formatUsdCompact, truncateAddress } from "@/utils/formatters";
import { GT_TO_BANANAMAPS_CHAIN, bananaMapsAppUrl } from "@/utils/bananamaps";

// Top-150 holders from the BananaMaps holder graph — with cluster membership,
// which plain address lists (DexScreener) don't show.
const POLL_INTERVAL_MS = 6000;
const MAX_POLLS = 20;

const badgeStyle = {
  cex: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  dex: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  burn: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  contract: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  cluster: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

const HoldersTab = ({ token, network }) => {
  const [state, setState] = useState({ status: "loading", holders: [], totalHolders: null, clusters: 0 });
  const pollsRef = useRef(0);

  useEffect(() => {
    if (!token?.address || !network) return;
    let cancelled = false;
    let timer;
    pollsRef.current = 0;

    const apply = (data) => {
      if (cancelled) return true;
      if (data.unsupported) {
        setState({ status: "unsupported", holders: [], totalHolders: null, clusters: 0 });
        return true;
      }
      if (data.holders) {
        setState({ status: "ready", holders: data.holders, totalHolders: data.totalHolders, clusters: data.clusters });
        return true;
      }
      return false; // still building
    };

    const poll = async () => {
      try {
        const res = await fetch(`/api/holders?network=${network}&tokenAddress=${token.address}&mode=poll`);
        if (apply(await res.json())) return;
      } catch {}
      pollsRef.current += 1;
      if (pollsRef.current >= MAX_POLLS) {
        if (!cancelled) setState((s) => ({ ...s, status: "timeout" }));
        return;
      }
      if (!cancelled) {
        setState((s) => (s.status === "loading" ? { ...s, status: "building" } : s));
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    (async () => {
      try {
        const res = await fetch(`/api/holders?network=${network}&tokenAddress=${token.address}&mode=start`);
        if (apply(await res.json())) return;
      } catch {}
      if (!cancelled) {
        setState((s) => ({ ...s, status: "building" }));
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    })();

    return () => { cancelled = true; clearTimeout(timer); };
  }, [token?.address, network]);

  const explorer = BLOCK_EXPLORERS[network] || "";
  const walletUrl = (addr) =>
    !explorer ? "#" : network === "solana" ? `${explorer}/account/${addr}` : `${explorer}/address/${addr}`;

  if (state.status === "unsupported") {
    const supported = Object.keys(GT_TO_BANANAMAPS_CHAIN)
      .map((n) => NETWORK_LABELS[n] || n)
      .join(", ");
    return (
      <div className="p-10 text-center text-dex-text-secondary text-sm">
        Holder maps aren't available for {NETWORK_LABELS[network] || network} yet — BananaMaps covers {supported}.
      </div>
    );
  }

  if (state.status === "loading" || state.status === "building")
    return (
      <div className="p-10 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dex-blue mx-auto mb-3" />
        <div className="text-sm text-dex-text-secondary">
          {state.status === "building" ? "Building holder map — first build can take a couple of minutes…" : "Loading holders…"}
        </div>
      </div>
    );

  if (state.status === "timeout" || state.holders.length === 0)
    return (
      <div className="p-10 text-center text-dex-text-secondary text-sm">
        Holder data isn't ready yet — check back in a minute, or view the map on{" "}
        <a className="text-dex-blue hover:underline" href={bananaMapsAppUrl(network, token.address) || "https://www.bananamaps.io"} target="_blank" rel="noopener noreferrer">BananaMaps</a>.
      </div>
    );

  const maxPct = state.holders[0]?.pct || 1;

  return (
    <div className="overflow-x-auto">
      <div className="px-4 py-2.5 text-xs text-dex-text-secondary border-b border-dex-border flex items-center gap-3 flex-wrap">
        <span>
          Top {state.holders.length} holders
          {state.totalHolders ? <> of <span className="text-dex-text-primary font-medium">{formatNumber(state.totalHolders)}</span> total</> : null}
        </span>
        {state.clusters > 0 && (
          <span className="px-1.5 py-0.5 rounded border text-[10px] font-medium bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
            {state.clusters} connected clusters detected
          </span>
        )}
        <span className="text-dex-text-tertiary">data: BananaMaps holder graph</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase text-dex-text-secondary border-b border-dex-border">
            <th className="px-4 py-2.5 text-left">#</th>
            <th className="px-4 py-2.5 text-left">Address</th>
            <th className="px-4 py-2.5 text-left w-64">% Supply</th>
            <th className="px-4 py-2.5 text-right">Amount</th>
            <th className="px-4 py-2.5 text-right">Value</th>
            <th className="px-4 py-2.5 text-left">Tag</th>
            <th className="px-4 py-2.5 text-right">Exp</th>
          </tr>
        </thead>
        <tbody>
          {state.holders.map((h, i) => (
            <tr key={h.address} className="border-b border-dex-border/50 hover:bg-dex-bg-highlight">
              <td className="px-4 py-2 text-dex-text-tertiary">{i + 1}</td>
              <td className="px-4 py-2 font-mono text-xs">{truncateAddress(h.address)}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-14 text-xs font-medium">{h.pct >= 0.01 ? h.pct.toFixed(2) : "<0.01"}%</span>
                  <div className="flex-1 h-1.5 bg-dex-bg-highlight rounded-full overflow-hidden">
                    <div className="h-full bg-dex-blue rounded-full" style={{ width: `${Math.max(1, (h.pct / maxPct) * 100)}%` }} />
                  </div>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-xs">{h.amount != null ? formatNumber(h.amount) : "-"}</td>
              <td className="px-4 py-2 text-right text-xs">{h.usd != null ? formatUsdCompact(h.usd) : "-"}</td>
              <td className="px-4 py-2">
                {h.labelType ? (
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${badgeStyle[h.labelType] || badgeStyle.contract}`}>
                    {h.label || h.labelType.toUpperCase()}
                  </span>
                ) : h.cluster != null ? (
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${badgeStyle.cluster}`}>
                    Cluster #{h.cluster + 1}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-2 text-right">
                <a href={walletUrl(h.address)} target="_blank" rel="noopener noreferrer" className="text-dex-text-secondary hover:text-dex-text-primary">↗</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HoldersTab;
