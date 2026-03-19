"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  loadVault,
  saveVaultField,
  clearVault,
  type VaultData,
  type VaultKey,
} from "../lib/vault";

interface VaultContextValue {
  vault: VaultData;
  setVaultField: (key: VaultKey, value: string) => void;
  clearAll: () => void;
  hasFile: (key: VaultKey) => boolean;
  lineCount: (key: VaultKey) => number;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vault, setVault] = useState<VaultData>({
    accounts: "",
    dead: "",
    refreshed: "",
    order: "",
  });

  useEffect(() => {
    setVault(loadVault());
  }, []);

  const setVaultField = useCallback((key: VaultKey, value: string) => {
    setVault((prev) => ({ ...prev, [key]: value }));
    saveVaultField(key, value);
  }, []);

  const clearAll = useCallback(() => {
    setVault({ accounts: "", dead: "", refreshed: "", order: "" });
    clearVault();
  }, []);

  const hasFile = useCallback(
    (key: VaultKey) => vault[key].trim().length > 0,
    [vault]
  );

  const lineCount = useCallback(
    (key: VaultKey) =>
      vault[key].trim() === ""
        ? 0
        : vault[key]
            .trim()
            .split("\n")
            .filter((l) => l.trim()).length,
    [vault]
  );

  return (
    <VaultContext.Provider
      value={{ vault, setVaultField, clearAll, hasFile, lineCount }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}