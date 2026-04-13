"use client";
import TableHeader from "./TableHeader";
import TokenRow from "./TokenRow";

const TrendingTable = ({ tokens, loading, sortBy, sortDirection, onSortChange }) => {
  const tokenArray = Array.isArray(tokens) ? tokens : [];
  const sortedTokens = [...tokenArray];
  if (sortBy) {
    sortedTokens.sort((a, b) => {
      const get = (obj, path) => { let v = obj; for (const k of path.split(".")) { if (!v || typeof v !== "object") return 0; v = v[k]; } return v ?? 0; };
      return sortDirection === "asc" ? get(a, sortBy) - get(b, sortBy) : get(b, sortBy) - get(a, sortBy);
    });
  }
  return (
    <div className="flex-1 overflow-x-auto">
      <table className="w-full border-collapse">
        <TableHeader sortBy={sortBy} sortDirection={sortDirection} onSortChange={onSortChange} />
        <tbody>
          {loading ? <tr><td colSpan="13" className="text-center py-8 text-dex-text-secondary">Loading trending tokens...</td></tr>
            : sortedTokens.length === 0 ? <tr><td colSpan="13" className="text-center py-8 text-dex-text-secondary">No tokens found</td></tr>
            : sortedTokens.map((token, i) => <TokenRow key={token.id || i} token={token} rank={i + 1} />)}
        </tbody>
      </table>
    </div>
  );
};

export default TrendingTable;
