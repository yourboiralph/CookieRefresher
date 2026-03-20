"use client";

import { useState, useMemo } from "react";
import {
  Card, CardHeader, CardBody,
  Button, Textarea, UploadZone, FieldLabel,
  LogPanel, StatChip, Toggle,
  type LogEntry,
} from "./ui";
import { useVault } from "../context/VaultContext";
import { splitAccounts, parseAccounts } from "../lib/parser";

// ── Account Search ────────────────────────────────────────────────────────

function AccountSearch({ accountsText }: { accountsText: string }) {
  const [query, setQuery] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<Record<string, boolean>>({});

  // Parse accounts into a searchable map
  const { accounts } = useMemo(() => parseAccounts(accountsText), [accountsText]);

  // Filter by username (case-insensitive, partial match)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return Object.values(accounts).filter((a) =>
      a.username.toLowerCase().includes(q)
    );
  }, [query, accounts]);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback((p) => ({ ...p, [key]: true }));
    setTimeout(() => setCopyFeedback((p) => ({ ...p, [key]: false })), 1200);
  };

  const noResults = query.trim().length > 0 && results.length === 0;

  return (
    <Card>
      <CardHeader icon="🔎" label="Account Search" />
      <CardBody>
        {/* Search input */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dim text-sm select-none">
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username — e.g. johndoe123"
            className="w-full bg-surface2 border border-border rounded-xl pl-9 pr-4 py-2.5 text-[12px] font-mono text-[#e8e8f0] placeholder-dim/50 focus:border-accent focus:outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-[#e8e8f0] text-xs transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Empty state */}
        {!query.trim() && (
          <p className="text-[11px] text-dim/50 font-mono text-center py-4">
            Type a username to search loaded accounts
          </p>
        )}

        {/* No results */}
        {noResults && (
          <p className="text-[11px] text-red-400 font-mono text-center py-4">
            No account found matching &quot;{query}&quot;
          </p>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            {/* Result count */}
            <p className="text-[10px] text-dim font-mono">
              {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
            </p>

            {results.map((account) => (
              <div
                key={account.username}
                className="bg-surface2 border border-border rounded-xl overflow-hidden"
              >
                {/* Username header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                  <span className="font-mono text-[13px] font-semibold text-[#e8e8f0]">
                    {account.username}
                  </span>
                  <button
                    onClick={() => copy(account.full, `full_${account.username}`)}
                    className="text-[10px] text-dim hover:text-accent font-mono transition-colors cursor-pointer"
                  >
                    {copyFeedback[`full_${account.username}`] ? "✓ Copied full line!" : "⎘ Copy full line"}
                  </button>
                </div>

                {/* user:pass row */}
                <div className="px-4 py-2.5 border-b border-border/50 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-dim tracking-widest uppercase mb-1">User:Pass</p>
                    <p className="text-[11px] font-mono text-[#e8e8f0] break-all">
                      {account.userpass}
                    </p>
                  </div>
                  <button
                    onClick={() => copy(account.userpass, `up_${account.username}`)}
                    className="shrink-0 text-[10px] text-dim hover:text-accent font-mono transition-colors cursor-pointer pt-4"
                  >
                    {copyFeedback[`up_${account.username}`] ? "✓" : "⎘"}
                  </button>
                </div>

                {/* Cookie row */}
                <div className="px-4 py-2.5 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-dim tracking-widest uppercase mb-1">Cookie</p>
                    <p className="text-[11px] font-mono text-accent3 break-all line-clamp-2">
                      {account.cookie}
                    </p>
                  </div>
                  <button
                    onClick={() => copy(account.cookie, `ck_${account.username}`)}
                    className="shrink-0 text-[10px] text-dim hover:text-accent font-mono transition-colors cursor-pointer pt-4"
                  >
                    {copyFeedback[`ck_${account.username}`] ? "✓" : "⎘"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ── Range Output Block ────────────────────────────────────────────────────

function RangeOutputBlock({
  icon,
  label,
  value,
  filename,
}: {
  icon: string;
  label: string;
  value: string;
  filename: string;
}) {
  const lines = value ? value.split("\n") : [];
  const total = lines.length;

  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<"all" | "range" | null>(null);

  const clampedFrom = Math.max(1, Math.min(parseInt(from) || 1, total));
  const clampedTo = Math.min(total, Math.max(clampedFrom, parseInt(to) || total));

  const selectedLines = lines.slice(clampedFrom - 1, clampedTo);
  const selectedCount = selectedLines.length;
  const isFullRange = clampedFrom === 1 && clampedTo === total;

  const triggerFeedback = (type: "all" | "range") => {
    setCopyFeedback(type);
    setTimeout(() => setCopyFeedback(null), 1200);
  };

  const copyAll = () => { navigator.clipboard.writeText(value); triggerFeedback("all"); };
  const copyRange = () => { navigator.clipboard.writeText(selectedLines.join("\n")); triggerFeedback("range"); };

  const download = () => {
    const blob = new Blob([value], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  const downloadRange = () => {
    const blob = new Blob([selectedLines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lines_${clampedFrom}-${clampedTo}_${filename}`;
    a.click();
  };

  return (
    <Card>
      <CardHeader icon={icon} label={label} />
      <CardBody>
        <Textarea value={value} readOnly rows={12} />

        <div className="flex items-center justify-between mt-2 mb-3">
          <span className="text-[10px] text-dim font-mono">
            {total} line{total !== 1 ? "s" : ""} total
          </span>
          {!isFullRange && (
            <span className="text-[10px] text-accent font-mono">
              Lines {clampedFrom}–{clampedTo} selected ({selectedCount})
            </span>
          )}
        </div>

        <div className="bg-surface2 border border-border rounded-xl p-3 mb-3">
          <p className="text-[10px] text-dim tracking-widest uppercase mb-3">Select line range</p>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] text-dim">From</label>
              <input
                type="number"
                min={1}
                max={total}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-[12px] font-mono text-[#e8e8f0] focus:border-accent focus:outline-none transition-colors"
                placeholder="1"
              />
            </div>
            <span className="text-dim text-lg mt-4">→</span>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] text-dim">To</label>
              <input
                type="number"
                min={1}
                max={total}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-[12px] font-mono text-[#e8e8f0] focus:border-accent focus:outline-none transition-colors"
                placeholder={String(total)}
              />
            </div>
            <button
              onClick={() => { setFrom("1"); setTo(""); }}
              className="mt-4 text-[10px] text-dim hover:text-[#e8e8f0] font-mono transition-colors whitespace-nowrap cursor-pointer"
            >
              ✕ Reset
            </button>
          </div>

          {!isFullRange && selectedCount > 0 && (
            <div className="mt-3 bg-surface rounded-lg p-2 border border-border max-h-[80px] overflow-y-auto">
              {selectedLines.slice(0, 3).map((line, i) => (
                <p key={i} className="text-[10px] text-dim font-mono truncate">
                  <span className="text-dim/40 mr-2 select-none">{clampedFrom + i}</span>
                  {line}
                </p>
              ))}
              {selectedCount > 3 && (
                <p className="text-[10px] text-dim/50 font-mono mt-1">
                  ... and {selectedCount - 3} more line{selectedCount - 3 !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 border border-border text-[11px] font-mono text-[#e8e8f0] hover:border-accent hover:text-accent transition-all cursor-pointer"
          >
            {copyFeedback === "all" ? "✓ Copied!" : "⎘ Copy All"}
          </button>
          {!isFullRange && (
            <button
              onClick={copyRange}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-[11px] font-mono text-accent hover:bg-accent/20 transition-all cursor-pointer"
            >
              {copyFeedback === "range"
                ? "✓ Copied!"
                : `⎘ Copy Lines ${clampedFrom}–${clampedTo} (${selectedCount})`}
            </button>
          )}
          <button
            onClick={download}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(74,222,128,0.12)] border border-[rgba(74,222,128,0.3)] text-[11px] font-mono text-[#4ade80] hover:bg-[rgba(74,222,128,0.2)] transition-all cursor-pointer"
          >
            ⬇ Download All
          </button>
          {!isFullRange && (
            <button
              onClick={downloadRange}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(124,106,255,0.12)] border border-[rgba(124,106,255,0.3)] text-[11px] font-mono text-accent hover:bg-[rgba(124,106,255,0.2)] transition-all cursor-pointer"
            >
              ⬇ Download Lines {clampedFrom}–{clampedTo}
            </button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// ── Split Panel ───────────────────────────────────────────────────────────

export default function SplitPanel() {
  const { vault } = useVault();

  const [localAccounts, setLocalAccounts] = useState("");
  const [localOrder, setLocalOrder] = useState("");

  const accounts = localAccounts || vault.accounts || "";
  const orderText = localOrder || vault.order || "";

  const [useOrder, setUseOrder] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<{
    userpass: string;
    cookies: string;
    count: number;
  } | null>(null);

  const addLog = (msg: string, type: LogEntry["type"] = "info") =>
    setLogs((p) => [...p, { msg, type }]);

  const run = () => {
    if (!accounts.trim()) {
      setLogs([{
        msg: "No accounts found. Upload account.txt in the Vault above, or use the override below.",
        type: "error",
      }]);
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

  const accountSource = localAccounts
    ? "⚠ Using local override"
    : vault.accounts
    ? "✓ Using vault — account.txt"
    : "✗ No accounts loaded — upload in the Vault above";

  const accountSourceColor = localAccounts
    ? "text-yellow-400"
    : vault.accounts
    ? "text-accent3"
    : "text-red-400";

  const orderSource = localOrder
    ? "⚠ Using local order override"
    : vault.order
    ? "✓ Using vault — original_order.txt"
    : "No order file — will use input order as-is";

  const orderSourceColor = localOrder
    ? "text-yellow-400"
    : vault.order
    ? "text-accent3"
    : "text-dim";

  return (
    <div className="space-y-4 animate-fade-up">

      {/* Search — always visible if accounts are loaded */}
      {accounts.trim() && (
        <AccountSearch accountsText={accounts} />
      )}

      <Card>
        <CardHeader icon="📋" label="Input — account.txt format" />
        <CardBody>
          <Toggle enabled={useOrder} onChange={setUseOrder} label="Preserve original order" />

          <div className={`text-[11px] font-mono mb-3 ${accountSourceColor}`}>
            {accountSource}
          </div>

          <FieldLabel label="Accounts" hint="username:password:_|WARNING...|_cookie" />
          <details className="mb-2">
            <summary className="text-[10px] text-dim cursor-pointer hover:text-[#e8e8f0] transition-colors select-none list-none mb-2">
              ↳ Override vault with a different file for this run
            </summary>
            <div className="mt-2 space-y-2">
              <UploadZone label="Upload account.txt override" onLoad={setLocalAccounts} />
              <Textarea
                value={localAccounts}
                onChange={setLocalAccounts}
                placeholder={"Paste accounts to override vault...\nusername:password:_|WARNING...|_CAEaAh..."}
                rows={6}
              />
              {localAccounts && (
                <button
                  onClick={() => setLocalAccounts("")}
                  className="text-[10px] text-dim hover:text-red-400 font-mono transition-colors cursor-pointer"
                >
                  ✕ Remove override — revert to vault
                </button>
              )}
            </div>
          </details>

          {useOrder && (
            <div className="mt-4 border-t border-border pt-4">
              <div className={`text-[11px] font-mono mb-3 ${orderSourceColor}`}>
                {orderSource}
              </div>
              <FieldLabel label="Original order reference" hint="optional — for sort order" />
              <details className="mb-2">
                <summary className="text-[10px] text-dim cursor-pointer hover:text-[#e8e8f0] transition-colors select-none list-none">
                  ↳ Override vault order file for this run
                </summary>
                <div className="mt-2 space-y-2">
                  <UploadZone label="Upload original_order.txt override" onLoad={setLocalOrder} />
                  <Textarea
                    value={localOrder}
                    onChange={setLocalOrder}
                    placeholder="Paste order list to override vault..."
                    rows={4}
                  />
                  {localOrder && (
                    <button
                      onClick={() => setLocalOrder("")}
                      className="text-[10px] text-dim hover:text-red-400 font-mono transition-colors cursor-pointer"
                    >
                      ✕ Remove override — revert to vault
                    </button>
                  )}
                </div>
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
            <RangeOutputBlock
              icon="👤"
              label="userpasscombo.txt"
              value={result.userpass}
              filename="userpasscombo.txt"
            />
            <RangeOutputBlock
              icon="🍪"
              label="cookiecombo.txt"
              value={result.cookies}
              filename="cookiecombo.txt"
            />
          </div>
        </>
      )}
    </div>
  );
}