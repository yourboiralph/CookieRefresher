"use client";

import { useState } from "react";
import {
  Card, CardHeader, CardBody,
  Button, Textarea, UploadZone, FieldLabel,
  LogPanel, StatChip, OutputBlock,
  type LogEntry,
} from "./ui";
import { useVault } from "../context/VaultContext";
import { lookupDeadCookies } from "../lib/parser";

export default function LookupPanel() {
  const { vault, hasFile } = useVault();

  const [localAccounts, setLocalAccounts] = useState("");
  const [localDead, setLocalDead] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<{
    found: string[];
    notFound: number;
    total: number;
  } | null>(null);

  const accounts = localAccounts || vault.accounts;
  const dead = localDead || vault.dead;

  const run = () => {
    if (!accounts.trim()) {
      setLogs([{ msg: "No account list loaded. Add to vault or use override.", type: "error" }]);
      return;
    }
    if (!dead.trim()) {
      setLogs([{ msg: "No dead cookies loaded. Add to vault or use override.", type: "error" }]);
      return;
    }
    setLogs([]);

    const res = lookupDeadCookies(accounts, dead);
    const newLogs: LogEntry[] = [];

    if (res.found.length === 0) {
      newLogs.push({ msg: "No matches found. Make sure account.txt is up to date in the vault.", type: "warn" });
    } else {
      newLogs.push({ msg: `Found ${res.found.length} match(es) out of ${res.total} dead cookie(s).`, type: "success" });
    }
    if (res.notFound > 0) {
      newLogs.push({ msg: `${res.notFound} cookie(s) not found in account list.`, type: "warn" });
    }

    setLogs(newLogs);
    setResult(res);
  };

  const clear = () => {
    setLocalAccounts("");
    setLocalDead("");
    setLogs([]);
    setResult(null);
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Source badges */}
      <div className="flex flex-wrap gap-3">
        <SourceBadge vaultLoaded={hasFile("accounts")} localOverride={!!localAccounts} label="account.txt" />
        <SourceBadge vaultLoaded={hasFile("dead")} localOverride={!!localDead} label="dead.txt" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Accounts */}
        <Card>
          <CardHeader icon="📋" label="account.txt — full list" />
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

        {/* Dead cookies */}
        <Card>
          <CardHeader icon="💀" label="dead.txt — dead cookies" />
          <CardBody>
            {hasFile("dead") && !localDead ? (
              <VaultUsing label="dead.txt" />
            ) : null}
            <FieldLabel label="Dead cookies" hint="cookie-only OR full user:pass:cookie" />
            <details className="mt-1">
              <summary className="text-[10px] text-dim cursor-pointer hover:text-[#e8e8f0] transition-colors select-none mb-2">
                ↳ Override for this run
              </summary>
              <UploadZone label="Upload dead.txt override" onLoad={setLocalDead} />
              <Textarea
                value={localDead}
                onChange={setLocalDead}
                placeholder={"Paste dead cookies override...\n\nSupports:\n- Just the cookie\n- Full username:password:cookie"}
                rows={8}
              />
              {localDead && (
                <button onClick={() => setLocalDead("")} className="text-[10px] text-dim hover:text-red-400 mt-2 font-mono transition-colors">
                  ✕ Remove override
                </button>
              )}
            </details>
          </CardBody>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button variant="primary" onClick={run}>🔍 Find User:Pass</Button>
        <Button variant="secondary" onClick={clear}>✕ Clear</Button>
      </div>

      <LogPanel entries={logs} />

      {result && (
        <>
          <div className="flex gap-3 flex-wrap mt-2">
            <StatChip label="dead checked" value={result.total} />
            <StatChip label="matched" value={result.found.length} color="#4ade80" />
            <StatChip label="unmatched" value={result.notFound} color={result.notFound > 0 ? "#f87171" : undefined} />
          </div>
          {result.found.length > 0 && (
            <div className="mt-4">
              <OutputBlock icon="✅" label="dead_userpass.txt — matched accounts" value={result.found.join("\n")} filename="dead_userpass.txt" />
            </div>
          )}
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