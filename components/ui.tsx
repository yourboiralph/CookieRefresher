"use client";

import { useRef } from "react";
import clsx from "clsx";

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("bg-surface border border-border rounded-2xl overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="px-5 py-3 border-b border-border flex items-center gap-2 text-dim text-[10px] tracking-widest uppercase">
      <span>{icon}</span>
      {label}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("p-5", className)}>{children}</div>;
}

// ── Button ────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "success" | "danger";

const btnStyles: Record<BtnVariant, string> = {
  primary: "bg-accent text-white hover:bg-[#6b59ff] hover:shadow-[0_4px_20px_rgba(124,106,255,0.3)] hover:-translate-y-px border border-[#6b59ff]",
  secondary: "bg-surface2 border border-border text-[#e8e8f0] hover:border-accent hover:text-accent",
  success: "bg-[rgba(74,222,128,0.12)] border border-[rgba(74,222,128,0.3)] text-[#4ade80] hover:bg-[rgba(74,222,128,0.2)]",
  danger: "bg-[rgba(248,113,113,0.12)] border border-[rgba(248,113,113,0.3)] text-[#f87171] hover:bg-[rgba(248,113,113,0.2)]",
};

export function Button({
  children,
  variant = "secondary",
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  variant?: BtnVariant;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs tracking-wide font-semibold transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
        btnStyles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────
export function Textarea({
  id,
  value,
  onChange,
  placeholder,
  readOnly,
  rows = 10,
}: {
  id?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      rows={rows}
      className={clsx(
        "w-full bg-surface2 border border-border rounded-xl p-3 text-[#e8e8f0] placeholder-dim/50",
        "focus:border-accent transition-colors duration-200",
        readOnly && "opacity-75 cursor-default"
      )}
    />
  );
}

// ── Upload zone ───────────────────────────────────────────────────────────
export function UploadZone({
  label,
  onLoad,
}: {
  label: string;
  onLoad: (text: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => onLoad(e.target?.result as string ?? "");
    reader.readAsText(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-accent", "bg-accent/5"); }}
      onDragLeave={(e) => e.currentTarget.classList.remove("border-accent", "bg-accent/5")}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-accent", "bg-accent/5");
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      className="border border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all duration-200 mb-3"
    >
      <div className="text-2xl mb-1">📂</div>
      <p className="text-dim text-[11px]">{label} — or drag & drop</p>
      <input
        ref={inputRef}
        type="file"
        accept=".txt"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

// ── Field label ───────────────────────────────────────────────────────────
export function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] text-dim tracking-widest uppercase">{label}</span>
      {hint && <span className="text-[10px] text-dim/50">{hint}</span>}
    </div>
  );
}

// ── Log ───────────────────────────────────────────────────────────────────
export type LogEntry = { msg: string; type: "success" | "error" | "warn" | "info" };

const logColors: Record<LogEntry["type"], string> = {
  success: "text-[#4ade80]",
  error: "text-[#f87171]",
  warn: "text-[#fbbf24]",
  info: "text-dim",
};

export function LogPanel({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="bg-[#070710] border border-border rounded-xl p-4 min-h-[80px] max-h-[180px] overflow-y-auto font-mono text-[11px] leading-relaxed mt-4">
      {entries.length === 0 ? (
        <span className="text-dim/50">// output will appear here</span>
      ) : (
        entries.map((e, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-dim/40 select-none">&gt;</span>
            <span className={logColors[e.type]}>{e.msg}</span>
          </div>
        ))
      )}
    </div>
  );
}

// ── Stats chips ───────────────────────────────────────────────────────────
export function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-surface2 border border-border rounded-full px-3 py-1 text-[11px] text-dim">
      <span className="font-semibold" style={color ? { color } : {}}>
        {value}
      </span>
      {label}
    </div>
  );
}

// ── Output block ──────────────────────────────────────────────────────────
export function OutputBlock({
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
  const download = () => {
    const blob = new Blob([value], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  const copy = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <Card>
      <CardHeader icon={icon} label={label} />
      <CardBody>
        <Textarea value={value} readOnly rows={12} />
        <div className="flex gap-2 mt-3">
          <Button variant="success" onClick={download}>⬇ Download {filename}</Button>
          <Button variant="secondary" onClick={copy}>⎘ Copy</Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────
export function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        onClick={() => onChange(!enabled)}
        className={clsx(
          "w-9 h-5 rounded-full cursor-pointer relative transition-colors duration-200 border",
          enabled ? "bg-accent border-accent" : "bg-surface2 border-border"
        )}
      >
        <div
          className={clsx(
            "absolute w-3.5 h-3.5 bg-white rounded-full top-[3px] transition-transform duration-200",
            enabled ? "translate-x-[18px]" : "translate-x-[3px]"
          )}
        />
      </div>
      <span className="text-dim text-[12px]">{label}</span>
    </div>
  );
}