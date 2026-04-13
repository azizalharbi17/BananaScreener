"use client";

const TableHeader = ({ sortBy, sortDirection, onSortChange }) => {
  const renderSortIcon = (column) => {
    if (sortBy !== column) return null;
    return <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <thead>
      <tr className="text-xs uppercase text-dex-text-secondary border-b border-dex-border">
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-left">#</th>
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-left">TOKEN</th>
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-right cursor-pointer" onClick={() => onSortChange("usdPrice")}>
          PRICE {renderSortIcon("usdPrice")}
        </th>
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-right cursor-pointer" onClick={() => onSortChange("createdAt")}>
          AGE {renderSortIcon("createdAt")}
        </th>
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-right cursor-pointer" onClick={() => onSortChange("transactions.24h")}>
          TXNS {renderSortIcon("transactions.24h")}
        </th>
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-right cursor-pointer" onClick={() => onSortChange("totalVolume.24h")}>
          VOLUME {renderSortIcon("totalVolume.24h")}
        </th>
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-right cursor-pointer" onClick={() => onSortChange("buyers.24h")}>
          MAKERS {renderSortIcon("buyers.24h")}
        </th>
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-right cursor-pointer" onClick={() => onSortChange("pricePercentChange.5m")}>
          5M {renderSortIcon("pricePercentChange.5m")}
        </th>
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-right cursor-pointer" onClick={() => onSortChange("pricePercentChange.1h")}>
          1H {renderSortIcon("pricePercentChange.1h")}
        </th>
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-right cursor-pointer" onClick={() => onSortChange("pricePercentChange.6h")}>
          6H {renderSortIcon("pricePercentChange.6h")}
        </th>
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-right cursor-pointer" onClick={() => onSortChange("pricePercentChange.24h")}>
          24H {renderSortIcon("pricePercentChange.24h")}
        </th>
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-right cursor-pointer" onClick={() => onSortChange("liquidityUsd")}>
          LIQUIDITY {renderSortIcon("liquidityUsd")}
        </th>
        <th className="sticky top-0 bg-dex-bg-primary px-4 py-3 text-right cursor-pointer" onClick={() => onSortChange("marketCap")}>
          MCAP {renderSortIcon("marketCap")}
        </th>
      </tr>
    </thead>
  );
};

export default TableHeader;
