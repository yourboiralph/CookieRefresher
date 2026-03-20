"use client";

import { useState, useRef } from "react";
import {
  Card, CardHeader, CardBody,
  Button, UploadZone, FieldLabel,
  StatChip,
} from "./ui";
import { useVault } from "../context/VaultContext";
import { parseAccounts } from "../lib/parser";

type Status = "idle" | "running" | "done" | "stopped";

interface CookieResult {
  cookie: string;
  username: string;
  alive: boolean;
  robloxUsername?: string;
  userId?: number;
  error?: string;
}

const BATCH_SIZE = 5;
const BATCH_DELAY = 1200; // ms between batches

// ── Result row ────────────────────────────────────────────────────────────
function ResultRow({ result }: { result: CookieResult }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(result.cookie);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0 font-mono text-[11px] ${
      result.alive ? "hover:bg-accent3/5" : "hover:bg-red-400/5"
    } transition-colors`}>
      {/* Status dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${
        result.alive ? "bg-accent3" : "bg-red-400"
      }`} />

      {/* Username */}
      <span className="text-[#e8e8f0] w-40 truncate shrink-0">
        {result.username}
      </span>

      {/* Status label */}
      {result.alive ? (
        <span className="text-accent3 shrink-0">
          ✓ alive
          {result.robloxUsername && result.robloxUsername !== result.username && (
            <span className="text-dim ml-2">→ {result.robloxUsername}</span>
          )}
        </span>
      ) : (
        <span className="text-red-400 shrink-0">✗ dead {result.error && `(${result.error})`}</span>
      )}

      {/* Copy cookie */}
      <button
        onClick={copy}
        className="ml-auto text-[10px] text-dim hover:text-accent transition-colors cursor-pointer shrink-0"
      >
        {copied ? "✓" : "⎘"}
      </button>
    </div>
  );
}

// ── Output block ──────────────────────────────────────────────────────────
function OutputBlock({ label, icon, value, filename, color }: {
  label: string;
  icon: string;
  value: string;
  filename: string;
  color: string;
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

  return (
    <Card>
      <CardHeader icon={icon} label={`${label} (${lines.length})`} />
      <CardBody>
        <textarea
          value={value}
          readOnly
          rows={8}
          className="w-full bg-surface2 border border-border rounded-xl p-3 text-[11px] font-mono text-[#e8e8f0] opacity-80 resize-y focus:outline-none"
        />
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 border border-border text-[11px] font-mono text-[#e8e8f0] hover:border-accent hover:text-accent transition-all cursor-pointer"
          >
            {copied ? "✓ Copied!" : "⎘ Copy All"}
          </button>
          <button
            onClick={download}
            style={{ borderColor: `${color}40`, color, background: `${color}10`  }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer hover:opacity-80"
   
          >
            ⬇ Download {filename}
          </button>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Checker Panel ─────────────────────────────────────────────────────────
export default function CookieCheckerPanel() {
  const { vault } = useVault();

  const [localAccounts, setLocalAccounts] = useState("");
  const accounts = localAccounts || vault.accounts || "";

  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<CookieResult[]>([]);
  const [progress, setProgress] = useState({ checked: 0, total: 0 });
  const stopRef = useRef(false);

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

  const run = async () => {
    if (!accounts.trim()) return;

    const { accounts: parsed, order } = parseAccounts(accounts);
    const entries = order.map((u) => ({
      username: u,
      // Extract raw cookie token (strip the _|WARNING...|_ wrapper for the API call)
      cookie: extractRawCookie(parsed[u].cookie),
      fullCookie: parsed[u].cookie,
      userpass: parsed[u].userpass,
      full: parsed[u].full,
    }));

    if (entries.length === 0) return;

    stopRef.current = false;
    setStatus("running");
    setResults([]);
    setProgress({ checked: 0, total: entries.length });

    const allResults: CookieResult[] = [];

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      if (stopRef.current) break;

      const batch = entries.slice(i, i + BATCH_SIZE);

      try {
        const res = await fetch("/api/check-cookies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accounts: batch.map((e) => ({
              username: e.username,
              cookie: e.cookie,
            })),
          }),
        });

        const data = await res.json();

        if (data.results) {
          // Re-attach full cookie to results
          const enriched = data.results.map((r: CookieResult, idx: number) => ({
            ...r,
            cookie: batch[idx].fullCookie,
            userpass: batch[idx].userpass,
            full: batch[idx].full,
          }));
          allResults.push(...enriched);
          setResults([...allResults]);
        }
      } catch {
        // Mark whole batch as errored
        batch.forEach((e) => {
          allResults.push({
            cookie: e.fullCookie,
            username: e.username,
            alive: false,
            error: "Request failed",
          });
        });
        setResults([...allResults]);
      }

      setProgress({ checked: Math.min(i + BATCH_SIZE, entries.length), total: entries.length });

      // Delay between batches
      if (i + BATCH_SIZE < entries.length && !stopRef.current) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY));
      }
    }

    setStatus(stopRef.current ? "stopped" : "done");
  };

  const stop = () => {
    stopRef.current = true;
  };

  const clear = () => {
    setResults([]);
    setStatus("idle");
    setProgress({ checked: 0, total: 0 });
    setLocalAccounts("");
  };

  // Derived outputs
  const alive = results.filter((r) => r.alive);
  const dead = results.filter((r) => !r.alive);

  const deadCookies = dead.map((r) => r.cookie).join("\n");
  const deadUserpass = dead.map((r) => (r as any).userpass ?? r.username).join("\n");
  const aliveFull = alive.map((r) => (r as any).full ?? r.cookie).join("\n");

  const progressPct = progress.total > 0
    ? Math.round((progress.checked / progress.total) * 100)
    : 0;

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Info banner */}
      <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
        <span className="text-accent text-sm mt-0.5">ℹ</span>
        <p className="text-[11px] text-dim font-mono leading-relaxed">
          Checks each cookie against the Roblox API via a server-side proxy.
          Cookies returning <span className="text-[#e8e8f0]">401/403</span> are marked dead.
          Batches of <span className="text-[#e8e8f0]">{BATCH_SIZE}</span> with a{" "}
          <span className="text-[#e8e8f0]">{BATCH_DELAY}ms</span> delay to avoid rate limits.
        </p>
      </div>

      {/* Input */}
      <Card>
        <CardHeader icon="📋" label="Accounts to check" />
        <CardBody>
          <div className={`text-[11px] font-mono mb-3 ${accountSourceColor}`}>
            {accountSource}
          </div>

          <FieldLabel label="Override" hint="optional — overrides vault for this run" />
          <details className="mb-2">
            <summary className="text-[10px] text-dim cursor-pointer hover:text-[#e8e8f0] transition-colors select-none list-none">
              ↳ Upload or paste a different account.txt for this run
            </summary>
            <div className="mt-2 space-y-2">
              <UploadZone label="Upload account.txt override" onLoad={setLocalAccounts} />
              <textarea
                value={localAccounts}
                onChange={(e) => setLocalAccounts(e.target.value)}
                placeholder="Paste accounts to override vault..."
                rows={5}
                className="w-full bg-surface2 border border-border rounded-xl p-3 text-[11px] font-mono text-[#e8e8f0] placeholder-dim/50 focus:border-accent focus:outline-none transition-colors resize-y"
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
        </CardBody>
      </Card>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <Button
          variant="primary"
          onClick={run}
          disabled={!accounts.trim() || status === "running"}
        >
          {status === "running" ? "⏳ Checking..." : "🔎 Check Cookies"}
        </Button>
        {status === "running" && (
          <Button variant="danger" onClick={stop}>⏹ Stop</Button>
        )}
        {(status === "done" || status === "stopped") && (
          <Button variant="secondary" onClick={clear}>✕ Clear</Button>
        )}
      </div>

      {/* Progress bar */}
      {(status === "running" || status === "done" || status === "stopped") && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-dim">
            <span>
              {status === "running" ? "Checking..." : status === "stopped" ? "Stopped" : "Done"}
              {" "}{progress.checked}/{progress.total} accounts
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

      {/* Stats */}
      {results.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <StatChip label="checked" value={results.length} />
          <StatChip label="alive" value={alive.length} color="#6affd4" />
          <StatChip label="dead" value={dead.length} color="#f87171" />
        </div>
      )}

      {/* Live results list */}
      {results.length > 0 && (
        <Card>
          <CardHeader icon="📊" label={`Results — ${results.length} checked`} />
          <div className="max-h-[400px] overflow-y-auto">
            {results.map((r, i) => (
              <ResultRow key={i} result={r} />
            ))}
          </div>
        </Card>
      )}

      {/* Output files */}
      {(status === "done" || status === "stopped") && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {dead.length > 0 && (
            <>
              <OutputBlock
                icon="💀"
                label="Dead cookies"
                value={deadCookies}
                filename="dead.txt"
                color="#f87171"
              />
              <OutputBlock
                icon="🔑"
                label="Dead user:pass"
                value={deadUserpass}
                filename="dead_userpass.txt"
                color="#fbbf24"
              />
            </>
          )}
          {alive.length > 0 && (
            <OutputBlock
              icon="✅"
              label="Alive accounts"
              value={aliveFull}
              filename="alive.txt"
              color="#6affd4"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function extractRawCookie(cookie: string): string {
  // Cookie is stored as _|WARNING:...|_<token>
  // Roblox needs just the token part after the last |_
  const match = cookie.match(/\|_(.+)$/);
  return match ? match[1] : cookie;
}