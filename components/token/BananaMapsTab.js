"use client";

const BananaMapsTab = ({ token, network }) => {
  if (!token?.address) return <div className="p-4 text-center text-dex-text-secondary">No token data available</div>;

  const url = `https://bananamaps.io/?token=${token.address}&chain=${network}`;

  return (
    <div className="p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-5xl mb-4">🍌</div>
        <h3 className="text-xl font-bold text-dex-text-primary mb-2">BananaMaps</h3>
        <p className="text-dex-text-secondary mb-6">
          View holder distribution, whale wallets, and token flow analytics for {token.symbol} on BananaMaps.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 bg-dex-blue text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <span className="mr-2">🍌</span>
          View on BananaMaps
        </a>
        <p className="text-xs text-dex-text-tertiary mt-4">
          Opens in a new tab at bananamaps.io
        </p>
      </div>
    </div>
  );
};

export default BananaMapsTab;
