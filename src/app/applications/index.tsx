"use client";

import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { EmploymentFlowGuide } from "@/components/roadmap/employment-flow-guide";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, MetricCard, PageHeader, PageShell, ScoreBar, type Tone } from "@/components/ui";
import { fetchUserApplications, type ApplicationRecord, type ApplicationStatus } from "@/lib/applications";
import { countryLabel, workTypeLabel } from "@/lib/display-labels";

type StageFilter = "ALL" | "INTERESTED" | "PREPARING_DOCUMENTS" | "ACTIVE";

const PAGE_SIZE = 5;

const stageFilters: Array<{ key: StageFilter; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "INTERESTED", label: "관심" },
  { key: "PREPARING_DOCUMENTS", label: "서류 준비" },
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
    if (auth.isChecking) return;
    if (!auth.user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    fetchUserApplications(auth.user.user_id)
      .then((items) => {
        const ordered = sortByPriority(items);
        setRecords(ordered);
        setSelectedId(ordered[0]?.application_id ?? null);
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "지원 기록을 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  const counts = useMemo(() => ({
    ALL: records.length,
    INTERESTED: records.filter((record) => record.status === "INTERESTED").length,
    PREPARING_DOCUMENTS: records.filter((record) => record.status === "PREPARING_DOCUMENTS").length,
    ACTIVE: records.filter((record) => isActiveStatus(record.status)).length
  }), [records]);

  const filteredRecords = useMemo(() => {
    if (stageFilter === "ALL") return records;
    if (stageFilter === "ACTIVE") return records.filter((record) => isActiveStatus(record.status));
    return records.filter((record) => record.status === stageFilter);
  }, [records, stageFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const pagedRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedRecord = records.find((record) => record.application_id === selectedId) ?? filteredRecords[0] ?? records[0] ?? null;

  useEffect(() => {
    setCurrentPage(1);
  }, [stageFilter]);

  useEffect(() => {
    if (filteredRecords.length === 0) return;
    if (!filteredRecords.some((record) => record.application_id === selectedId)) {
      setSelectedId(filteredRecords[0].application_id);
    }
  }, [filteredRecords, selectedId]);

  const urgentCount = records.filter((record) => record.deadline_status === "URGENT" || record.deadline_status === "SOON").length;
  const activeCount = counts.ACTIVE;
  const averageReadiness = records.length === 0
    ? 0
    : Math.round(records.reduce((sum, record) => sum + record.readiness_score, 0) / records.length);
  const readyDocumentCount = records.reduce(
    (sum, record) => sum + record.document_checklist.filter((item) => item.status === "DONE" || item.status === "VERIFIED").length,
    0
  );

  if (auth.isChecking) {
    return <AuthCheckingScreen title="기업지원 관리 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="기업지원 관리는 로그인 후 이용할 수 있습니다." />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="APPLICATION WORKSPACE"
        title="기업 지원 관리"
        description="커리어 플래너에서 넘긴 목표 공고를 지원 단계, 서류 준비도, 다음 액션까지 한 화면에서 관리합니다."
        actions={
          <>
            <LinkButton href="/jobs" variant="secondary">전체 공고</LinkButton>
            <LinkButton href="/jobs/recommendation">적합도 진단</LinkButton>
          </>
        }
      />

      <View className="lens-container gap-5 pb-10">
        <View className="flex-row flex-wrap gap-3">
          <MetricCard label="지원 후보" value={`${records.length}개`} helper="플래너/공고에서 생성" />
          <MetricCard label="평균 준비도" value={`${averageReadiness}점`} helper="전체 후보 평균" />
          <MetricCard label="마감 주의" value={`${urgentCount}개`} helper="긴급 또는 임박" />
          <MetricCard label="진행 중" value={`${activeCount}개`} helper="지원 완료/면접/종료" />
        </View>

        {isLoading && (
          <EmptyState title="지원 기록을 불러오는 중입니다." description="로그인한 사용자 기준으로 지원 워크스페이스를 확인하고 있습니다." />
        )}

        {errorMessage && (
          <EmptyState title="지원관리 데이터를 처리하지 못했습니다." description={errorMessage} />
        )}

        {!isLoading && records.length === 0 && !errorMessage && (
          <Card className="p-6">
            <Text className="text-lg font-semibold text-night">아직 지원 후보가 없습니다.</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-600">
              적합도 진단에서 커리어 플래너를 만들거나 전체 공고에서 목표 공고를 선택하면 지원관리로 넘길 수 있습니다.
            </Text>
            <View className="mt-5 flex-row flex-wrap gap-2">
              <LinkButton href="/jobs/recommendation">적합도 진단 시작</LinkButton>
              <LinkButton href="/jobs" variant="secondary">전체 공고 보기</LinkButton>
            </View>
          </Card>
        )}

        {records.length > 0 && (
          <View className="gap-5 xl:flex-row">
            <Card className="flex-1 p-5">
              <View className="gap-4 md:flex-row md:items-end md:justify-between">
                <View>
                  <Text className="lens-kicker">ROADMAP LIST</Text>
                  <Text className="mt-2 text-2xl font-semibold text-night">지원 후보 로드맵</Text>
                  <Text className="mt-1 text-sm leading-6 text-slate-600">
                    상태별로 후보를 좁혀 보고, 선택한 공고의 다음 액션을 바로 확인합니다.
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {stageFilters.map((filter) => {
                    const active = stageFilter === filter.key;
                    return (
                      <Pressable
                        key={filter.key}
                        onPress={() => setStageFilter(filter.key)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        className={`rounded-lg border px-3 py-2 ${active ? "border-night bg-night" : "border-line bg-white"}`}
                      >
                        <Text className={`text-xs font-semibold ${active ? "text-white" : "text-night"}`}>
                          {filter.label} {counts[filter.key]}
                        </Text>
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
                <View className="mt-5 gap-3">
                  {pagedRecords.map((record) => (
                    <ApplicationListCard
                      key={record.application_id}
                      record={record}
                      isSelected={selectedRecord?.application_id === record.application_id}
                      onSelect={() => setSelectedId(record.application_id)}
                    />
                  ))}
                  <Pagination currentPage={safePage} pageCount={pageCount} onPageChange={setCurrentPage} />
                </View>
              )}
            </Card>

            <View className="gap-5 xl:w-[380px]">
              <ApplicationActionPanel record={selectedRecord} readyDocumentCount={readyDocumentCount} />
              <EmploymentFlowGuide currentStep="applications" roadmapId={selectedRecord?.roadmap_id} />
            </View>
          </View>
        )}
      </View>
    </PageShell>
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
  const readyCount = record.document_checklist.filter((item) => item.status === "DONE" || item.status === "VERIFIED").length;

  return (
    <Card className={`p-4 ${isSelected ? "border-brand bg-[#f3faf8]" : ""}`}>
      <View className="gap-3 md:flex-row md:items-start md:justify-between">
        <View className="flex-1">
          <View className="flex-row flex-wrap gap-2">
            <Badge tone={deadlineTone(record.deadline_status)}>{deadlineLabel(record)}</Badge>
            <Badge tone={statusTone(record.status)}>{statusLabel(record.status)}</Badge>
          </View>
          <Text className="mt-3 text-sm font-semibold text-brand">{record.company_name}</Text>
          <Text className="mt-1 text-lg font-semibold leading-7 text-night">{record.job_title}</Text>
          <Text className="mt-2 text-sm leading-6 text-slate-600">
            {countryLabel(record.country)} · {workTypeLabel(record.work_type)} · {record.salary_range || "연봉 미기재"}
          </Text>
        </View>
        <View className="rounded-xl border border-line bg-white p-3 md:w-32">
          <Text className="text-xs font-semibold text-slate-500">준비도</Text>
          <Text className="mt-1 text-2xl font-semibold text-night">{record.readiness_score}점</Text>
          <Text className="mt-1 text-xs text-slate-500">서류 {readyCount}/{record.document_checklist.length}</Text>
        </View>
      </View>

      <View className="mt-4 gap-3">
        <ScoreBar label="지원 준비도" value={record.readiness_score} tone={scoreTone(record.readiness_score)} />
        <ScoreBar label="로드맵 완료율" value={record.roadmap_completion_rate} tone="brand" />
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button variant={isSelected ? "secondary" : "outline"} onPress={onSelect}>
          {isSelected ? "선택됨" : "요약 보기"}
        </Button>
        <LinkButton href={`/applications/${record.application_id}`} variant="secondary">워크스페이스</LinkButton>
        {record.roadmap_id && (
          <LinkButton href={`/planner/${record.roadmap_id}`} variant="secondary">플래너</LinkButton>
        )}
      </View>
    </Card>
  );
}

function ApplicationActionPanel({ record, readyDocumentCount }: { record: ApplicationRecord | null; readyDocumentCount: number }) {
  if (!record) {
    return (
      <Card className="p-5">
        <EmptyState title="선택한 공고가 없습니다." description="지원 후보 목록에서 공고를 선택하면 준비 상태를 확인할 수 있습니다." />
      </Card>
    );
  }

  const verifiedCount = record.document_checklist.filter((item) => item.status === "DONE" || item.status === "VERIFIED").length;

  return (
    <Card className="p-5">
      <Text className="lens-kicker">SELECTED ROADMAP</Text>
      <Text className="mt-3 text-xl font-semibold leading-7 text-night">{record.company_name}</Text>
      <Text className="mt-1 text-sm font-semibold text-slate-800">{record.job_title}</Text>
      <Text className="mt-2 text-sm leading-6 text-slate-600">
        {countryLabel(record.country)} · {workTypeLabel(record.work_type)} · {record.salary_range || "연봉 미기재"}
      </Text>

      <View className="mt-5 flex-row flex-wrap gap-3">
        <MetricCard label="준비도" value={`${record.readiness_score}점`} helper={statusLabel(record.status)} />
        <MetricCard label="서류 확인" value={`${verifiedCount}/${record.document_checklist.length}`} helper={`전체 후보 준비 서류 ${readyDocumentCount}개`} />
      </View>

      <View className="mt-5 gap-3">
        <ScoreBar label="서류 준비도" value={record.readiness_score} tone={scoreTone(record.readiness_score)} />
        <ScoreBar label="로드맵 완료율" value={record.roadmap_completion_rate} tone="brand" />
      </View>

      <View className="mt-5 rounded-xl border border-line bg-panel p-4">
        <Text className="text-xs font-semibold text-slate-500">다음 액션</Text>
        <Text className="mt-2 text-sm leading-6 text-night">{record.next_action || "다음 액션을 워크스페이스에서 정리하세요."}</Text>
      </View>

      <View className="mt-5 gap-2">
        {record.document_checklist.slice(0, 4).map((item) => (
          <View key={item.key} className="flex-row items-center justify-between gap-3 rounded-xl border border-line bg-white p-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-night">{item.label}</Text>
              <Text className="mt-1 text-xs leading-5 text-slate-500">{item.helper_text}</Text>
            </View>
            <Badge tone={documentTone(item.status)}>{documentLabel(item.status)}</Badge>
          </View>
        ))}
      </View>

      <View className="mt-5 gap-2">
        <LinkButton href={`/applications/${record.application_id}`}>지원 워크스페이스 열기</LinkButton>
        {record.roadmap_id && (
          <LinkButton href={`/planner/${record.roadmap_id}`} variant="secondary">커리어 플래너로 돌아가기</LinkButton>
        )}
        <LinkButton href="/roadmap/employment/documents" variant="secondary">문서 점검</LinkButton>
        {record.application_url ? (
          <Button variant="outline" onPress={() => openExternalUrl(record.application_url)}>
            공식 공고 보기
          </Button>
        ) : (
          <LinkButton href="/jobs" variant="secondary">공고 목록 보기</LinkButton>
        )}
      </View>
    </Card>
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
    <View className="mt-2 flex-row items-center justify-center gap-2">
      <Button variant="outline" disabled={currentPage === 1} onPress={() => onPageChange(currentPage - 1)}>
        이전
      </Button>
      <Text className="px-2 text-sm font-semibold text-night">{currentPage} / {pageCount}</Text>
      <Button variant="outline" disabled={currentPage === pageCount} onPress={() => onPageChange(currentPage + 1)}>
        다음
      </Button>
    </View>
  );
}

function openExternalUrl(url: string | null) {
  if (!url) return;
  Linking.openURL(url).catch(() => undefined);
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

function statusTone(status: ApplicationStatus): Tone {
  if (status === "APPLIED" || status === "INTERVIEW") return "success";
  if (status === "CLOSED") return "muted";
  if (status === "PREPARING_DOCUMENTS") return "warning";
  return "default";
}

function deadlineLabel(record: ApplicationRecord) {
  if (record.deadline_status === "ONGOING") return "상시/미기재";
  if (record.deadline_status === "EXPIRED") return "마감";
  if (record.days_until_deadline === 0) return "오늘 마감";
  if (record.days_until_deadline == null) return "D-?";
  return `D-${record.days_until_deadline}`;
}

function deadlineTone(status: ApplicationRecord["deadline_status"]): Tone {
  if (status === "URGENT" || status === "EXPIRED") return "risk";
  if (status === "SOON") return "warning";
  return "muted";
}

function scoreTone(score: number): Tone {
  if (score >= 80) return "success";
  if (score >= 65) return "brand";
  if (score >= 50) return "warning";
  return "risk";
}

function documentLabel(status: string) {
  if (status === "VERIFIED") return "검증";
  if (status === "DONE") return "완료";
  return "대기";
}

function documentTone(status: string): Tone {
  if (status === "VERIFIED") return "brand";
  if (status === "DONE") return "success";
  return "muted";
}
