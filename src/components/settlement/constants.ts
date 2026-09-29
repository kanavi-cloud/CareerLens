import type { SettlementStatus } from "@/lib/settlement";

export const statusOptions: Array<{ value: SettlementStatus; label: string }> = [
  { value: "NOT_STARTED", label: "준비 전" },
  { value: "IN_PROGRESS", label: "진행 중" },
  { value: "DONE", label: "완료" }
];

export const timeline = [
  { title: "지원 전", description: "국가별 비자 조건과 필수 증빙을 먼저 확인합니다." },
  { title: "오퍼 이후", description: "고용주 스폰서십, 재류자격, 출국 일정에 맞춰 서류를 정리합니다." },
  { title: "초기 정착", description: "주소 등록, 은행, 통신, 보험 등 현지 생활 기반을 준비합니다." }
];
