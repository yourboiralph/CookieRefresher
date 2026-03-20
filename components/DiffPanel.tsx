"use client";

import { useState, useMemo } from "react";
import {
  Card, CardHeader, CardBody,
  Button, Textarea, UploadZone, FieldLabel,
  LogPanel, StatChip,
  type LogEntry,
} from "./ui";
import { useVault } from "../context/VaultContext";
import { parseAccounts } from "../lib/parser";

// ── Output block ──────────────────────────────────────────────────────────

function DiffOutput({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const lines = value.split("\n").filter(Boolean);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const download = () => {
    const blob = new Blob([value], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "missing_accounts.txt";
    a.click();
  };

  return (
    <Card>
      <CardHeader icon="📤" label={`missing_accounts.txt — ${lines.length} account${lines.length !== 1 ? "s" : ""}`} />
      <CardBody>
        <Textarea value={value} readOnly rows={14} />
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 border border-border text-[11px] font-mono text-[#e8e8f0] hover:border-accent hover:text-accent transition-all cursor-pointer"
          >
            {copied ? "✓ Copied!" : "⎘ Copy All"}
          </button>
          <button
            onClick={download}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(74,222,128,0.12)] border border-[rgba(74,222,128,0.3)] text-[11px] font-mono text-[#4ade80] hover:bg-[rgba(74,222,128,0.2)] transition-all cursor-pointer"
          >
            ⬇ Download missing_accounts.txt
          </button>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Diff Panel ────────────────────────────────────────────────────────────

export default function DiffPanel() {
  const { vault } = useVault();

  const [localFull, setLocalFull] = useState("");
  const [partial, setPartial] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<{
    output: string;
    missingCount: number;
    fullCount: number;
    partialCount: number;
  } | null>(null);

  // Full list — local override takes priority over vault
  const fullText = localFull || vault.accounts || "";

  // Live counts
  const fullLineCount = useMemo(
    () => fullText.split("\n").filter((l) => l.trim()).length,
    [fullText]
  );
  const partialLineCount = useMemo(
    () => partial.split("\n").filter((l) => l.trim()).length,
    [partial]
  );

  const fullSource = localFull
    ? "⚠ Using local override"
    : vault.accounts
    ? "✓ Using vault — account.txt"
    : "✗ No full list loaded — upload in the Vault above";

  const fullSourceColor = localFull
    ? "text-yellow-400"
    : vault.accounts
    ? "text-accent3"
    : "text-red-400";

  const run = () => {
    if (!fullText.trim()) {
      setLogs([{ msg: "No full account list provided.", type: "error" }]);
      return;
    }
    if (!partial.trim()) {
      setLogs([{ msg: "No partial list provided.", type: "error" }]);
      return;
    }

    setLogs([]);

    const { accounts: fullAccounts, order: fullOrder } = parseAccounts(fullText);
    const { accounts: partialAccounts } = parseAccounts(partial);

    // Also handle plain username lines (no cookie) in the partial list
    const partialUsernames = new Set<string>();

    // From parsed accounts
    Object.keys(partialAccounts).forEach((u) => partialUsernames.add(u.toLowerCase()));

    // Also try parsing plain lines (username only or user:pass without cookie)
    for (const line of partial.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const username = trimmed.split(":")[0].toLowerCase();
      if (username) partialUsernames.add(username);
    }

    // Find accounts in full list that are NOT in partial list
    const missing = fullOrder.filter(
      (u) => !partialUsernames.has(u.toLowerCase())
    );

    const output = missing.map((u) => fullAccounts[u].full).join("\n");

    const newLogs: LogEntry[] = [];
    if (missing.length === 0) {
      newLogs.push({ msg: "No missing accounts — partial list contains all accounts from the full list.", type: "warn" });
    } else {
      newLogs.push({ msg: `Found ${missing.length} account(s) not in the partial list.`, type: "success" });
    }

    setLogs(newLogs);
    setResult({
      output,
      missingCount: missing.length,
      fullCount: fullOrder.length,
      partialCount: partialAccounts ? Object.keys(partialAccounts).length : 0,
    });
  };

  const clear = () => {
    setLocalFull("");
    setPartial("");
    setLogs([]);
    setResult(null);
  };

  return (
    <div className="space-y-4 animate-fade-up">

      {/* How it works */}
      <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
        <span className="text-accent text-sm mt-0.5">ℹ</span>
        <p className="text-[11px] text-dim font-mono leading-relaxed">
          Paste your <span className="text-[#e8e8f0]">full account list</span> on the left and your{" "}
          <span className="text-[#e8e8f0]">partial list</span> on the right.
          Returns the full <span className="text-accent3">user:pass:cookie</span> lines for accounts
          that exist in the full list but are <span className="text-red-400">missing</span> from the partial list.
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Full list */}
        <Card>
          <CardHeader icon="📋" label="Full account list" />
          <CardBody>
            <div className={`text-[11px] font-mono mb-3 ${fullSourceColor}`}>
              {fullSource}
            </div>
            <FieldLabel
              label="All accounts"
              hint={fullLineCount > 0 ? `${fullLineCount} lines` : undefined}
            />
            <details className="mb-2">
              <summary className="text-[10px] text-dim cursor-pointer hover:text-[#e8e8f0] transition-colors select-none list-none">
                ↳ Override vault with a different file
              </summary>
              <div className="mt-2 space-y-2">
                <UploadZone label="Upload full account list" onLoad={setLocalFull} />
                <Textarea
                  value={localFull}
                  onChange={setLocalFull}
                  placeholder={"Paste full account list...\nusername:password:_|WARNING...|_cookie"}
                  rows={10}
                />
                {localFull && (
                  <button
                    onClick={() => setLocalFull("")}
                    className="text-[10px] text-dim hover:text-red-400 font-mono transition-colors cursor-pointer"
                  >
                    ✕ Remove override — revert to vault
                  </button>
                )}
              </div>
            </details>
          </CardBody>
        </Card>

        {/* Partial list */}
        <Card>
          <CardHeader icon="🔍" label="Partial list" />
          <CardBody>
            <FieldLabel
              label="Subset of accounts"
              hint={partialLineCount > 0 ? `${partialLineCount} lines` : undefined}
            />
            <UploadZone label="Upload partial list" onLoad={setPartial} />
            <Textarea
              value={partial}
              onChange={setPartial}
              placeholder={
                "Paste partial list here...\n\nAccepts any format:\n- user:pass:cookie\n- user:pass\n- username only"
              }
              rows={10}
            />
          </CardBody>
        </Card>
      </div>

      {/* Live diff preview */}
      {fullLineCount > 0 && partialLineCount > 0 && !result && (
        <div className="flex items-center gap-2 text-[11px] font-mono text-dim">
          <span>{fullLineCount} full</span>
          <span className="text-border">—</span>
          <span>{partialLineCount} partial</span>
          <span className="text-border">≈</span>
          <span className="text-[#e8e8f0]">
            ~{Math.max(0, fullLineCount - partialLineCount)} potentially missing
          </span>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Button variant="primary" onClick={run}>🔎 Find Missing</Button>
        <Button variant="secondary" onClick={clear}>✕ Clear</Button>
      </div>

      <LogPanel entries={logs} />

      {result && (
        <>
          <div className="flex gap-3 flex-wrap mt-2">
            <StatChip label="in full list" value={result.fullCount} />
            <StatChip label="in partial list" value={result.partialCount} />
            <StatChip
              label="missing"
              value={result.missingCount}
              color={result.missingCount > 0 ? "#f87171" : "#4ade80"}
            />
          </div>

          {result.missingCount > 0 && (
            <div className="mt-4">
              <DiffOutput value={result.output} />
            </div>
          )}
        </>
      )}
    </div>
  );
}