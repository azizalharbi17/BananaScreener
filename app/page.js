"use client";
import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import TopBar from "@/components/layout/TopBar";
import TrendingTable from "@/components/trending/TrendingTable";
import SearchModal from "@/components/modals/SearchModal";
import { getTrendingTokens } from "@/utils/api";

export default function HomePage() {
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    setLoading(true);
    getTrendingTokens("", 1)
      .then(setTokens)
      .catch(() => setTokens([]))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const more = await getTrendingTokens("", nextPage);
      setTokens((prev) => [...prev, ...more]);
      setPage(nextPage);
    } catch (e) {}
    finally { setLoadingMore(false); }
  };

  const handleSortChange = (col) => {
    if (sortBy === col) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDirection("desc"); }
  };

  return (
    <MainLayout openSearchModal={() => setSearchModalOpen(true)}>
      <div className="flex flex-col h-full">
        <TopBar chainId={undefined} sortBy={sortBy} onSortChange={handleSortChange} />
        <TrendingTable tokens={tokens} loading={loading} sortBy={sortBy} sortDirection={sortDirection} onSortChange={handleSortChange} />
        {!loading && tokens.length > 0 && (
          <div className="p-4 text-center">
            <button onClick={loadMore} disabled={loadingMore} className="px-6 py-2 bg-dex-bg-tertiary hover:bg-dex-bg-highlight text-dex-text-primary rounded text-sm">
              {loadingMore ? "Loading..." : "Load More Tokens"}
            </button>
          </div>
        )}
      </div>
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </MainLayout>
  );
}
