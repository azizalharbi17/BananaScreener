import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.bananascreener.io"),
  title: {
    default: "BananaScreener — Realtime DEX Token Screener",
    template: "%s | BananaScreener",
  },
  description:
    "Track trending tokens, prices, liquidity and holders across Solana, Ethereum, Base, BSC, Robinhood Chain and more.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍌</text></svg>",
  },
  openGraph: {
    title: "BananaScreener — Realtime DEX Token Screener",
    description:
      "Trending tokens, prices, liquidity and holder maps across 13 chains.",
    url: "https://www.bananascreener.io",
    siteName: "BananaScreener",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BananaScreener — Realtime DEX Token Screener",
    description:
      "Trending tokens, prices, liquidity and holder maps across 13 chains.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
