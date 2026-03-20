"use client";

import { useState } from "react";
import clsx from "clsx";
import { useVault } from "../context/VaultContext";
import { UploadZone } from "./ui";
import type { VaultKey } from "../lib/vault";

const FILES: { key: VaultKey; label: string; hint?: string; placeholder: string }[] = [
  {
    key: "accounts",
    label: "account.txt",
    placeholder: "Paste your full account list here...\nusername:password:_|WARNING...|_cookie\n\nUsed across all tabs automatically.",
  },
  {
    key: "order",
    label: "original_order.txt",
    hint: "optional — for sort order",
    placeholder: "Paste original order reference here...\nUsed by Split Accounts to preserve ordering.",
  },
  {
    key: "dead",
    label: "dead.txt",
    hint: "optional — for Dead Lookup",
    placeholder: "Paste dead cookies here...\nSupports both cookie-only and full user:pass:cookie format.",
  },
  {
    key: "refreshed",
    label: "refreshed.txt",
    hint: "optional — for Replace Cookies",
    placeholder: "Paste refreshed accounts here...\nusername:password:_|WARNING...|_cookie",
  },
];

export default function VaultBar() {
  const { vault, hydrated, setVaultField, clearAll, lineCount } = useVault();
  const [expanded, setExpanded] = useState(false);

  // Don't render until localStorage is loaded to avoid flicker
  if (!hydrated) return null;

  const loadedCount = FILES.filter(({ key }) => vault[key].trim()).length;

  return (
    <div className="mb-8 bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-surface2 transition-colors select-none"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] text-dim tracking-widest uppercase font-mono">
            🗄 Vault — Universal Files
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {FILES.map(({ key, label }) => (
              <VaultChip
                key={key}
                label={label}
                count={lineCount(key)}
                active={vault[key].trim().length > 0}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-3">
          <span className="text-[10px] text-dim font-mono">
            {loadedCount}/{FILES.length} loaded
          </span>
          {loadedCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              className="text-[10px] text-dim hover:text-red-400 font-mono transition-colors cursor-pointer"
            >
              ✕ Clear all
            </button>
          )}
          <span className="text-dim text-[11px]">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expandable body */}
      {expanded && (
        <div className="border-t border-border p-5 grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-up">
          {FILES.map(({ key, label, hint, placeholder }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "w-1.5 h-1.5 rounded-full",
                      vault[key].trim() ? "bg-accent3" : "bg-dim/40"
                    )}
                  />
                  <span className="text-[10px] text-dim tracking-widest uppercase font-mono">
                    {label}
                  </span>
                  {hint && (
                    <span className="text-[10px] text-dim/50 font-mono">{hint}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {vault[key].trim() && (
                    <>
                      <span className="text-[10px] text-accent3 font-mono">
                        {lineCount(key)} lines
                      </span>
                      <button
                        onClick={() => setVaultField(key, "")}
                        className="text-[10px] text-dim hover:text-red-400 font-mono transition-colors cursor-pointer"
                      >
                        edit ✕
                      </button>
                    </>
                  )}
                </div>
              </div>

              <UploadZone
                label={`Upload ${label}`}
                onLoad={(text) => setVaultField(key, text)}
              />

              <textarea
                value={vault[key]}
                onChange={(e) => setVaultField(key, e.target.value)}
                placeholder={placeholder}
                rows={6}
                className="w-full bg-surface2 border border-border rounded-xl p-3 text-[#e8e8f0] placeholder-dim/40 focus:border-accent focus:outline-none transition-colors text-[11px] leading-relaxed font-mono resize-y"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VaultChip({
  label,
  count,
  active,
}: {
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] border transition-colors font-mono",
        active
          ? "bg-[rgba(106,255,212,0.08)] border-[rgba(106,255,212,0.25)] text-accent3"
          : "bg-surface2 border-border text-dim"
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", active ? "bg-accent3" : "bg-dim/40")} />
      {label}
      {active && <span className="opacity-60">({count})</span>}
    </div>
  );
}