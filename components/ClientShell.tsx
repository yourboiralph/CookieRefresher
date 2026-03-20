"use client";

import { VaultProvider } from "../context/VaultContext";
import VaultBar from "./VaultBar";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <VaultProvider>
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-8">
        <VaultBar />
      </div>
      {children}
    </VaultProvider>
  );
}