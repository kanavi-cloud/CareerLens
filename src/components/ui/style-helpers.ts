import type { Tone } from "./types";

export function buttonClass(variant: string) {
  if (variant === "secondary") return "border border-line bg-white text-night hover:border-night";
  if (variant === "subtle") return "border border-line bg-panel text-slate-700 hover:bg-white";
  if (variant === "danger") return "bg-coral text-white hover:brightness-95";
  return "bg-night text-white hover:bg-[#24343a]";
}

export function badgeClass(tone: Tone) {
  if (tone === "brand") return "border-brand/20 bg-[#e8f2f1] text-brand";
  if (tone === "success") return "border-mint/20 bg-emerald-50 text-mint";
  if (tone === "warning") return "border-amber/20 bg-amber-50 text-amber";
  if (tone === "risk") return "border-coral/20 bg-red-50 text-coral";
  if (tone === "muted") return "border-line bg-panel text-slate-600";
  return "border-night bg-white text-night";
}

export function barClass(tone: Tone) {
  if (tone === "success") return "bg-mint";
  if (tone === "warning") return "bg-amber";
  if (tone === "risk") return "bg-coral";
  return "bg-brand";
}

export function checklistTone(status: string): Tone {
  if (status === "완료" || status === "DONE") return "success";
  if (status === "진행 중" || status === "IN_PROGRESS") return "warning";
  return "muted";
}
