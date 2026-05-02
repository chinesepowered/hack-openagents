import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentFund — Strategy iNFT Marketplace",
  description:
    "AI trading strategies as iNFTs on 0G. Deposit, watch agents trade via Uniswap, executed by KeeperHub. Creators earn royalties forever."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-mono antialiased">{children}</body>
    </html>
  );
}
