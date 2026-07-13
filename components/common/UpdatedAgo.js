"use client";
import { useEffect, useState } from "react";

// Subtle freshness indicator: "updated 34s ago". Re-renders every 5s.
const UpdatedAgo = ({ updatedAt }) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  if (!updatedAt) return null;
  const secs = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000));
  const label =
    secs < 60 ? `${secs}s` : secs < 3600 ? `${Math.floor(secs / 60)}m` : `${Math.floor(secs / 3600)}h`;

  return (
    <span className="text-xs text-dex-text-tertiary" title={new Date(updatedAt).toLocaleString()}>
      updated {label} ago
    </span>
  );
};

export default UpdatedAgo;
