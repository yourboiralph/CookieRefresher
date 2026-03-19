import type { Metadata } from "next";
import "./globals.css";
import { VaultProvider } from "@/context/VaultContext";

export const metadata: Metadata = {
  title: "Account Manager Hub",
  description: "Roblox account cookie manager",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <VaultProvider>{children}</VaultProvider>
      </body>
    </html>
  );
}