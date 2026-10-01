"use client";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import TopBar from "@/components/layout/TopBar";
import TrendingTable from "@/components/trending/TrendingTable";
import SearchModal from "@/components/modals/SearchModal";
import useInfiniteTrending from "@/components/trending/useInfiniteTrending";

export default function HomePage() {
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState("desc");
  const feed = useInfiniteTrending("");

  const handleSortChange = (col) => {
    if (sortBy === col) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDirection("desc"); }
    feed.reset(); // back to page 1; infinite scroll refills from there
  };

  return (
    <MainLayout openSearchModal={() => setSearchModalOpen(true)}>
      <div className="flex flex-col h-full">
        <TopBar chainId={undefined} sortBy={sortBy} onSortChange={handleSortChange} />
        <TrendingTable
          tokens={feed.tokens}
          loading={feed.loading}
          loadingMore={feed.loadingMore}
          hasMore={feed.hasMore}
          loadError={feed.loadError}
          onLoadMore={feed.loadMore}
          onRetry={feed.retry}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      </div>
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </MainLayout>
  );
}
