"use client";

import { useState } from "react";
import clsx from "clsx";
import VaultPanel from "@/components/VaultPanel";
import SplitPanel from "@/components/SplitPanel";
import LookupPanel from "@/components/LookupPanel";
import ReplacePanel from "@/components/ReplacePanel";

type Tab = "split" | "lookup" | "replace";

const tabs: { id: Tab; label: string; icon: string; dot: string }[] = [
  { id: "split",   label: "Split Accounts", icon: "⚡", dot: "#7c6aff" },
  { id: "lookup",  label: "Dead Lookup",    icon: "🔍", dot: "#ff6a9b" },
  { id: "replace", label: "Replace Cookies",icon: "🔄", dot: "#6affd4" },
];

export default function Home() {
  const [active, setActive] = useState<Tab>("split");

  return (
    <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
      {/* Glow orbs */}
      <div className="fixed top-[-150px] right-[-100px] w-[500px] h-[500px] rounded-full bg-accent/[0.06] blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-150px] left-[-100px] w-[500px] h-[500px] rounded-full bg-[#6affd4]/[0.04] blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="text-center mb-10 animate-fade-down">
        <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-1.5 text-[10px] text-dim tracking-widest uppercase mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6affd4] animate-pulse2" />
          Roblox Account Manager
        </div>
        <h1 className="font-display text-5xl font-extrabold tracking-tight bg-gradient-to-br from-[#e8e8f0] via-[#e8e8f0] to-accent bg-clip-text text-transparent mb-3">
          Account Hub
        </h1>
        <p className="text-dim text-sm tracking-widest">// manage · split · lookup · replace</p>
      </header>

      {/* Vault panel — always visible */}
      <VaultPanel />

      {/* Tab bar */}
      <div className="flex gap-1.5 bg-surface border border-border rounded-2xl p-1.5 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[11px] font-mono tracking-wide transition-all duration-200 cursor-pointer",
              active === tab.id
                ? "bg-surface2 border border-border text-[#e8e8f0]"
                : "text-dim hover:text-[#e8e8f0] hover:bg-surface2"
            )}
          >
            <span
              className="w-1.5 h-1.5 rounded-full transition-all duration-200"
              style={{
                background: tab.dot,
                opacity: active === tab.id ? 1 : 0,
                boxShadow: active === tab.id ? `0 0 6px ${tab.dot}` : "none",
              }}
            />
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {active === "split"   && <SplitPanel />}
      {active === "lookup"  && <LookupPanel />}
      {active === "replace" && <ReplacePanel />}
    </main>
  );
}