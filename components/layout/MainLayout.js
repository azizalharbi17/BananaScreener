"use client";
import { useEffect } from "react";
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
    <div className="flex min-h-screen bg-dex-bg-primary text-dex-text-primary">
      <LeftSidebar openSearchModal={openSearchModal} />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
};

export default MainLayout;
