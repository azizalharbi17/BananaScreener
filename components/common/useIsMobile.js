"use client";
import { useState, useEffect } from "react";

// JS media query (not CSS hiding) so mobile and desktop trees don't both
// mount — CSS-hidden components still run effects, which would mean two
// TradingView widgets and doubled trade polling on every token page.
export default function useIsMobile(query = "(max-width: 767px)") {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return isMobile;
}
