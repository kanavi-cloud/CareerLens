import type { DeadlineStatus, JobPosting } from "@/lib/jobs";
export { countryLabel } from "@/lib/display-labels";

export const deadlineLabel: Record<DeadlineStatus, string> = {
  ROLLING: "상시",
  CLOSED: "마감",
  URGENT: "마감 임박",
  CLOSING_SOON: "마감 예정",
  OPEN: "접수 중"
};

export function deadlineTone(status: DeadlineStatus) {
  if (status === "URGENT" || status === "CLOSING_SOON") return "warning";
  if (status === "CLOSED") return "risk";
  if (status === "OPEN") return "success";
  return "muted";
}

export function deadlineText(job: JobPosting) {
  return deadlineLabel[job.deadline_status] ?? "상태 미정";
}

export function formatDate(value: string | null) {
  if (!value) return "미기재";
  return value.replaceAll("-", ".");
}

export function daysText(job: JobPosting) {
  if (job.days_until_deadline === null) return "공개 API 미제공";
  if (job.days_until_deadline < 0) return "마감된 공고";
  if (job.days_until_deadline === 0) return "오늘 마감";
  return `D-${job.days_until_deadline}`;
}
