"use client";

const TokenTabs = ({ activeTab, onChange }) => {
  const tabs = [{ id: "transactions", label: "Transactions" }];
  return (
    <div className="flex border-b border-dex-border">
      {tabs.map((tab) => (
        <button key={tab.id} className={`px-6 py-3 font-medium text-sm ${activeTab === tab.id ? "text-dex-text-primary border-b-2 border-dex-blue" : "text-dex-text-secondary hover:text-dex-text-primary"}`} onClick={() => onChange(tab.id)}>{tab.label}</button>
      ))}
    </div>
  );
};

export default TokenTabs;
