"use client";

import { useState, useMemo } from "react";
import {
  Card, CardHeader, CardBody,
  Button, Textarea, UploadZone, FieldLabel,
  LogPanel, StatChip,
  type LogEntry,
} from "./ui";

const DELIMITER = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_";

function combine(userpassText: string, cookieText: string): {
  output: string;
  count: number;
  mismatched: number;
  warnings: string[];
} {
  const userpassLines = userpassText.split("\n").map(l => l.trim()).filter(Boolean);
  const cookieLines = cookieText.split("\n").map(l => l.trim()).filter(Boolean);
  const warnings: string[] = [];

  if (userpassLines.length !== cookieLines.length) {
    warnings.push(
      `Line count mismatch — ${userpassLines.length} user:pass line(s) vs ${cookieLines.length} cookie(s). Extra lines will be skipped.`
    );
  }

  const count = Math.min(userpassLines.length, cookieLines.length);
  const output: string[] = [];

  for (let i = 0; i < count; i++) {
    const userpass = userpassLines[i];
    const cookie = cookieLines[i];

    // Validate userpass has at least one colon
    if (!userpass.includes(":")) {
      warnings.push(`Line ${i + 1}: "${userpass}" doesn't look like a valid user:pass — skipped.`);
      continue;
    }

    // Strip delimiter prefix from cookie if already present (idempotent)
    const cleanCookie = cookie.startsWith("_|WARNING") ? cookie : `${DELIMITER}${cookie}`;

    output.push(`${userpass}:${cleanCookie}`);
  }

  const mismatched = Math.abs(userpassLines.length - cookieLines.length);
  return { output: output.join("\n"), count: output.length, mismatched, warnings };
}

// ── Output block with copy + download ────────────────────────────────────

function CombineOutput({ value }: { value: string }) {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const lines = value.split("\n").filter(Boolean);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1200);
  };

  const download = () => {
    const blob = new Blob([value], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "combined_accounts.txt";
    a.click();
  };

  return (
    <Card>
      <CardHeader icon="✅" label="combined_accounts.txt" />
      <CardBody>
        <Textarea value={value} readOnly rows={14} />
        <div className="flex items-center justify-between mt-2 mb-3">
          <span className="text-[10px] text-dim font-mono">
            {lines.length} account{lines.length !== 1 ? "s" : ""} combined
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 border border-border text-[11px] font-mono text-[#e8e8f0] hover:border-accent hover:text-accent transition-all cursor-pointer"
          >
            {copyFeedback ? "✓ Copied!" : "⎘ Copy All"}
          </button>
          <button
            onClick={download}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(74,222,128,0.12)] border border-[rgba(74,222,128,0.3)] text-[11px] font-mono text-[#4ade80] hover:bg-[rgba(74,222,128,0.2)] transition-all cursor-pointer"
          >
            ⬇ Download combined_accounts.txt
          </button>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Combine Panel ─────────────────────────────────────────────────────────

export default function CombinePanel() {
  const [userpass, setUserpass] = useState("");
  const [cookies, setCookies] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<{
    output: string;
    count: number;
    mismatched: number;
  } | null>(null);

  // Live line counts
  const userpassCount = useMemo(
    () => userpass.split("\n").filter(l => l.trim()).length,
    [userpass]
  );
  const cookieCount = useMemo(
    () => cookies.split("\n").filter(l => l.trim()).length,
    [cookies]
  );
  const countMismatch = userpassCount > 0 && cookieCount > 0 && userpassCount !== cookieCount;

  const run = () => {
    if (!userpass.trim()) {
      setLogs([{ msg: "No user:pass lines provided.", type: "error" }]);
      return;
    }
    if (!cookies.trim()) {
      setLogs([{ msg: "No cookie lines provided.", type: "error" }]);
      return;
    }

    setLogs([]);
    const res = combine(userpass, cookies);
    const newLogs: LogEntry[] = [];

    res.warnings.forEach(w => newLogs.push({ msg: w, type: "warn" }));
    newLogs.push({ msg: `Combined ${res.count} account(s) successfully.`, type: "success" });

    setLogs(newLogs);
    setResult({ output: res.output, count: res.count, mismatched: res.mismatched });
  };

  const clear = () => {
    setUserpass("");
    setCookies("");
    setLogs([]);
    setResult(null);
  };

  return (
    <div className="space-y-4 animate-fade-up">

      {/* How it works hint */}
      <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
        <span className="text-accent text-sm mt-0.5">ℹ</span>
        <p className="text-[11px] text-dim font-mono leading-relaxed">
          Paste your <span className="text-[#e8e8f0]">user:pass</span> combos and <span className="text-accent3">cookies</span> — one per line, in the same order.
          Each line will be joined into <span className="text-[#e8e8f0]">username:password:_|WARNING...|_cookie</span> format.
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader icon="👤" label="User:Pass combos" />
          <CardBody>
            <FieldLabel
              label="One per line"
              hint={userpassCount > 0 ? `${userpassCount} line${userpassCount !== 1 ? "s" : ""}` : undefined}
            />
            <UploadZone label="Upload userpasscombo.txt" onLoad={setUserpass} />
            <Textarea
              value={userpass}
              onChange={setUserpass}
              placeholder={"johndoe123:password1\njanesmith:password2\n..."}
              rows={12}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon="🍪" label="Cookies" />
          <CardBody>
            <FieldLabel
              label="One per line"
              hint={cookieCount > 0 ? `${cookieCount} line${cookieCount !== 1 ? "s" : ""}` : undefined}
            />
            <UploadZone label="Upload cookiecombo.txt" onLoad={setCookies} />
            <Textarea
              value={cookies}
              onChange={setCookies}
              placeholder={"_|WARNING...|_CAEaAh...\n_|WARNING...|_CAEaAh...\n..."}
              rows={12}
            />
          </CardBody>
        </Card>
      </div>

      {/* Line count mismatch warning */}
      {countMismatch && (
        <div className="flex items-center gap-2 bg-yellow-400/5 border border-yellow-400/20 rounded-xl px-4 py-2.5">
          <span className="text-yellow-400 text-sm">⚠</span>
          <p className="text-[11px] text-yellow-400 font-mono">
            Line count mismatch — {userpassCount} user:pass vs {cookieCount} cookies.
            Only the first {Math.min(userpassCount, cookieCount)} will be combined.
          </p>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Button variant="primary" onClick={run}>🔗 Combine</Button>
        <Button variant="secondary" onClick={clear}>✕ Clear</Button>
      </div>

      <LogPanel entries={logs} />

      {result && (
        <>
          <div className="flex gap-3 flex-wrap mt-2">
            <StatChip label="combined" value={result.count} color="#6affd4" />
            {result.mismatched > 0 && (
              <StatChip label="skipped (mismatch)" value={result.mismatched} color="#fbbf24" />
            )}
          </div>
          <div className="mt-4">
            <CombineOutput value={result.output} />
          </div>
        </>
      )}
    </div>
  );
}