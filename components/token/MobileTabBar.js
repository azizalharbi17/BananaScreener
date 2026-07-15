"use client";

// Fixed-height bottom tab bar for the mobile token page (DexScreener-style).
const TABS = [
  {
    id: "info",
    label: "Info",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: "combo",
    label: "Chart+Txns",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M2 3h16v7l-4-3-4 4-3-2-5 4V3z" opacity="0.9" />
        <path d="M2 14h16v1.5H2zM2 17h11v1.5H2z" />
      </svg>
    ),
  },
  {
    id: "chart",
    label: "Chart",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <rect x="3" y="6" width="3" height="8" rx="0.5" />
        <rect x="4.1" y="3.5" width="0.8" height="13" rx="0.4" />
        <rect x="8.5" y="4" width="3" height="7" rx="0.5" />
        <rect x="9.6" y="2" width="0.8" height="12" rx="0.4" />
        <rect x="14" y="8" width="3" height="6" rx="0.5" />
        <rect x="15.1" y="5.5" width="0.8" height="12.5" rx="0.4" />
      </svg>
    ),
  },
  {
    id: "txns",
    label: "Txns",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M3 5h14v2H3zM3 9h14v2H3zM3 13h14v2H3z" />
      </svg>
    ),
  },
];

const MobileTabBar = ({ active, onChange }) => (
  <nav className="shrink-0 grid grid-cols-4 border-t border-dex-border bg-dex-bg-secondary pb-[env(safe-area-inset-bottom)]">
    {TABS.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium ${
          active === tab.id ? "text-dex-accent" : "text-dex-text-secondary"
        }`}
        aria-current={active === tab.id ? "page" : undefined}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </nav>
);

export default MobileTabBar;
