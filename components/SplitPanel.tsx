"use client";

import { useState } from "react";
import {
  Card, CardHeader, CardBody,
  Button, Textarea, UploadZone, FieldLabel,
  LogPanel, StatChip, OutputBlock, Toggle,
  type LogEntry,
} from "./ui";
import { useVault } from "../context/VaultContext";
import { splitAccounts } from "../lib/parser";

export default function SplitPanel() {
  const { vault, setVaultField, hasFile } = useVault();

  // Local overrides — if set, use these instead of vault
  const [localAccounts, setLocalAccounts] = useState("");
  const [localOrder, setLocalOrder] = useState("");
  const [useOrder, setUseOrder] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<{
    userpass: string;
    cookies: string;
    count: number;
  } | null>(null);

  // Effective values: local override takes priority, then vault
  const accounts = localAccounts || vault.accounts;
  const orderText = localOrder || vault.order;

  const addLog = (msg: string, type: LogEntry["type"] = "info") =>
    setLogs((p) => [...p, { msg, type }]);

  const run = () => {
    if (!accounts.trim()) {
      setLogs([{ msg: "No accounts loaded. Upload in the Vault or use the override below.", type: "error" }]);
      return;
    }
    setLogs([]);

    const res = splitAccounts(accounts, useOrder ? orderText : undefined);
    res.warnings.forEach((w) => addLog(w, "warn"));

    const source = localAccounts ? "local override" : "vault";
    addLog(`Split complete — ${res.count} account(s) from ${source}.`, "success");

    setResult({ userpass: res.userpassLines, cookies: res.cookieLines, count: res.count });
  };

  const clear = () => {
    setLocalAccounts("");
    setLocalOrder("");
    setLogs([]);
    setResult(null);
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Source indicator */}
      <SourceBadge
        vaultLoaded={hasFile("accounts")}
        localOverride={!!localAccounts}
        label="account.txt"
      />

      <Card>
        <CardHeader icon="📋" label="Accounts" />
        <CardBody>
          <Toggle enabled={useOrder} onChange={setUseOrder} label="Preserve original order" />

          {/* Vault status */}
          {hasFile("accounts") && !localAccounts && (
            <VaultUsing label="account.txt" onClear={() => {}} />
          )}

          {/* Local override */}
          <details className="mt-2">
            <summary className="text-[10px] text-dim cursor-pointer hover:text-[#e8e8f0] transition-colors select-none mb-2">
              ↳ Override with different file for this run
            </summary>
            <UploadZone label="Upload account.txt override" onLoad={setLocalAccounts} />
            <FieldLabel label="Or paste override" />
            <Textarea
              value={localAccounts}
              onChange={setLocalAccounts}
              placeholder={"Paste accounts to override vault...\nusername:password:_|WARNING...|_CAEaAh..."}
              rows={6}
            />
            {localAccounts && (
              <button
                onClick={() => setLocalAccounts("")}
                className="text-[10px] text-dim hover:text-red-400 mt-2 font-mono transition-colors"
              >
                ✕ Remove override — use vault
              </button>
            )}
          </details>

          {useOrder && (
            <div className="mt-4 border-t border-border pt-4">
              <FieldLabel label="Original order reference" hint="optional — from vault or override" />
              {hasFile("order") && !localOrder && (
                <VaultUsing label="original_order.txt" onClear={() => {}} />
              )}
              <details className="mt-2">
                <summary className="text-[10px] text-dim cursor-pointer hover:text-[#e8e8f0] transition-colors select-none mb-2">
                  ↳ Override order file for this run
                </summary>
                <UploadZone label="Upload original_order.txt override" onLoad={setLocalOrder} />
                <Textarea
                  value={localOrder}
                  onChange={setLocalOrder}
                  placeholder="Paste order list to override vault..."
                  rows={4}
                />
              </details>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button variant="primary" onClick={run}>⚡ Split Accounts</Button>
        <Button variant="secondary" onClick={clear}>✕ Clear</Button>
      </div>

      <LogPanel entries={logs} />

      {result && (
        <>
          <div className="flex gap-3 flex-wrap mt-2">
            <StatChip label="accounts" value={result.count} color="#7c6aff" />
            <StatChip label="user:pass pairs" value={result.count} color="#ff6a9b" />
            <StatChip label="cookies" value={result.count} color="#6affd4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <OutputBlock icon="👤" label="userpasscombo.txt" value={result.userpass} filename="userpasscombo.txt" />
            <OutputBlock icon="🍪" label="cookiecombo.txt" value={result.cookies} filename="cookiecombo.txt" />
          </div>
        </>
      )}
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────

function VaultUsing({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 mb-2">
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      <span className="text-[11px] text-accent font-mono">Using vault: {label}</span>
    </div>
  );
}

function SourceBadge({
  vaultLoaded,
  localOverride,
  label,
}: {
  vaultLoaded: boolean;
  localOverride: boolean;
  label: string;
}) {
  if (localOverride) {
    return (
      <div className="flex items-center gap-2 text-[11px] font-mono text-yellow-400">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        Using local override for {label}
      </div>
    );
  }
  if (vaultLoaded) {
    return (
      <div className="flex items-center gap-2 text-[11px] font-mono text-accent">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        Reading {label} from vault
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-[11px] font-mono text-dim">
      <span className="w-1.5 h-1.5 rounded-full bg-dim" />
      No {label} in vault — upload one above or use the override below
    </div>
  );
}