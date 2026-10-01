"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import TopBar from "@/components/layout/TopBar";
import TrendingTable from "@/components/trending/TrendingTable";
import SearchModal from "@/components/modals/SearchModal";
import useInfiniteTrending from "@/components/trending/useInfiniteTrending";
import { PATH_TO_GT_NETWORK } from "@/utils/networks";

export default function ChainTrendingPage() {
  const params = useParams();
  const chainId = params.chainId;
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState("desc");
  // Switching chains changes the network, which resets the feed to page 1.
  const feed = useInfiniteTrending(PATH_TO_GT_NETWORK[chainId] || chainId);

  const handleSortChange = (col) => {
    if (sortBy === col) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDirection("desc"); }
    feed.reset(); // back to page 1; infinite scroll refills from there
  };

  return (
    <MainLayout openSearchModal={() => setSearchModalOpen(true)}>
      <div className="flex flex-col h-full">
        <TopBar chainId={chainId} sortBy={sortBy} onSortChange={handleSortChange} />
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
