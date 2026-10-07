import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader";
import "./globals.css";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { WalletProvider } from "@/components/wallet-provider";
import { TransactionProvider } from "@/components/transaction-provider";

export const metadata: Metadata = {
  title: "FixLine — public work, independently accepted",
  description: "Fund bounded public software work and let GenLayer validators assess the submitted revision.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <TransactionProvider>
            <AppShell>{children}</AppShell>
          </TransactionProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
