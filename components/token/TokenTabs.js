"use client";

const TokenTabs = ({ activeTab, onChange, onOpenMaps }) => {
  const tabs = [
    { id: "transactions", label: "Transactions" },
    { id: "holders", label: "Holders" },
    { id: "top-traders", label: "Top Traders" },
  ];

  return (
    <div className="flex items-center border-b border-dex-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`px-6 py-3 font-medium text-sm ${
            activeTab === tab.id
              ? "text-dex-text-primary border-b-2 border-dex-blue"
              : "text-dex-text-secondary hover:text-dex-text-primary"
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
      {onOpenMaps && (
        <button
          onClick={onOpenMaps}
          className="ml-auto mr-3 px-3 py-1.5 text-xs font-medium rounded-lg bg-dex-bg-tertiary border border-dex-border text-dex-text-primary hover:bg-dex-bg-highlight"
        >
          🍌 BananaMaps
        </button>
      )}
    </div>
  );
};

export default TokenTabs;
