"use client";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import SearchModal from "@/components/modals/SearchModal";

export default function PortfolioPage() {
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <MainLayout openSearchModal={() => setSearchModalOpen(true)}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Portfolio</h1>
        <div className="bg-dex-bg-secondary rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">💼</div>
          <h2 className="text-xl font-semibold text-dex-text-primary mb-2">Portfolio Tracking Coming Soon</h2>
          <p className="text-dex-text-secondary max-w-md mx-auto">
            We&apos;re working on integrating wallet tracking. In the meantime, explore trending tokens and search for your favorite DEX pairs.
          </p>
        </div>
      </div>
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </MainLayout>
  );
}
