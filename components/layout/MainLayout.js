"use client";
import { useEffect } from "react";
import Link from "next/link";
import LeftSidebar from "./LeftSidebar";

const MainLayout = ({ children, openSearchModal }) => {
  // "/" focuses search from anywhere (unless typing in a field)
  useEffect(() => {
    if (!openSearchModal) return;
    const handler = (e) => {
      const tag = e.target?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && !e.target?.isContentEditable) {
        e.preventDefault();
        openSearchModal();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [openSearchModal]);

  return (
    <div className="flex min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] bg-dex-bg-primary text-dex-text-primary">
      <LeftSidebar openSearchModal={openSearchModal} />
      <main className="flex-1 flex flex-col min-w-0">
        {/* ── Mobile top bar: logo + search (sidebar is hidden < md) ── */}
        <header className="md:hidden h-14 shrink-0 sticky top-0 z-30 flex items-center justify-between px-3 bg-dex-bg-secondary border-b border-dex-border">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl">🍌</span>
            <span className="font-bold text-base">
              <span className="text-white">Banana</span>
              <span className="text-dex-accent">Screener</span>
            </span>
          </Link>
          {openSearchModal && (
            <button
              onClick={openSearchModal}
              aria-label="Search"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-dex-bg-tertiary text-dex-text-secondary hover:text-dex-text-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </header>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
