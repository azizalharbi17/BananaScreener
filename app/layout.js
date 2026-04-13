import "./globals.css";

export const metadata = {
  title: "BananaScreener - Crypto Token Screener",
  description: "Real-time crypto token screener powered by Moralis. Track trending tokens, analyze trading pairs, and monitor your portfolio across multiple chains.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍌</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
