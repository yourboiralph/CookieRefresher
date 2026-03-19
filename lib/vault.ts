export const VAULT_KEYS = {
  accounts: "vault_accounts",
  dead: "vault_dead",
  refreshed: "vault_refreshed",
  order: "vault_order",
} as const;

export type VaultKey = keyof typeof VAULT_KEYS;

export interface VaultData {
  accounts: string;
  dead: string;
  refreshed: string;
  order: string;
}

export function loadVault(): VaultData {
  if (typeof window === "undefined")
    return { accounts: "", dead: "", refreshed: "", order: "" };
  return {
    accounts: localStorage.getItem(VAULT_KEYS.accounts) ?? "",
    dead: localStorage.getItem(VAULT_KEYS.dead) ?? "",
    refreshed: localStorage.getItem(VAULT_KEYS.refreshed) ?? "",
    order: localStorage.getItem(VAULT_KEYS.order) ?? "",
  };
}

export function saveVaultField(key: VaultKey, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VAULT_KEYS[key], value);
}

export function clearVault() {
  if (typeof window === "undefined") return;
  Object.values(VAULT_KEYS).forEach((k) => localStorage.removeItem(k));
}