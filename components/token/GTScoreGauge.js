"use client";

// Large color-coded radial gauge for the GeckoTerminal score.
// green >= 80, yellow 50-79, red < 50.
// `na` renders the not-available state: GT sometimes reports a placeholder
// perfect score with no data behind it — that must show as N/A, never as 100.
const GTScoreGauge = ({ score, na = false }) => {
  const value = typeof score === "string" ? parseFloat(score) : score;
  if (!na && (value == null || Number.isNaN(value))) return null;

  const r = 26;
  const circumference = 2 * Math.PI * r;

  if (na) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 64 64" className="w-16 h-16">
            <circle cx="32" cy="32" r={r} fill="none" stroke="#2a2e39" strokeWidth="6" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-dex-text-tertiary">N/A</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-dex-text-secondary uppercase tracking-wider">GT Score</div>
          <div className="text-sm font-semibold text-dex-text-tertiary">Insufficient data</div>
        </div>
      </div>
    );
  }

  const color = value >= 80 ? "#22c55e" : value >= 50 ? "#eab308" : "#ef4444";
  const filled = (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#2a2e39" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>
            {Math.round(value)}
          </span>
        </div>
      </div>
      <div>
        <div className="text-xs text-dex-text-secondary uppercase tracking-wider">GT Score</div>
        <div className="text-sm font-semibold" style={{ color }}>
          {value >= 80 ? "High" : value >= 50 ? "Medium" : "Low"} trust
        </div>
      </div>
    </div>
  );
};

export default GTScoreGauge;
