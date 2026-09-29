import { View, Text, Pressable } from 'react-native';
"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  PageShell,
  ScoreBar
} from "@/components/ui";
import {
  fetchSettlementChecklists,
  fetchSettlementGuidanceFromRoadmap,
  generateSettlementGuidance,
  generateSettlementGuidanceFromRoadmap,
  refreshSettlementGuidanceFromRoadmap,
  type SettlementChecklistItem,
  type SettlementGuidance
} from "@/lib/settlement";

const adminStages = [
  {
    phase: "OFFER",
    title: "오퍼/고용계약 확인",
    description: "입사 예정일, 고용주 정보, 비자 스폰서십 여부, 제출 서류를 확정합니다."
  },
  {
    phase: "VISA",
    title: "비자/재류자격 준비",
    description: "국가별 공식기관 기준으로 체류자격, 제출 서류, 처리 기간을 확인합니다."
  },
  {
    phase: "PRE-DEPARTURE",
    title: "출국 전 행정 패키지",
    description: "영문/일문 증빙, 보험, 숙소, 긴급 연락처, 회사 제출 서류를 하나로 묶습니다."
  },
  {
    phase: "ARRIVAL",
    title: "입국 후 초기 행정",
    description: "주소 등록, 은행, 통신, 보험, 회사 온보딩 서류를 순서대로 처리합니다."
  }
];

const officialSourceCards = [
  {
    country: "미국",
    title: "비자/고용 관련 공식 확인",
    description: "USCIS, Department of State, 고용주 안내 자료를 기준으로 최신 절차를 확인합니다.",
    tags: ["USCIS", "State Dept.", "Employer"]
  },
  {
    country: "일본",
    title: "재류자격/입국 행정 공식 확인",
    description: "출입국재류관리청, 대사관, 고용주 제출 서류 안내를 기준으로 확인합니다.",
    tags: ["Immigration Services Agency", "Embassy", "Employer"]
  }
];

type CountrySummary = SettlementGuidance["country_summaries"][number];

export default function AdministrationRoadmapPage() {
  const auth = useRequiredAuth();
  const [items, setItems] = useState<SettlementChecklistItem[]>([]);
  const [guidance, setGuidance] = useState<SettlementGuidance | null>(null);
  const [linkedRoadmapId, setLinkedRoadmapId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (auth.isChecking || !auth.user) return;
    const linkedRoadmapId = Number(new URLSearchParams(window.location.search).get("roadmapId") ?? 0);
    setLinkedRoadmapId(linkedRoadmapId || null);

    Promise.all([
      fetchSettlementChecklists(auth.user.user_id),
      linkedRoadmapId ? loadRoadmapGuidance(linkedRoadmapId) : generateSettlementGuidance(auth.user.user_id)
    ])
      .then(([loadedItems, generatedGuidance]) => {
        setItems(loadedItems);
        setGuidance(generatedGuidance);
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "행정로드맵 데이터를 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  async function loadRoadmapGuidance(roadmapId: number) {
    try {
      return await fetchSettlementGuidanceFromRoadmap(roadmapId);
    } catch (error) {
      if (isMissingSavedGuidance(error)) {
        return generateSettlementGuidanceFromRoadmap(roadmapId);
      }
      throw error;
    }
  }

  async function refreshLinkedGuidance() {
    if (!linkedRoadmapId) return;
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      setGuidance(await refreshSettlementGuidanceFromRoadmap(linkedRoadmapId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "행정로드맵을 갱신하지 못했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  }

  const adminItems = useMemo(() => {
    return items.filter((item) =>
      item.category.includes("비자")
      || item.category.includes("행정")
      || item.description.includes("비자")
      || item.description.includes("재류")
      || item.description.includes("주소 등록")
      || item.description.includes("보험")
    );
  }, [items]);

  const doneCount = adminItems.filter((item) => item.status === "DONE").length;
  const inProgressCount = adminItems.filter((item) => item.status === "IN_PROGRESS").length;
  const completionRate = adminItems.length === 0 ? 0 : Math.round((doneCount / adminItems.length) * 100);
  const guidanceRate = guidance?.completion_rate ?? completionRate;
  const remainingCount = Math.max(0, adminItems.length - doneCount);
  const priorityActions = guidance?.priority_actions?.length
    ? guidance.priority_actions
    : adminItems.slice(0, 4).map((item) => `${item.country} - ${item.checklist_title}`);
  const countrySummaries = guidance?.country_summaries?.length
    ? guidance.country_summaries
    : fallbackCountrySummaries(adminItems);

  if (auth.isChecking) {
    return <AuthCheckingScreen title="행정로드맵 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="행정로드맵은 로그인 후 이용할 수 있습니다." />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="ADMINISTRATION ROADMAP"
        title="행정로드맵"
        actions={
          <>
            <LinkButton href={linkedRoadmapId ? `/roadmap/departure?roadmapId=${linkedRoadmapId}` : "/roadmap/departure"} variant="secondary">
              출국로드맵으로
            </LinkButton>
            <LinkButton href="/applications" variant="secondary">지원 관리로</LinkButton>
            {linkedRoadmapId && (
              <Button  variant="secondary" onPress={refreshLinkedGuidance} disabled={isRefreshing || isLoading}>
                {isRefreshing ? "갱신 중" : "최신 정보로 갱신"}
              </Button>
            )}
          </>
        }
      />

      <View>
        {isLoading && <EmptyState title="행정로드맵을 불러오는 중입니다." description="사용자별 정착 체크리스트와 AI/규칙 기반 안내를 조합하고 있습니다." />}

        {errorMessage && <EmptyState title="행정로드맵 데이터 처리 실패" description={errorMessage} />}

        {!isLoading && (
          <View className="space-y-6">
            <Card className="overflow-hidden p-0">
              <View className="flex-row gap-0 lg:flex-cols-[1.05fr_0.95fr]">
                <View className="border-b border-line p-5 lg:border-b-0 lg:border-r">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Badge tone={overallStatusTone(guidance?.overall_status)}>{overallStatusLabel(guidance?.overall_status)}</Badge>
                    <Badge tone={guidance?.generation_mode.includes("AI") ? "brand" : "muted"}>
                      {guidance?.generation_mode.includes("AI") ? "AI 보조" : "규칙 기반"}
                    </Badge>
                    <Badge tone={remainingCount === 0 ? "success" : "warning"}>남은 항목 {remainingCount}개</Badge>
                  </View>
                  <Text className="mt-4 flex-row items-center gap-2 text-2xl font-semibold leading-8 text-night">
                    <Text aria-hidden="true" className="text-3xl leading-none">🏛️</Text>
                    행정 준비 현황
                  </Text>
                  <Text className="mt-3 text-sm leading-6 text-slate-600">
                    {guidance?.summary ?? "정착 체크리스트를 기준으로 비자, 출국 전 준비, 초기 행정 항목을 정리합니다."}
                  </Text>
                  {guidance?.updated_at && (
                    <Text className="mt-3 text-xs font-semibold text-slate-500">
                      저장일 {formatDateTime(guidance.created_at ?? guidance.updated_at)} · 최근 갱신 {formatDateTime(guidance.refreshed_at ?? guidance.updated_at)}
                    </Text>
                  )}
                  <View className="mt-5">
                    <ScoreBar label="비자/행정 준비율" value={guidanceRate} tone={guidanceRate >= 70 ? "success" : "warning"} />
                  </View>
                </View>

                <View className="flex-row gap-2 gap-px bg-line">
                  <AdminStat label="체크 항목" value={adminItems.length} helper="비자/행정/보험" />
                  <AdminStat label="진행 중" value={inProgressCount} helper="확인 또는 처리 중" />
                  <AdminStat label="완료" value={doneCount} helper="저장된 완료 상태" />
                  <AdminStat label="준비율" value={`${guidanceRate}%`} helper="전체 진행 기준" />
                </View>
              </View>
            </Card>

            <View>
              <PriorityPanel actions={priorityActions} />
              <CountryReadinessPanel summaries={countrySummaries} />
            </View>

            <View>
              <AdminStageJourney items={adminItems} />
              <View className="space-y-5 xl:sticky xl:top-24 xl:self-start">
                <OfficialSourcePanel />
                <NextWorkspacePanel />
              </View>
            </View>

            <Card className="p-5">
              <Text className="text-xs leading-5 text-slate-500">
                비자, 세금, 체류자격, 입국 요건과 행정 절차는 변동될 수 있으므로 최종 제출 전 공식기관과 전문가를 통해 확인하세요.
              </Text>
            </Card>
          </View>
        )}
      </View>
    </PageShell>
  );
}

function AdminStat({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <View className="bg-white p-4">
      <Text className="text-xs font-bold text-slate-500">{label}</Text>
      <Text className="mt-2 text-2xl font-semibold text-night">{value}</Text>
      <Text className="mt-1 text-xs leading-5 text-slate-500">{helper}</Text>
    </View>
  );
}

function PriorityPanel({ actions }: { actions: string[] }) {
  const visibleActions = actions.slice(0, 5);
  return (
    <Card className="p-5">
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <View>
          <Text className="lens-kicker">PRIORITY ACTIONS</Text>
          <Text className="mt-3 text-xl font-semibold text-night">먼저 확인할 행정 항목</Text>
        </View>
        <Badge tone={visibleActions.length > 3 ? "warning" : "brand"}>{visibleActions.length}개</Badge>
      </View>
      <View className="mt-5 space-y-3">
        {visibleActions.map((action, index) => (
          <View key={`${action}-${index}`} className="flex flex-cols-[34px_1fr] items-start gap-3">
            <View className="flex h-8 w-8 place-items-center rounded-full border border-brand bg-[#e8f2f1] text-xs font-bold text-brand">
              {index + 1}
            </View>
            <Text className="border-b border-line pb-3 text-sm font-semibold leading-6 text-night last:border-b-0">{action}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function CountryReadinessPanel({ summaries }: { summaries: CountrySummary[] }) {
  return (
    <Card className="p-5">
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <View>
          <Text className="lens-kicker">COUNTRY READINESS</Text>
          <Text className="mt-3 text-xl font-semibold text-night">국가별 행정 리스크</Text>
        </View>
        <Badge tone="muted">{summaries.length}개 국가</Badge>
      </View>
      <View className="mt-5 flex-row gap-3 md:flex-cols-2">
        {summaries.map((summary) => (
          <View key={summary.country} className="rounded-md border border-line bg-panel p-4">
            <View className="flex-row items-start justify-between gap-3">
              <View>
                <Text className="text-sm font-bold text-night">{summary.country}</Text>
                <Text className="mt-1 text-xs font-semibold text-slate-500">준비율 {summary.completion_rate}%</Text>
              </View>
              <Badge tone={riskTone(summary.risk_level)}>{riskLabel(summary.risk_level)}</Badge>
            </View>
            <View className="mt-4">
              <ScoreBar label="국가별 완료율" value={summary.completion_rate} tone={summary.completion_rate >= 70 ? "success" : "warning"} />
            </View>
            <ul className="mt-4 space-y-2">
              {summary.next_actions.slice(0, 3).map((action) => (
                <li key={action} className="text-sm leading-6 text-slate-600">- {action}</li>
              ))}
            </ul>
          </View>
        ))}
      </View>
    </Card>
  );
}

function AdminStageJourney({ items }: { items: SettlementChecklistItem[] }) {
  return (
    <View>
      <View className="mb-4 flex-row flex-wrap items-end justify-between gap-3">
        <View>
          <Text className="lens-kicker">ADMIN JOURNEY</Text>
          <Text className="mt-3 text-2xl font-semibold text-night">행정 처리 흐름</Text>
        </View>
        <Badge tone="muted">오퍼 → 비자 → 출국 전 → 입국 후</Badge>
      </View>
      <View className="relative space-y-4 pl-7">
        <View className="absolute bottom-4 left-[10px] top-4 w-px bg-night" />
        {adminStages.map((stage, index) => (
          <AdminStageCard key={stage.phase} stage={stage} items={matchingItems(stage.phase, items)} index={index} />
        ))}
      </View>
    </View>
  );
}

function AdminStageCard({
  stage,
  items,
  index
}: {
  stage: (typeof adminStages)[number];
  items: SettlementChecklistItem[];
  index: number;
}) {
  const doneCount = items.filter((item) => item.status === "DONE").length;
  const rate = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100);

  return (
    <View>
      <View className={`absolute left-[-28px] top-5 flex h-6 w-6 place-items-center rounded-full border text-[11px] font-bold ${stageMarkerClass(rate)}`}>
        {index + 1}
      </View>
      <View className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <View>
          <Text className="text-xs font-bold text-brand">{stage.phase}</Text>
          <Text className="mt-1 text-xl font-semibold text-night">{stage.title}</Text>
          <Text className="mt-2 text-sm leading-6 text-slate-600">{stage.description}</Text>
        </View>
        <View className="min-w-[150px] rounded-md border border-line bg-panel p-3">
          <ScoreBar label="단계 완료율" value={rate} tone={rate >= 70 ? "success" : "warning"} />
        </View>
      </View>
      <View className="mt-5 flex-row gap-3 md:flex-cols-2">
        {items.length === 0 ? (
          <View className="rounded-md border border-dashed border-line bg-panel p-4 text-sm font-semibold leading-6 text-slate-500">
            현재 연결된 체크 항목이 없습니다.
          </View>
        ) : (
          items.map((item) => (
            <View key={item.item_id} className="rounded-md border border-line bg-panel p-4">
              <View className="flex-row items-start justify-between gap-3">
                <View>
                  <Text className="text-sm font-semibold text-night">{item.country} · {item.checklist_title}</Text>
                  <Text className="mt-2 text-sm leading-6 text-slate-600">{item.description}</Text>
                </View>
                <Badge tone={statusTone(item.status)} className={item.status === "NOT_STARTED" ? "min-w-[55px] justify-center" : ""}>
                  {statusLabel(item.status)}
                </Badge>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function OfficialSourcePanel() {
  return (
    <Card className="p-5">
      <Text className="lens-kicker">OFFICIAL SOURCES</Text>
      <Text className="mt-3 text-xl font-semibold text-night">공식 자료 확인 원칙</Text>
      <Text className="mt-3 text-sm leading-6 text-slate-600">
        AI는 체크리스트 요약과 우선순위 정리에만 사용하고, 비자/체류자격의 최신 판단은 공식기관 자료로 최종 확인합니다.
      </Text>
      <View className="mt-5 space-y-3">
        {officialSourceCards.map((card) => (
          <View key={card.country} className="rounded-md border border-line bg-panel p-4">
            <Badge tone="brand">{card.country}</Badge>
            <Text className="mt-3 text-base font-semibold text-night">{card.title}</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-600">{card.description}</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {card.tags.map((tag) => <Badge key={tag} tone="muted">{tag}</Badge>)}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function NextWorkspacePanel() {
  return (
    <Card className="p-5">
      <Text className="lens-kicker">NEXT WORKSPACE</Text>
      <Text className="mt-3 text-xl font-semibold text-night">지원 관리로 이어가기</Text>
      <Text className="mt-3 text-sm leading-6 text-slate-600">
        행정 준비 항목을 확인한 뒤 목표 공고의 서류 준비도와 제출 상태를 지원 관리에서 이어서 점검합니다.
      </Text>
      <View className="mt-5">
        <LinkButton href="/applications">지원 관리로 이동</LinkButton>
      </View>
    </Card>
  );
}

function matchingItems(phase: string, items: SettlementChecklistItem[]) {
  if (phase === "OFFER") {
    return items.filter((item) => item.description.includes("회사") || item.description.includes("고용") || item.description.includes("제출")).slice(0, 2);
  }
  if (phase === "VISA") {
    return items.filter((item) => item.description.includes("비자") || item.description.includes("재류")).slice(0, 3);
  }
  if (phase === "PRE-DEPARTURE") {
    return items.filter((item) => item.category.includes("출국") || item.description.includes("증빙") || item.description.includes("서류")).slice(0, 3);
  }
  return items.filter((item) => item.description.includes("주소") || item.description.includes("은행") || item.description.includes("보험")).slice(0, 3);
}

function statusLabel(status: string) {
  if (status === "DONE") return "완료";
  if (status === "IN_PROGRESS") return "진행 중";
  return "준비 전";
}

function statusTone(status: string) {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "warning";
  return "muted";
}

function overallStatusLabel(status?: string) {
  if (status === "ON_TRACK") return "일정 양호";
  if (status === "NEEDS_ATTENTION") return "확인 필요";
  if (status === "EARLY_STAGE") return "초기 단계";
  return "상태 확인";
}

function overallStatusTone(status?: string) {
  if (status === "ON_TRACK") return "success";
  if (status === "NEEDS_ATTENTION") return "warning";
  return "brand";
}

function riskLabel(riskLevel: string) {
  if (riskLevel === "LOW") return "낮음";
  if (riskLevel === "HIGH") return "높음";
  return "보통";
}

function riskTone(riskLevel: string) {
  if (riskLevel === "LOW") return "success";
  if (riskLevel === "HIGH") return "warning";
  return "brand";
}

function stageMarkerClass(rate: number) {
  if (rate >= 100) return "border-mint bg-mint text-white";
  if (rate > 0) return "border-brand bg-[#e8f2f1] text-brand";
  return "border-night bg-paper text-night";
}

function fallbackCountrySummaries(items: SettlementChecklistItem[]): CountrySummary[] {
  const grouped = items.reduce<Record<string, SettlementChecklistItem[]>>((acc, item) => {
    acc[item.country] = [...(acc[item.country] ?? []), item];
    return acc;
  }, {});

  return Object.entries(grouped).map(([country, countryItems]) => {
    const doneCount = countryItems.filter((item) => item.status === "DONE").length;
    const completionRate = countryItems.length === 0 ? 0 : Math.round((doneCount / countryItems.length) * 100);
    return {
      country,
      completion_rate: completionRate,
      risk_level: completionRate >= 70 ? "LOW" : completionRate >= 40 ? "MEDIUM" : "HIGH",
      next_actions: countryItems
        .filter((item) => item.status !== "DONE")
        .slice(0, 3)
        .map((item) => item.checklist_title)
    };
  });
}

function isMissingSavedGuidance(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("not found") || message.includes("404");
}

function formatDateTime(value: string) {
  if (!value) return "미기재";
  return value.replace("T", " ");
}
