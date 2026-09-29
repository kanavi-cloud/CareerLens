import { View, Text, Pressable } from 'react-native';
"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { EmploymentFlowGuide } from "@/components/roadmap/employment-flow-guide";
import { SiteHeader } from "@/components/site-header";
import { Button, Card, EmptyState, LinkButton, PageShell } from "@/components/ui";
import { fetchUserApplications, type ApplicationRecord, type ApplicationStatus } from "@/lib/applications";
import { countryLabel, workTypeLabel } from "@/lib/display-labels";

type StageFilter = "ALL" | "INTERESTED" | "PREPARING_DOCUMENTS" | "ACTIVE";
type IconName = "users" | "chart" | "bell" | "check" | "external" | "document" | "arrow";

const PAGE_SIZE = 4;

const stageFilters: Array<{ key: StageFilter; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "INTERESTED", label: "관심 공고" },
  { key: "PREPARING_DOCUMENTS", label: "지원 준비" },
  { key: "ACTIVE", label: "진행 중" }
];

export default function ApplicationsPage() {
  const auth = useRequiredAuth();
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<StageFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (auth.isChecking) {
      return;
    }
    if (!auth.user) {
      setIsLoading(false);
      return;
    }

    fetchUserApplications(auth.user.user_id)
      .then((items) => {
        setRecords(items);
        setSelectedId(items[0]?.application_id ?? null);
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "지원 기록을 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  const orderedRecords = useMemo(() => sortByPriority(records), [records]);

  const counts = useMemo(() => {
    return {
      ALL: records.length,
      INTERESTED: records.filter((record) => record.status === "INTERESTED").length,
      PREPARING_DOCUMENTS: records.filter((record) => record.status === "PREPARING_DOCUMENTS").length,
      ACTIVE: records.filter((record) => isActiveStatus(record.status)).length
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (stageFilter === "ALL") return orderedRecords;
    if (stageFilter === "ACTIVE") return orderedRecords.filter((record) => isActiveStatus(record.status));
    return orderedRecords.filter((record) => record.status === stageFilter);
  }, [orderedRecords, stageFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const pagedRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedRecord = records.find((record) => record.application_id === selectedId) ?? filteredRecords[0] ?? records[0] ?? null;

  useEffect(() => {
    setCurrentPage(1);
  }, [stageFilter]);

  useEffect(() => {
    if (filteredRecords.length === 0) return;
    const visibleSelected = filteredRecords.some((record) => record.application_id === selectedId);
    if (!visibleSelected) {
      setSelectedId(filteredRecords[0].application_id);
    }
  }, [filteredRecords, selectedId]);

  const urgentCount = records.filter((record) => record.deadline_status === "URGENT" || record.deadline_status === "SOON").length;
  const activeCount = counts.ACTIVE;
  const averageReadiness = records.length === 0
    ? 0
    : Math.round(records.reduce((sum, record) => sum + record.readiness_score, 0) / records.length);
  const documentReadyCount = records.filter((record) => record.document_checklist.some((item) => item.status === "DONE" || item.status === "VERIFIED")).length;

  if (auth.isChecking) {
    return <AuthCheckingScreen title="기업지원 관리 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="기업지원 관리는 로그인 후 이용할 수 있습니다." />;
  }

  return (
    <PageShell>
      <SiteHeader />

      <View>
        <View>
          <View className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <View>
              <Text className="flex-row items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-900">
                Application Workspace
              </Text>
              <Text className="mt-3 text-[34px] font-black leading-tight tracking-normal text-slate-950 md:text-[42px]">
                기업 지원 관리
              </Text>
              <Text className="mt-3 text-sm font-semibold text-slate-600">
                분석 결과를 기반으로 맞춤 커리어 로드맵과 공고 진행 현황을 한눈에 확인하세요.
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-3">
              <LinkButton href="/jobs" variant="secondary" className="gap-2 rounded-md border-slate-300 bg-white px-5 text-sm text-slate-900 shadow-sm">
                <LensIcon name="external" className="h-4 w-4" />
                전체 공고 보기
              </LinkButton>
              <LinkButton href="/jobs/recommendation" className="rounded-md bg-[#062f2b] px-5 text-sm text-white shadow-sm hover:bg-[#052622]">
                적합도 진단으로 이동
              </LinkButton>
            </View>
          </View>

          <View className="mt-7 flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:flex-cols-4">
            <PlannerMetric icon="users" tint="green" label="지원 후보" value={records.length} />
            <PlannerMetric icon="chart" tint="blue" label="로드맵별 평균 준비도" value={`${averageReadiness}점`} />
            <PlannerMetric icon="bell" tint="orange" label="마감 주의" value={`${urgentCount}개`} />
            <PlannerMetric icon="check" tint="mint" label="진행 중인 로드맵" value={`${activeCount}개`} />
          </View>
        </View>

        <View>
          {isLoading && (
            <View className="mt-2">
              <EmptyState title="지원 기록을 불러오는 중입니다." description="로그인한 사용자 기준으로 지원 워크스페이스를 확인하고 있습니다." />
            </View>
          )}

          {errorMessage && (
            <View className="mt-2">
              <EmptyState title="지원관리 데이터를 처리하지 못했습니다." description={errorMessage} />
            </View>
          )}

          {!isLoading && records.length === 0 && (
            <View className="mt-2">
              <Card className="rounded-xl border-slate-200 p-8 text-center shadow-sm">
                <Text className="text-lg font-black text-slate-950">아직 지원 후보가 없습니다.</Text>
                <Text className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                  적합도 진단에서 커리어 플래너를 만들거나 전체 공고에서 목표 공고를 선택하면 지원관리로 넘길 수 있습니다.
                </Text>
                <View className="mt-6 flex-row justify-center">
                  <LinkButton href="/jobs/recommendation" className="rounded-md bg-[#062f2b]">적합도 진단 시작</LinkButton>
                </View>
              </Card>
            </View>
          )}

          {records.length > 0 && (
            <View className="flex-row gap-4 xl:flex-cols-[minmax(0,1fr)_370px]">
              <Card className="rounded-xl border-slate-200 p-4 shadow-sm md:p-5">
                <View className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
                  <View>
                    <Text className="text-[11px] font-black uppercase tracking-[0.14em] text-[#147062]">Roadmap List</Text>
                    <Text className="mt-2 text-2xl font-black tracking-normal text-slate-950">지원 후보 로드맵</Text>
                  </View>
                  <View className="flex w-full flex-cols-2 rounded-md shadow-sm sm:flex-cols-4 lg:w-auto">
                    {stageFilters.map((filter) => {
                      const isActive = stageFilter === filter.key;
                      return (
                        <Pressable
                          key={filter.key}
                          
                          className={`min-h-10 rounded-none border border-slate-200 px-4 text-xs shadow-none first:rounded-l-md last:rounded-r-md ${
                            isActive
                              ? "bg-[#062f2b] text-white hover:bg-[#062f2b] hover:text-white"
                              : "bg-white text-slate-900 hover:bg-slate-50"
                          }`}
                          style={isActive ? { backgroundColor: "#062f2b", borderColor: "#062f2b", color: "#ffffff" } : undefined}
                          aria-pressed={isActive}
                          onPress={() => setStageFilter(filter.key)}
                        >
                          {filter.label} {counts[filter.key]}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {filteredRecords.length === 0 ? (
                  <View className="mt-5">
                    <EmptyState title="해당 단계의 공고가 없습니다." description="다른 지원 단계를 선택하거나 전체 목록에서 확인하세요." />
                  </View>
                ) : (
                  <>
                    <View className="mt-5 flex-row gap-4 lg:flex-cols-2">
                      {pagedRecords.map((record) => (
                        <ApplicationListCard
                          key={record.application_id}
                          record={record}
                          isSelected={selectedRecord?.application_id === record.application_id}
                          onSelect={() => setSelectedId(record.application_id)}
                        />
                      ))}
                    </View>

                    <Pagination currentPage={safePage} pageCount={pageCount} onPageChange={setCurrentPage} />
                  </>
                )}
              </Card>

              <View>
                <ApplicationActionPanel record={selectedRecord} documentReadyCount={documentReadyCount} />
                <EmploymentFlowGuide currentStep="applications" roadmapId={selectedRecord?.roadmap_id} />
              </View>
            </View>
          )}
        </View>
      </View>
    </PageShell>
  );
}

function PlannerMetric({
  icon,
  tint,
  label,
  value
}: {
  icon: IconName;
  tint: "green" | "blue" | "orange" | "mint";
  label: string;
  value: string | number;
}) {
  const tintClass = {
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-500",
    mint: "bg-teal-50 text-emerald-600"
  }[tint];

  return (
    <View className="flex min-h-[108px] items-center gap-5 border-b border-slate-200 px-5 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <Text className={`flex h-12 w-12 shrink-0 place-items-center rounded-full ${tintClass}`}>
        <LensIcon name={icon} className="h-6 w-6" />
      </Text>
      <View>
        <Text className="text-sm font-bold text-slate-500">{label}</Text>
        <Text className="mt-1 text-2xl font-black leading-none text-slate-950">{value}</Text>
      </View>
    </View>
  );
}

function ApplicationListCard({
  record,
  isSelected,
  onSelect
}: {
  record: ApplicationRecord;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <View>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0">
          <View className="flex-row flex-wrap gap-2">
            <StatusBadge tone={deadlineTone(record.deadline_status)}>{deadlineLabel(record)}</StatusBadge>
            <StatusBadge tone={statusTone(record.status)}>{statusLabel(record.status)}</StatusBadge>
          </View>
          <Text className="mt-3 text-sm font-black text-[#147062]">{record.company_name}</Text>
          <Text className="mt-1 line-clamp-2 text-base font-black leading-6 text-slate-950">{record.job_title}</Text>
          <Text className="mt-2 text-xs font-semibold text-slate-600">
            {countryLabel(record.country)} · {workTypeLabel(record.work_type)} · {record.salary_range || "연봉 미기재"}
          </Text>
        </View>
        <ReadinessGaugeCard value={record.readiness_score} />
      </View>

      <View className="mt-6 flex-row gap-3">
        <ProgressLine label="서류 준비도" value={record.readiness_score} tone={scoreTone(record.readiness_score)} />
        <ProgressLine label="로드맵 완료율" value={record.roadmap_completion_rate} tone="teal" />
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button  className="min-h-9 gap-1 rounded-md bg-[#062f2b] px-4 text-xs text-white hover:bg-[#052622]" onPress={onSelect}>
          상세보기 <LensIcon name="arrow" className="h-3.5 w-3.5" />
        </Button>
        <LinkButton href={`/applications/${record.application_id}`} variant="secondary" className="min-h-9 rounded-md border-slate-300 bg-white px-4 text-xs text-slate-900">
          워크스페이스
        </LinkButton>
      </View>
    </View>
  );
}

function ApplicationActionPanel({ record, documentReadyCount }: { record: ApplicationRecord | null; documentReadyCount: number }) {
  if (!record) {
    return (
      <Card className="rounded-xl p-5 shadow-sm">
        <EmptyState title="선택한 공고가 없습니다." description="지원 후보 목록에서 공고를 선택하면 준비 상태를 확인할 수 있습니다." />
      </Card>
    );
  }

  const verifiedCount = record.document_checklist.filter((item) => item.status === "DONE" || item.status === "VERIFIED").length;

  return (
    <Card className="rounded-xl border-slate-200 p-5 shadow-sm">
      <Text className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-800">Selected Roadmap</Text>
      <Text className="mt-3 text-xl font-black leading-7 text-slate-950">{record.company_name}</Text>
      <Text className="mt-1 text-sm font-black text-slate-800">{record.job_title}</Text>
      <Text className="mt-2 text-xs font-semibold text-slate-500">
        {countryLabel(record.country)} · {workTypeLabel(record.work_type)} · {record.salary_range || "연봉 미기재"}
      </Text>

      <View className="mt-5 flex-row gap-2 gap-3">
        <ReadinessDetailMetric value={record.readiness_score} helper={statusLabel(record.status)} />
        <DetailMetric label="서류 확인" value={`${verifiedCount}/${record.document_checklist.length}`} helper={`전체 ${documentReadyCount}개 후보`} />
      </View>

      <View className="mt-5 space-y-4">
        <ProgressLine label="서류 준비도" value={record.readiness_score} tone={scoreTone(record.readiness_score)} showTotal />
        <ProgressLine label="로드맵 완료율" value={record.roadmap_completion_rate} tone="teal" showTotal />
      </View>

      <View className="mt-5 flex-row items-center justify-between gap-4 rounded-lg border border-slate-200 bg-[#f8faf9] p-4">
        <View>
          <Text className="text-xs font-black text-slate-700">다음 액션</Text>
          <Text className="mt-1 line-clamp-3 text-xs font-semibold leading-5 text-slate-600">{record.next_action}</Text>
        </View>
        <Text className="flex h-8 w-8 shrink-0 place-items-center rounded-md bg-teal-50 text-[#147062]">
          <LensIcon name="document" className="h-4 w-4" />
        </Text>
      </View>

      <View className="mt-5">
        <Text className="text-xs font-black uppercase tracking-[0.14em] text-[#147062]">Checklist</Text>
        <View className="mt-3 space-y-2">
          {record.document_checklist.slice(0, 4).map((item) => (
            <View key={item.key} className="flex-row items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <View className="flex min-w-0 items-center gap-3">
                <Text className="flex h-7 w-7 shrink-0 place-items-center rounded-md bg-teal-50 text-[#147062]">
                  <LensIcon name="document" className="h-4 w-4" />
                </Text>
                <Text className="min-w-0 truncate text-sm font-black text-slate-950">{item.label}</Text>
              </View>
              <DocumentStatusBadge status={item.status} />
            </View>
          ))}
        </View>
      </View>

      <View className="mt-5 flex-row gap-2">
        <LinkButton href={`/applications/${record.application_id}`} className="w-full gap-2 rounded-md bg-[#062f2b] text-white hover:bg-[#052622]">
          지원 워크스페이스 열기
          <LensIcon name="external" className="h-4 w-4" />
        </LinkButton>
        {record.roadmap_id && (
          <LinkButton href={`/planner/${record.roadmap_id}`} variant="secondary" className="w-full rounded-md border-slate-300 bg-white text-slate-900">
            커리어 플래너로 돌아가기
          </LinkButton>
        )}
        <View className="flex-row gap-2 gap-2">
          <LinkButton href="/roadmap/employment/documents" variant="secondary" className="w-full rounded-md border-slate-300 bg-white text-slate-900">
            문서 점검
          </LinkButton>
          {record.application_url ? (
            <LinkButton href={record.application_url} target="_blank" rel="noreferrer" variant="secondary" className="w-full gap-2 rounded-md border-slate-300 bg-white text-slate-900">
              <LensIcon name="external" className="h-4 w-4" />
              공고 보기
            </LinkButton>
          ) : (
            <LinkButton href="/jobs" variant="secondary" className="w-full gap-2 rounded-md border-slate-300 bg-white text-slate-900">
              <LensIcon name="external" className="h-4 w-4" />
              공고 보기
            </LinkButton>
          )}
        </View>
      </View>
    </Card>
  );
}

function ReadinessGaugeCard({ value }: { value: number }) {
  return (
    <View className="min-w-[86px] rounded-md border border-slate-200 bg-white px-3 py-2 text-center">
      <Text className="text-[10px] font-black leading-none text-slate-600">준비도</Text>
      <View className="mt-2 flex-row items-center justify-center gap-2">
        <CircularProgress value={value} size={28} />
        <Text className="whitespace-nowrap leading-none">
          <Text className="text-lg font-black text-slate-950">{value}</Text>
          <Text className="ml-0.5 text-[10px] font-black text-slate-500">점</Text>
        </Text>
      </View>
    </View>
  );
}

function ReadinessDetailMetric({ value, helper }: { value: number; helper: string }) {
  return (
    <View className="rounded-md border border-slate-200 bg-[#fbfcfd] p-3">
      <Text className="text-xs font-black text-slate-700">준비도</Text>
      <View className="mt-2 flex-row items-center gap-2">
        <CircularProgress value={value} size={30} />
        <Text className="whitespace-nowrap leading-none">
          <Text className="text-xl font-black text-slate-950">{value}</Text>
          <Text className="ml-0.5 text-xs font-black text-slate-500">점</Text>
        </Text>
      </View>
      <Text className="mt-2 text-xs font-semibold text-slate-500">{helper}</Text>
    </View>
  );
}

function CircularProgress({ value, size }: { value: number; size: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <Text
      className="relative flex-row shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(#11885f ${clamped * 3.6}deg, #e8edf0 0deg)`
      }}
      aria-hidden="true"
    >
      <Text className=" rounded-full bg-white" style={{ width: size - 10, height: size - 10 }} />
    </Text>
  );
}

function DetailMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <View className="rounded-md border border-slate-200 bg-[#fbfcfd] p-3">
      <Text className="text-xs font-black text-slate-700">{label}</Text>
      <View className="mt-2 flex h-[30px] items-center">
        <Text className="text-[28px] font-black leading-none text-slate-950">{value}</Text>
      </View>
      <Text className="mt-2 text-xs font-semibold text-slate-500">{helper}</Text>
    </View>
  );
}

function ProgressLine({
  label,
  value,
  tone,
  showTotal = false
}: {
  label: string;
  value: number;
  tone: "orange" | "teal" | "green" | "red";
  showTotal?: boolean;
}) {
  const barClass = {
    orange: "bg-[#d97706]",
    teal: "bg-[#147062]",
    green: "bg-emerald-600",
    red: "bg-red-500"
  }[tone];

  return (
    <View>
      <View className="flex-row items-center justify-between gap-3 text-sm">
        <Text className="font-black text-slate-700">{label}</Text>
        <Text className="font-black text-slate-950">{showTotal ? `${value} / 100` : value}</Text>
      </View>
      <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <View className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </View>
    </View>
  );
}

function StatusBadge({ children, tone }: { children: React.ReactNode; tone: "red" | "orange" | "blue" | "green" | "muted" }) {
  const toneClass = {
    red: "border-red-200 bg-red-50 text-red-600",
    orange: "border-orange-200 bg-orange-50 text-orange-600",
    blue: "border-blue-100 bg-blue-50 text-blue-600",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    muted: "border-slate-200 bg-slate-50 text-slate-600"
  }[tone];

  return (
    <Text className={`flex-row items-center min-h-6 items-center rounded-md border px-2 text-xs font-black ${toneClass}`}>
      {children}
    </Text>
  );
}

function DocumentStatusBadge({ status }: { status: string }) {
  return (
    <Text className={`flex-row items-center min-h-8 shrink-0 items-center justify-center rounded-md border px-3 py-1 text-xs font-black ${documentToneClass(status)}`}>
      {documentLabel(status)}
    </Text>
  );
}

function Pagination({
  currentPage,
  pageCount,
  onPageChange
}: {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <View className="mt-6 flex-row items-center justify-center gap-2">
      <Button
        
        variant="secondary"
        className="min-h-9 rounded-md border-slate-300 bg-white px-3 text-xs"
        disabled={currentPage === 1}
        onPress={() => onPageChange(currentPage - 1)}
      >
        이전
      </Button>
      {Array.from({ length: pageCount }).map((_, index) => {
        const page = index + 1;
        return (
          <Button
            key={page}
            
            variant="secondary"
            className={`min-h-9 min-w-9 rounded-md px-3 text-xs ${
              currentPage === page ? "border-[#062f2b] bg-[#062f2b] text-white" : "border-slate-300 bg-white text-slate-900"
            }`}
            onPress={() => onPageChange(page)}
          >
            {page}
          </Button>
        );
      })}
      <Button
        
        variant="secondary"
        className="min-h-9 rounded-md border-slate-300 bg-white px-3 text-xs"
        disabled={currentPage === pageCount}
        onPress={() => onPageChange(currentPage + 1)}
      >
        다음
      </Button>
    </View>
  );
}

function LensIcon({ name, className = "" }: { name: IconName; className?: string }) {
  if (name === "users") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <Textath d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <Textath d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <Textath d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <rect x="4" y="12" width="4" height="8" rx="1" />
        <rect x="10" y="8" width="4" height="12" rx="1" />
        <rect x="16" y="4" width="4" height="16" rx="1" />
      </svg>
    );
  }
  if (name === "bell") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <Textath d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <Textath d="M9.5 21a2.8 2.8 0 0 0 5 0" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <Textath d="M20 6 9 17l-5-5" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }
  if (name === "external") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <Textath d="M15 3h6v6" />
        <Textath d="m10 14 11-11" />
        <Textath d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </svg>
    );
  }
  if (name === "document") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <Textath d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
        <Textath d="M14 2v5h5" />
        <Textath d="M9 13h6" />
        <Textath d="M9 17h4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <Textath d="M9 18 15 12 9 6" />
    </svg>
  );
}

function sortByPriority(records: ApplicationRecord[]) {
  return records.slice().sort((left, right) => {
    const statusOrder = statusPriority(left.status) - statusPriority(right.status);
    if (statusOrder !== 0) return statusOrder;
    const leftDays = left.days_until_deadline ?? 9999;
    const rightDays = right.days_until_deadline ?? 9999;
    if (leftDays !== rightDays) return leftDays - rightDays;
    return right.readiness_score - left.readiness_score;
  });
}

function statusPriority(status: ApplicationStatus) {
  if (status === "PREPARING_DOCUMENTS") return 0;
  if (status === "INTERESTED") return 1;
  if (status === "APPLIED" || status === "INTERVIEW") return 2;
  return 3;
}

function isActiveStatus(status: ApplicationStatus) {
  return status === "APPLIED" || status === "INTERVIEW" || status === "CLOSED";
}

function statusLabel(status: ApplicationStatus) {
  if (status === "INTERESTED") return "관심";
  if (status === "PREPARING_DOCUMENTS") return "지원 준비";
  if (status === "APPLIED") return "지원 완료";
  if (status === "INTERVIEW") return "면접";
  if (status === "CLOSED") return "종료";
  return status;
}

function statusTone(status: ApplicationStatus) {
  if (status === "APPLIED" || status === "INTERVIEW") return "green";
  if (status === "CLOSED") return "muted";
  if (status === "PREPARING_DOCUMENTS") return "blue";
  return "muted";
}

function deadlineLabel(record: ApplicationRecord) {
  if (record.deadline_status === "ONGOING") return "상시/미기재";
  if (record.deadline_status === "EXPIRED") return "마감";
  if (record.days_until_deadline === 0) return "오늘 마감";
  if (record.days_until_deadline == null) return "D-?";
  return `D-${record.days_until_deadline}`;
}

function deadlineTone(status: ApplicationRecord["deadline_status"]) {
  if (status === "URGENT" || status === "EXPIRED") return "red";
  if (status === "SOON") return "orange";
  return "muted";
}

function scoreTone(score: number): "orange" | "teal" | "green" | "red" {
  if (score >= 80) return "green";
  if (score >= 65) return "teal";
  if (score >= 50) return "orange";
  return "red";
}

function documentLabel(status: string) {
  if (status === "VERIFIED") return "검증";
  if (status === "DONE") return "완료";
  return "대기";
}

function documentToneClass(status: string) {
  if (status === "VERIFIED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "DONE") return "border-teal-200 bg-teal-50 text-[#147062]";
  return "border-slate-200 bg-white text-slate-700";
}
