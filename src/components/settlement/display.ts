import type { SettlementChecklistItem, SettlementGuidance, SettlementStatus } from "@/lib/settlement";
import { statusOptions } from "./constants";

type BadgeTone = "default" | "brand" | "success" | "warning" | "risk" | "muted";

export function statusLabel(status: SettlementStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

export function statusTone(status: SettlementStatus): BadgeTone {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "warning";
  return "muted";
}

export function countryFallbackSummaries(
  groupedByCountry: Record<string, SettlementChecklistItem[]>
): SettlementGuidance["country_summaries"] {
  return Object.entries(groupedByCountry).map(([country, countryItems]) => {
    const completionRate = countryItems.length === 0
      ? 0
      : Math.round((countryItems.filter((item) => item.status === "DONE").length / countryItems.length) * 100);

    return {
      country,
      completion_rate: completionRate,
      risk_level: completionRate >= 70 ? "LOW" : completionRate >= 35 ? "MEDIUM" : "HIGH",
      next_actions: countryItems.filter((item) => item.status !== "DONE").slice(0, 3).map((item) => item.checklist_title)
    };
  });
}

export function guidanceStatusLabel(status: string) {
  if (status === "ON_TRACK") return "준비 양호";
  if (status === "NEEDS_ATTENTION") return "확인 필요";
  return "초기 단계";
}

export function guidanceStatusTone(status: string): BadgeTone {
  if (status === "ON_TRACK") return "success";
  if (status === "NEEDS_ATTENTION") return "warning";
  return "risk";
}

export function riskLabel(status: string) {
  if (status === "LOW") return "낮음";
  if (status === "MEDIUM") return "중간";
  return "높음";
}

export function riskTone(status: string): BadgeTone {
  if (status === "LOW") return "success";
  if (status === "MEDIUM") return "warning";
  return "risk";
}
