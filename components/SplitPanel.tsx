"use client";

import { useState } from "react";
import {
  Card, CardHeader, CardBody,
  Button, Textarea, UploadZone, FieldLabel,
  LogPanel, StatChip, Toggle,
  type LogEntry,
} from "./ui";
import { splitAccounts } from "../lib/parser";

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

  const copyAll = () => {
    navigator.clipboard.writeText(value);
    triggerFeedback("all");
  };

  const copyRange = () => {
    navigator.clipboard.writeText(selectedLines.join("\n"));
    triggerFeedback("range");
  };

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
        {/* Output textarea */}
        <Textarea value={value} readOnly rows={12} />

        {/* Total + active selection info */}
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

        {/* Range selector */}
        <div className="bg-surface2 border border-border rounded-xl p-3 mb-3">
          <p className="text-[10px] text-dim tracking-widest uppercase mb-3">
            Select line range
          </p>
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

          {/* Preview of selected lines */}
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

        {/* Action buttons */}
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
  const [accounts, setAccounts] = useState("");
  const [orderText, setOrderText] = useState("");
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
      setLogs([{ msg: "No accounts provided.", type: "error" }]);
      return;
    }
    setLogs([]);

    const res = splitAccounts(accounts, useOrder ? orderText : undefined);
    res.warnings.forEach((w) => addLog(w, "warn"));
    addLog(`Split complete — ${res.count} account(s) processed.`, "success");

    setResult({ userpass: res.userpassLines, cookies: res.cookieLines, count: res.count });
  };

  const clear = () => {
    setAccounts("");
    setOrderText("");
    setLogs([]);
    setResult(null);
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <Card>
        <CardHeader icon="📋" label="Input — account.txt format" />
        <CardBody>
          <Toggle enabled={useOrder} onChange={setUseOrder} label="Preserve original order" />

          <FieldLabel label="Accounts" hint="username:password:_|WARNING...|_cookie" />
          <UploadZone label="Upload account.txt" onLoad={setAccounts} />
          <Textarea
            value={accounts}
            onChange={setAccounts}
            placeholder={"Paste accounts here...\nusername:password:_|WARNING...|_CAEaAh..."}
            rows={10}
          />

          {useOrder && (
            <div className="mt-4 border-t border-border pt-4">
              <FieldLabel label="Original order reference" hint="optional — for sort order" />
              <UploadZone label="Upload original_order.txt" onLoad={setOrderText} />
              <Textarea
                value={orderText}
                onChange={setOrderText}
                placeholder="Paste original account list here..."
                rows={5}
              />
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