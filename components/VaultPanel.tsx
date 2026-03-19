"use client";

import { useState } from "react";
import { useVault } from "../context/VaultContext";
import { type VaultKey } from "../lib/vault";
import { UploadZone } from "./ui";
import clsx from "clsx";

const FILES: {
  key: VaultKey;
  label: string;
  icon: string;
  hint: string;
  color: string;
}[] = [
  {
    key: "accounts",
    label: "account.txt",
    icon: "📋",
    hint: "Main account list",
    color: "#7c6aff",
  },
  {
    key: "dead",
    label: "dead.txt",
    icon: "💀",
    hint: "Dead cookies",
    color: "#ff6a9b",
  },
  {
    key: "refreshed",
    label: "refreshed.txt",
    icon: "🔄",
    hint: "Refreshed cookies",
    color: "#6affd4",
  },
  {
    key: "order",
    label: "original_order.txt",
    icon: "🔢",
    hint: "Original sort order",
    color: "#fbbf24",
  },
];

export default function VaultPanel() {
  const { vault, setVaultField, clearAll, hasFile, lineCount } = useVault();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<VaultKey | null>(null);

  const loadedCount = FILES.filter((f) => hasFile(f.key)).length;

  return (
    <div className="mb-6 bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-surface2 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm">🗄️</span>
          <span className="text-[11px] tracking-widest uppercase text-dim font-mono">
            Vault — Universal Files
          </span>
          <div className="flex items-center gap-1.5">
            {FILES.map((f) => (
              <span
                key={f.key}
                className="w-2 h-2 rounded-full transition-opacity duration-200"
                style={{
                  background: f.color,
                  opacity: hasFile(f.key) ? 1 : 0.15,
                  boxShadow: hasFile(f.key) ? `0 0 6px ${f.color}` : "none",
                }}
                title={f.label}
              />
            ))}
          </div>
          <span className="text-[10px] text-dim/60 font-mono">
            {loadedCount}/{FILES.length} loaded
          </span>
        </div>
        <div className="flex items-center gap-3">
          {loadedCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Clear all vault files?")) clearAll();
              }}
              className="text-[10px] text-dim hover:text-red-400 transition-colors font-mono px-2 py-1 rounded"
            >
              ✕ Clear all
            </button>
          )}
          <span className="text-dim text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FILES.map((f) => (
            <div
              key={f.key}
              className="bg-surface2 border border-border rounded-xl p-3"
              style={
                hasFile(f.key)
                  ? { borderColor: f.color + "40" }
                  : {}
              }
            >
              {/* File header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{f.icon}</span>
                  <span className="text-[11px] font-mono text-[#e8e8f0]">
                    {f.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasFile(f.key) && (
                    <>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                        style={{ color: f.color, borderColor: f.color + "40" }}
                      >
                        {lineCount(f.key)} lines
                      </span>
                      <button
                        onClick={() =>
                          setEditing(editing === f.key ? null : f.key)
                        }
                        className="text-[10px] text-dim hover:text-[#e8e8f0] transition-colors font-mono"
                      >
                        {editing === f.key ? "close" : "edit"}
                      </button>
                      <button
                        onClick={() => {
                          setVaultField(f.key, "");
                          if (editing === f.key) setEditing(null);
                        }}
                        className="text-[10px] text-dim hover:text-red-400 transition-colors font-mono"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Status / upload */}
              {!hasFile(f.key) ? (
                <UploadZone
                  label={`Upload ${f.label}`}
                  onLoad={(text) => setVaultField(f.key, text)}
                />
              ) : editing === f.key ? (
                <textarea
                  value={vault[f.key]}
                  onChange={(e) => setVaultField(f.key, e.target.value)}
                  className="w-full bg-[#070710] border border-border rounded-lg p-2 text-[#e8e8f0] font-mono text-[10px] leading-relaxed resize-none focus:outline-none focus:border-accent"
                  rows={8}
                />
              ) : (
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setEditing(f.key)}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: f.color }}
                  />
                  <span className="text-[11px] text-dim font-mono">
                    {f.hint} — loaded
                  </span>
                  <span className="text-[10px] text-dim/40 ml-auto font-mono">
                    click to edit
                  </span>
                </div>
              )}

              {/* Re-upload when file is loaded */}
              {hasFile(f.key) && !editing && (
                <UploadZone
                  label={`Re-upload ${f.label}`}
                  onLoad={(text) => setVaultField(f.key, text)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}