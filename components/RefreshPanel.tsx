"use client";

import { useState, useMemo, useRef } from "react";
import {
  Card, CardHeader, CardBody,
  Button, Textarea, UploadZone, FieldLabel,
  LogPanel, StatChip,
  type LogEntry,
} from "./ui";
import { useVault } from "../context/VaultContext";

// How many accounts to refresh per batch
const BATCH_SIZE = 3;
// Delay between batches in ms — keep generous to avoid rate limits
const BATCH_DELAY = 2000;

type Status = "idle" | "running" | "done" | "stopped";

interface RefreshResult {
  username: string;
  success: boolean;
  newCookie?: string;
  newFull?: string;
  error?: string;
}

// ── Result row ────────────────────────────────────────────────────────────

function ResultRow({ result }: { result: RefreshResult }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!result.newFull) return;
    navigator.clipboard.writeText(result.newFull);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0 font-mono text-[11px] transition-colors ${
      result.success ? "hover:bg-accent3/5" : "hover:bg-red-400/5"
    }`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${result.success ? "bg-accent3" : "bg-red-400"}`} />

      <span className="text-[#e8e8f0] w-44 truncate shrink-0">{result.username}</span>

      {result.success ? (
        <span className="text-accent3 shrink-0">✓ refreshed</span>
      ) : (
        <span className="text-red-400 shrink-0 truncate">✗ {result.error}</span>
      )}

      {result.success && (
        <button
          onClick={copy}
          className="ml-auto text-[10px] text-dim hover:text-accent transition-colors cursor-pointer shrink-0"
        >
          {copied ? "✓ copied" : "⎘ copy line"}
        </button>
      )}
    </div>
  );
}

// ── Output block ──────────────────────────────────────────────────────────

function OutputBlock({
  icon, label, value, filename, color,
}: {
  icon: string; label: string; value: string; filename: string; color: string;
}) {
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
    a.download = filename;
    a.click();
  };

  if (lines.length === 0) return null;

  return (
    <Card>
      <CardHeader icon={icon} label={`${label} (${lines.length})`} />
      <CardBody>
        <Textarea value={value} readOnly rows={10} />
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 border border-border text-[11px] font-mono text-[#e8e8f0] hover:border-accent hover:text-accent transition-all cursor-pointer"
          >
            {copied ? "✓ Copied!" : "⎘ Copy All"}
          </button>
          <button
            onClick={download}
            style={{ borderColor: `${color}40`, color, background: `${color}10` }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-mono transition-all cursor-pointer hover:opacity-80"
          >
            ⬇ Download {filename}
          </button>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Refresh Panel ─────────────────────────────────────────────────────────

export default function RefreshPanel() {
  const { vault } = useVault();

  // Input — accepts user:pass or user:pass:cookie lines
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<RefreshResult[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const stopRef = useRef(false);

  // Parse input lines into { username, password } pairs
  const parsed = useMemo(() => {
    return input
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(":");
        return { username: parts[0], password: parts[1] ?? "" };
      })
      .filter((a) => a.username && a.password);
  }, [input]);

  const inputLineCount = parsed.length;

  const run = async () => {
    if (parsed.length === 0) {
      setLogs([{ msg: "No valid user:pass lines found in input.", type: "error" }]);
      return;
    }

    stopRef.current = false;
    setStatus("running");
    setResults([]);
    setLogs([]);
    setProgress({ done: 0, total: parsed.length });

    const allResults: RefreshResult[] = [];

    for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
      if (stopRef.current) break;

      const batch = parsed.slice(i, i + BATCH_SIZE);

      try {
        const res = await fetch("/api/refresh-cookies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accounts: batch }),
        });

        const data = await res.json();
        if (data.results) {
          allResults.push(...data.results);
          setResults([...allResults]);
        }
      } catch {
        batch.forEach((a) => {
          allResults.push({ username: a.username, success: false, error: "Request failed" });
        });
        setResults([...allResults]);
      }

      setProgress({ done: Math.min(i + BATCH_SIZE, parsed.length), total: parsed.length });

      if (i + BATCH_SIZE < parsed.length && !stopRef.current) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY));
      }
    }

    const finalStatus = stopRef.current ? "stopped" : "done";
    setStatus(finalStatus);

    const succeeded = allResults.filter((r) => r.success).length;
    const failed = allResults.filter((r) => !r.success).length;
    setLogs([
      { msg: `Refreshed ${succeeded} cookie(s) successfully.`, type: succeeded > 0 ? "success" : "warn" },
      ...(failed > 0 ? [{ msg: `${failed} account(s) failed — check results for details.`, type: "warn" as const }] : []),
    ]);
  };

  const stop = () => { stopRef.current = true; };

  const clear = () => {
    setInput("");
    setResults([]);
    setStatus("idle");
    setProgress({ done: 0, total: 0 });
    setLogs([]);
  };

  // Derived outputs
  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  const refreshedFull = succeeded.map((r) => r.newFull ?? "").join("\n");
  const failedUserpass = failed.map((r) => {
    // Try to find original password from input
    const original = parsed.find((p) => p.username === r.username);
    return original ? `${original.username}:${original.password}` : r.username;
  }).join("\n");

  const progressPct = progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  return (
    <div className="space-y-4 animate-fade-up">

      {/* Info */}
      <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
        <span className="text-accent text-sm mt-0.5">ℹ</span>
        <div className="text-[11px] text-dim font-mono leading-relaxed space-y-1">
          <p>
            Logs into Roblox using <span className="text-[#e8e8f0]">username:password</span> to generate a fresh cookie.
            Paste your <span className="text-[#e8e8f0]">dead_userpass.txt</span> output from the Dead Lookup tab, or any list of <span className="text-[#e8e8f0]">user:pass</span> lines.
          </p>
          <p className="text-dim/60">
            Batches of {BATCH_SIZE} with {BATCH_DELAY}ms delay. Accounts with 2FA or captcha challenges will fail.
          </p>
        </div>
      </div>

      {/* Vault shortcut */}
      {vault.accounts && (
        <div className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3">
          <span className="text-accent3 text-sm">💡</span>
          <p className="text-[11px] text-dim font-mono flex-1">
            Have dead cookies? Run <span className="text-[#e8e8f0]">Dead Lookup</span> first to get the user:pass list, then paste it here.
          </p>
        </div>
      )}

      {/* Input */}
      <Card>
        <CardHeader icon="🔑" label="Accounts to refresh" />
        <CardBody>
          <FieldLabel
            label="user:pass — one per line"
            hint={inputLineCount > 0 ? `${inputLineCount} account${inputLineCount !== 1 ? "s" : ""} ready` : undefined}
          />
          <UploadZone label="Upload user:pass file" onLoad={setInput} />
          <Textarea
            value={input}
            onChange={setInput}
            placeholder={"Paste user:pass combos here — one per line\n\nExamples:\njohndoe123:password1\njanesmith:mypassword\n\nAlso accepts full user:pass:cookie lines (cookie will be ignored)"}
            rows={10}
          />
        </CardBody>
      </Card>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <Button
          variant="primary"
          onClick={run}
          disabled={parsed.length === 0 || status === "running"}
        >
          {status === "running" ? "⏳ Refreshing..." : "🔄 Refresh Cookies"}
        </Button>
        {status === "running" && (
          <Button variant="danger" onClick={stop}>⏹ Stop</Button>
        )}
        {(status === "done" || status === "stopped") && (
          <Button variant="secondary" onClick={clear}>✕ Clear</Button>
        )}
      </div>

      {/* Progress */}
      {status !== "idle" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-dim">
            <span>
              {status === "running" ? "Refreshing..." : status === "stopped" ? "Stopped" : "Done"}
              {" — "}{progress.done}/{progress.total} accounts
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="w-full bg-surface2 border border-border rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: status === "done"
                  ? "#6affd4"
                  : status === "stopped"
                  ? "#fbbf24"
                  : "#7c6aff",
              }}
            />
          </div>
        </div>
      )}

      <LogPanel entries={logs} />

      {/* Stats */}
      {results.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <StatChip label="attempted" value={results.length} />
          <StatChip label="refreshed" value={succeeded.length} color="#6affd4" />
          <StatChip label="failed" value={failed.length} color={failed.length > 0 ? "#f87171" : undefined} />
        </div>
      )}

      {/* Live results */}
      {results.length > 0 && (
        <Card>
          <CardHeader icon="📊" label={`Results — ${results.length} processed`} />
          <div className="max-h-[360px] overflow-y-auto">
            {results.map((r, i) => (
              <ResultRow key={i} result={r} />
            ))}
          </div>
        </Card>
      )}

      {/* Output files */}
      {(status === "done" || status === "stopped") && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <OutputBlock
            icon="✅"
            label="Refreshed accounts"
            value={refreshedFull}
            filename="refreshed.txt"
            color="#6affd4"
          />
          <OutputBlock
            icon="❌"
            label="Failed accounts"
            value={failedUserpass}
            filename="failed_userpass.txt"
            color="#f87171"
          />
        </div>
      )}
    </div>
  );
}