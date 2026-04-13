"use client";
import { useState } from "react";

const WalletManager = ({ wallets, selectedWallet, onAddWallet, onRemoveWallet, onSelectWallet }) => {
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [error, setError] = useState("");

  const handleAddWallet = () => {
    setError("");
    if (!newWalletName.trim()) { setError("Please enter a wallet name"); return; }
    if (!newWalletAddress.trim()) { setError("Please enter a wallet address"); return; }
    if (!/^0x[a-fA-F0-9]{40}$/.test(newWalletAddress)) { setError("Please enter a valid EVM wallet address"); return; }
    const success = onAddWallet({ name: newWalletName.trim(), address: newWalletAddress.trim(), addedAt: new Date().toISOString() });
    if (success) { setNewWalletName(""); setNewWalletAddress(""); } else setError("Wallet already exists");
  };

  return (
    <div className="bg-dex-bg-secondary rounded-lg p-4">
      <h2 className="text-lg font-medium mb-4">Your Wallets</h2>
      <div className="mb-6">
        {wallets.length === 0 ? <div className="text-dex-text-secondary text-center py-4">No wallets added yet</div> : (
          <div className="space-y-2">{wallets.map(w => (
            <div key={w.address} className={`flex items-center justify-between p-3 rounded cursor-pointer ${selectedWallet?.address === w.address ? "bg-dex-bg-highlight" : "hover:bg-dex-bg-tertiary"}`} onClick={() => onSelectWallet(w)}>
              <div className="flex-1"><div className="font-medium">{w.name}</div><div className="text-xs text-dex-text-secondary truncate">{w.address}</div></div>
              <button className="text-dex-text-tertiary hover:text-dex-red p-1" onClick={(e) => { e.stopPropagation(); onRemoveWallet(w.address); }}>&#x2715;</button>
            </div>
          ))}</div>
        )}
      </div>
      <div className="border-t border-dex-border pt-4">
        <h3 className="text-sm font-medium mb-2">Add New Wallet</h3>
        {error && <div className="text-dex-red text-sm mb-2">{error}</div>}
        <div className="mb-3"><label className="block text-xs text-dex-text-secondary mb-1">Wallet Name</label><input type="text" value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} placeholder="Main Wallet" className="w-full bg-dex-bg-tertiary border border-dex-border rounded p-2 text-dex-text-primary" /></div>
        <div className="mb-3"><label className="block text-xs text-dex-text-secondary mb-1">Wallet Address</label><input type="text" value={newWalletAddress} onChange={(e) => setNewWalletAddress(e.target.value)} placeholder="0x..." className="w-full bg-dex-bg-tertiary border border-dex-border rounded p-2 text-dex-text-primary" /></div>
        <button onClick={handleAddWallet} className="w-full bg-dex-blue hover:opacity-90 text-black font-medium rounded py-2">Add Wallet</button>
      </div>
    </div>
  );
};

export default WalletManager;
