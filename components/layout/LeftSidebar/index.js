"use client";
import Link from "next/link";
import SearchButton from "./SearchButton";
import NavigationMenu from "./NavigationMenu";
import ChainSelector from "./ChainSelector";

const LeftSidebar = ({ openSearchModal }) => {
  return (
    <div className="w-[17rem] bg-dex-bg-secondary text-dex-text-primary flex flex-col border-r border-dex-border h-screen sticky top-0 overflow-y-auto">
      <div className="p-4 flex-1">
        <Link href="/" className="block">
          <span className="flex flex-col">
            <span className="flex items-center space-x-2">
              <span className="text-2xl">🍌</span>
              <span className="font-bold text-lg"><span className="text-white">Banana</span><span className="text-dex-accent">Screener</span></span>
            </span>
          </span>
        </Link>
        <span className="text-xs text-gray-400 ml-7 block mt-0.5">
          Powered by{" "}
          <a href="https://www.geckoterminal.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">GeckoTerminal</a>
        </span>
        <SearchButton openSearchModal={openSearchModal} />
        <NavigationMenu />
        <ChainSelector />
      </div>
    </div>
  );
};

export default LeftSidebar;
