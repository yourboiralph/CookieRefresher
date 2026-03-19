"use client";

import { useState } from "react";
import {
  Card, CardHeader, CardBody,
  Button, Textarea, UploadZone,
  LogPanel, StatChip, OutputBlock,
  type LogEntry,
} from "./ui";
import { useVault } from "../context/VaultContext";
import { replaceCookies } from "../lib/parser";

export default function ReplacePanel() {
  const { vault, setVaultField, hasFile } = useVault();

  const [localAccounts, setLocalAccounts] = useState("");
  const [localRefreshed, setLocalRefreshed] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<{
    output: string;
    replaced: number;
    unmatched: string[];
    total: number;
  } | null>(null);

  const accounts = localAccounts || vault.accounts;
  const refreshed = localRefreshed || vault.refreshed;

  const run = () => {
    if (!accounts.trim()) {
      setLogs([{ msg: "No account list loaded. Add to vault or use override.", type: "error" }]);
      return;
    }
    if (!refreshed.trim()) {
      setLogs([{ msg: "No refreshed accounts loaded. Add to vault or use override.", type: "error" }]);
      return;
    }
    setLogs([]);

    const res = replaceCookies(accounts, refreshed);
    const newLogs: LogEntry[] = [];

    newLogs.push({ msg: `Replaced ${res.replaced} cookie(s). Order preserved.`, type: "success" });
    res.unmatched.forEach((u) =>
      newLogs.push({ msg: `'${u}' in refreshed but not in account list — skipped.`, type: "warn" })
    );

    // Auto-update vault account.txt with the new output
    setVaultField("accounts", res.output);
    newLogs.push({ msg: "✓ Vault account.txt updated automatically.", type: "success" });

    setLogs(newLogs);
    setResult(res);
  };

  const clear = () => {
    setLocalAccounts("");
    setLocalRefreshed("");
    setLogs([]);
    setResult(null);
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Source badges */}
      <div className="flex flex-wrap gap-3">
        <SourceBadge vaultLoaded={hasFile("accounts")} localOverride={!!localAccounts} label="account.txt" />
        <SourceBadge vaultLoaded={hasFile("refreshed")} localOverride={!!localRefreshed} label="refreshed.txt" />
      </div>

      {/* Auto-update notice */}
      <div className="flex items-center gap-2 bg-accent3/10 border border-accent3/20 rounded-xl px-4 py-2.5">
        <span className="text-accent3 text-sm">⚡</span>
        <span className="text-[11px] text-accent3 font-mono">
          After replacing, vault account.txt will be updated automatically.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Accounts */}
        <Card>
          <CardHeader icon="📋" label="account.txt — current list" />
          <CardBody>
            {hasFile("accounts") && !localAccounts ? (
              <VaultUsing label="account.txt" />
            ) : null}
            <details className="mt-1">
              <summary className="text-[10px] text-dim cursor-pointer hover:text-[#e8e8f0] transition-colors select-none mb-2">
                ↳ Override for this run
              </summary>
              <UploadZone label="Upload account.txt override" onLoad={setLocalAccounts} />
              <Textarea
                value={localAccounts}
                onChange={setLocalAccounts}
                placeholder="Paste account list override..."
                rows={8}
              />
              {localAccounts && (
                <button onClick={() => setLocalAccounts("")} className="text-[10px] text-dim hover:text-red-400 mt-2 font-mono transition-colors">
                  ✕ Remove override
                </button>
              )}
            </details>
          </CardBody>
        </Card>

        {/* Refreshed */}
        <Card>
          <CardHeader icon="🔄" label="refreshed.txt — new cookies" />
          <CardBody>
            {hasFile("refreshed") && !localRefreshed ? (
              <VaultUsing label="refreshed.txt" />
            ) : null}
            <details className="mt-1">
              <summary className="text-[10px] text-dim cursor-pointer hover:text-[#e8e8f0] transition-colors select-none mb-2">
                ↳ Override for this run
              </summary>
              <UploadZone label="Upload refreshed.txt override" onLoad={setLocalRefreshed} />
              <Textarea
                value={localRefreshed}
                onChange={setLocalRefreshed}
                placeholder={"Paste refreshed accounts override...\nusername:password:_|WARNING...|_cookie"}
                rows={8}
              />
              {localRefreshed && (
                <button onClick={() => setLocalRefreshed("")} className="text-[10px] text-dim hover:text-red-400 mt-2 font-mono transition-colors">
                  ✕ Remove override
                </button>
              )}
            </details>
          </CardBody>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button variant="primary" onClick={run}>🔄 Replace Dead Cookies</Button>
        <Button variant="secondary" onClick={clear}>✕ Clear</Button>
      </div>

      <LogPanel entries={logs} />

      {result && (
        <>
          <div className="flex gap-3 flex-wrap mt-2">
            <StatChip label="total accounts" value={result.total} color="#7c6aff" />
            <StatChip label="replaced" value={result.replaced} color="#4ade80" />
            <StatChip label="unmatched" value={result.unmatched.length} color={result.unmatched.length > 0 ? "#f87171" : undefined} />
          </div>
          <div className="mt-4">
            <OutputBlock icon="✅" label="account.txt — updated" value={result.output} filename="account.txt" />
          </div>
        </>
      )}
    </div>
  );
}

function VaultUsing({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 mb-2">
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      <span className="text-[11px] text-accent font-mono">Using vault: {label}</span>
    </div>
  );
}

function SourceBadge({ vaultLoaded, localOverride, label }: { vaultLoaded: boolean; localOverride: boolean; label: string }) {
  if (localOverride) return (
    <div className="flex items-center gap-2 text-[11px] font-mono text-yellow-400">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />{label}: local override
    </div>
  );
  if (vaultLoaded) return (
    <div className="flex items-center gap-2 text-[11px] font-mono text-accent">
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />{label}: from vault
    </div>
  );
  return (
    <div className="flex items-center gap-2 text-[11px] font-mono text-dim">
      <span className="w-1.5 h-1.5 rounded-full bg-dim" />{label}: not loaded
    </div>
  );
}