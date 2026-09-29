import { View, Text, Pressable } from 'react-native';
"use client";

import { useEffect, useState } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, PageHeader, PageShell, SelectInput, TextInput } from "@/components/ui";
import {
  fetchDeparturePlanFromRoadmap,
  generateDeparturePlan,
  generateDeparturePlanFromRoadmap,
  refreshDeparturePlanFromRoadmap,
  type DeparturePlan,
  type DeparturePlanRequest
} from "@/lib/departure";

const defaultRequest: DeparturePlanRequest = {
  target_country: "일본",
  destination_city: "도쿄",
  origin_airport: "ICN",
  destination_airport: "HND",
  start_date: "2026-06-20",
  arrival_buffer_days: 14,
  visa_status: "내정 후 회사 제출 서류 확인 필요",
  housing_status: "임시 숙소 미정"
};

type DepartureMilestone = DeparturePlan["milestones"][number];

export default function DepartureRoadmapPage() {
  const auth = useRequiredAuth();
  const [form, setForm] = useState<DeparturePlanRequest>(defaultRequest);
  const [plan, setPlan] = useState<DeparturePlan | null>(null);
  const [linkedRoadmapId, setLinkedRoadmapId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (auth.isChecking || !auth.user) return;
    const roadmapId = Number(new URLSearchParams(window.location.search).get("roadmapId") ?? 0);
    if (!roadmapId) return;
    setLinkedRoadmapId(roadmapId);
    setIsLoading(true);
    setErrorMessage(null);
    loadRoadmapPlan(roadmapId)
      .then(setPlan)
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "출국 로드맵을 생성하지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  if (auth.isChecking) {
    return <AuthCheckingScreen title="출국로드맵 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="출국로드맵은 로그인 후 이용할 수 있습니다." />;
  }

  async function loadRoadmapPlan(roadmapId: number) {
    try {
      return await fetchDeparturePlanFromRoadmap(roadmapId);
    } catch (error) {
      if (isMissingSavedPlan(error)) {
        return generateDeparturePlanFromRoadmap(roadmapId);
      }
      throw error;
    }
  }

  async function submitPlan() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await generateDeparturePlan(form);
      setPlan(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "출국 로드맵을 생성하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshLinkedPlan() {
    if (!linkedRoadmapId) return;
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      setPlan(await refreshDeparturePlanFromRoadmap(linkedRoadmapId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "출국 로드맵을 갱신하지 못했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="DEPARTURE ROADMAP"
        title="출국로드맵"
        actions={
          <>
            <LinkButton
              href={linkedRoadmapId ? `/roadmap/administration?roadmapId=${linkedRoadmapId}` : "/roadmap/administration"}
              className="min-w-[132px] whitespace-nowrap"
            >
              행정로드맵 확인
            </LinkButton>
            {linkedRoadmapId && (
              <Button  variant="secondary" onPress={refreshLinkedPlan} disabled={isRefreshing || isLoading}>
                {isRefreshing ? "갱신 중" : "최신 정보로 갱신"}
              </Button>
            )}
          </>
        }
      />

      <View>
        <View>
          <Card className="p-5">
            <Text className="lens-kicker">TRAVEL INPUT</Text>
            <Text className="mt-3 text-2xl font-semibold text-night">출국 조건 입력</Text>
            <View className="mt-5 space-y-4">
              <SelectInput label="목표 국가" value={form.target_country} onChange={(event) => update("target_country", event.target.value)}>
                <option value="일본">일본</option>
                <option value="미국">미국</option>
              </SelectInput>
              <TextInput label="도착 도시" value={form.destination_city} onChange={(event) => update("destination_city", event.target.value)} />
              <View className="flex-row gap-3 sm:flex-cols-2 lg:flex-cols-1 xl:flex-cols-2">
                <TextInput label="출발 공항" helper="IATA" value={form.origin_airport} onChange={(event) => update("origin_airport", event.target.value.toUpperCase())} />
                <TextInput label="도착 공항" helper="IATA" value={form.destination_airport} onChange={(event) => update("destination_airport", event.target.value.toUpperCase())} />
              </View>
              <TextInput label="입사 예정일" type="date" value={form.start_date} onChange={(event) => update("start_date", event.target.value)} />
              <TextInput
                label="입국 여유일"
                helper="입사 며칠 전 도착할지"
                type="number"
                min={3}
                max={45}
                value={form.arrival_buffer_days}
                onChange={(event) => update("arrival_buffer_days", Number(event.target.value))}
              />
              <TextInput label="비자 상태" value={form.visa_status} onChange={(event) => update("visa_status", event.target.value)} />
              <TextInput label="숙소 상태" value={form.housing_status} onChange={(event) => update("housing_status", event.target.value)} />
              <Button  disabled={isLoading} onPress={submitPlan} className="w-full">
                {isLoading ? "로드맵 생성 중" : "출국 로드맵 생성"}
              </Button>
            </View>
          </Card>

          <Card className="p-5">
            <Text className="lens-kicker">FLIGHT DATA POLICY</Text>
            <Text className="mt-3 text-xl font-semibold text-night">항공 데이터 연동 방향</Text>
            <Text className="mt-3 text-sm leading-6 text-slate-600">
              항공사/OTA 사이트를 크롤링하지 않고, 승인된 Flight API 또는 사용자가 직접 확인한 항공편 정보를 입력하는 구조로 확장합니다.
            </Text>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <Badge tone="brand">API-ready</Badge>
              <Badge tone="muted">No scraping</Badge>
              <Badge tone="warning">공식 확인 필요</Badge>
            </View>
          </Card>
        </View>

        <View>
          {errorMessage && <EmptyState title="출국 로드맵 생성 실패" description={errorMessage} />}

          {!plan && !errorMessage && (
            <EmptyState
              title="입사 예정일 기준 출국 일정을 생성할 수 있습니다."
              description="도착 도시, 공항 코드, 입사 예정일, 비자/숙소 상태를 입력하면 출국 후보 기간과 준비 마일스톤을 계산합니다."
            />
          )}

          {plan && (
            <>
              <DepartureJourneyPanel plan={plan} linkedRoadmapId={linkedRoadmapId} />

              <View className="flex-row gap-5 xl:flex-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                <FlightOfferDeck plan={plan} />
                <MilestoneJourney milestones={plan.milestones} />
              </View>

              <Card className="p-5">
                <Text className="text-xs leading-5 text-slate-500">{plan.disclaimer}</Text>
              </Card>
            </>
          )}
        </View>
      </View>
    </PageShell>
  );

  function update<Key extends keyof DeparturePlanRequest>(key: Key, value: DeparturePlanRequest[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}

function DepartureJourneyPanel({ plan, linkedRoadmapId }: { plan: DeparturePlan; linkedRoadmapId: number | null }) {
  const isAiAssisted = plan.generation_mode.includes("AI");
  const updatedLabel = plan.updated_at
    ? `저장일 ${formatDateTime(plan.created_at ?? plan.updated_at)} · 최근 갱신 ${formatDateTime(plan.refreshed_at ?? plan.updated_at)}`
    : null;

  return (
    <View>
      <View className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <View>
          <View className="flex-row flex-wrap gap-2">
            <Badge tone={isAiAssisted ? "brand" : "muted"}>{isAiAssisted ? "AI 보조" : "규칙 기반"}</Badge>
            <Badge tone={urgencyTone(plan.urgency_status)}>{urgencyLabel(plan.urgency_status)}</Badge>
            <Badge tone={flightDataTone(plan.flight_data_status)}>{flightDataLabel(plan.flight_data_status)}</Badge>
          </View>
          <Text className="mt-4 text-2xl font-semibold leading-8 text-night">
            <Text aria-hidden="true">✈️</Text> {plan.origin_airport} → {plan.destination_airport} 출국 계획
          </Text>
          <Text className="mt-2 text-sm leading-6 text-slate-600">{plan.summary}</Text>
          {updatedLabel && <Text className="mt-2 text-xs font-semibold text-slate-500">{updatedLabel}</Text>}
        </View>
        <LinkButton
          href={linkedRoadmapId ? `/roadmap/administration?roadmapId=${linkedRoadmapId}` : "/roadmap/administration"}
          variant="secondary"
          className="shrink-0 whitespace-nowrap"
        >
          행정로드맵 확인
        </LinkButton>
      </View>

      <View className="mt-5 flex-row gap-3 sm:flex-cols-2 xl:flex-cols-4">
        <SummaryFact label="출국 후보" value={formatDateRange(plan.departure_window_start, plan.departure_window_end)} />
        <SummaryFact label="권장 입국" value={plan.recommended_arrival_date} />
        <SummaryFact label="입사 예정" value={plan.start_date} />
        <SummaryFact label="준비 D-day" value={dDayLabel(plan.days_until_departure_window)} helper={`${bufferDaysLabel(plan.recommended_arrival_date, plan.start_date)} 여유`} />
      </View>
    </View>
  );
}

function FlightOfferDeck({ plan }: { plan: DeparturePlan }) {
  return (
    <View>
      <View className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <View>
          <Text className="lens-kicker">FLIGHT</Text>
          <Text className="mt-3 text-xl font-semibold text-night">항공편 확인</Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          <Badge tone={flightDataTone(plan.flight_data_status)}>{flightDataLabel(plan.flight_data_status)}</Badge>
          {plan.flight_offers.length > 0 && <Badge tone="brand">{plan.flight_offers.length}개 후보</Badge>}
        </View>
      </View>

      <Text className="mt-4 text-sm leading-6 text-slate-700">{plan.flight_search_note}</Text>

      {plan.flight_offers.length > 0 ? (
        <View className="mt-5 space-y-3">
          {plan.flight_offers.map((offer, index) => (
            <View key={`${offer.provider}-${offer.departure_at}-${index}`} className="rounded-xl border border-line bg-panel p-4">
              <View className="flex-row gap-4 md:flex-cols-[minmax(0,1fr)_auto] md:items-center">
                <View className="min-w-0">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="text-base font-semibold text-night">
                      {offer.origin_code} → {offer.destination_code}
                    </Text>
                    <Badge tone="muted">{offer.provider}</Badge>
                  </View>
                  <Text className="mt-2 text-xs leading-5 text-slate-500">
                    {formatDateTime(offer.departure_at)} 출발 · {formatDateTime(offer.arrival_at)} 도착
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-slate-600">
                    {offer.carrier_name || offer.carrier_code} {offer.flight_number} · {offer.duration || "소요시간 미기재"}
                  </Text>
                </View>
                <View className="rounded-2xl bg-white px-4 py-3 text-left shadow-sm md:text-right">
                  <Text className="text-xs font-bold text-slate-500">예상 비용</Text>
                  <Text className="mt-1 text-lg font-semibold text-night">
                    {offer.currency} {offer.total_price || "미기재"}
                  </Text>
                  {offer.bookable_seats !== null && <Text className="mt-1 text-xs text-slate-500">좌석 {offer.bookable_seats}</Text>}
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="mt-5 rounded-xl border border-dashed border-line bg-panel p-4">
          <Text className="text-sm font-semibold text-night">실시간 후보 없음</Text>
          <Text className="mt-1 text-xs leading-5 text-slate-500">아래 API 연동 또는 공식 항공사/OTA에서 최종 확인합니다.</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {plan.flight_api_providers.slice(0, 3).map((provider) => (
              <Badge key={provider.provider} tone="muted">{provider.provider}</Badge>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function MilestoneJourney({ milestones }: { milestones: DepartureMilestone[] }) {
  return (
    <View>
      <View className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <View>
          <Text className="lens-kicker">MILESTONES</Text>
          <Text className="mt-3 text-xl font-semibold text-night">준비 단계</Text>
        </View>
        <Badge tone="muted">{milestones.length}개 단계</Badge>
      </View>

      <View className="mt-5 divide-y divide-line">
        {milestones.map((milestone, index) => (
          <View>
            <View className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${milestoneMarkerClass(milestone.status)}`}>
              {index + 1}
            </View>
            <View className="min-w-0">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="text-xs font-bold uppercase text-brand">{milestone.phase}</Text>
                <Text className="text-xs font-semibold text-slate-500">기한 {milestone.due_date}</Text>
              </View>
              <Text className="mt-1 text-base font-semibold leading-6 text-night">{milestone.title}</Text>
              <Text className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{milestone.description}</Text>
            </View>
            <Badge tone={milestoneTone(milestone.status)} className="w-fit shrink-0">
              {milestoneLabel(milestone.status)}
            </Badge>
          </View>
        ))}
      </View>
    </View>
  );
}

function SummaryFact({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <View className="rounded-xl border border-line bg-panel px-4 py-3">
      <Text className="text-xs font-bold text-slate-500">{label}</Text>
      <Text className="mt-1 text-base font-semibold text-night">{value}</Text>
      {helper && <Text className="mt-1 text-xs leading-5 text-slate-500">{helper}</Text>}
    </View>
  );
}

function dDayLabel(days: number) {
  if (days < 0) return "기간 지남";
  if (days === 0) return "오늘";
  return `D-${days}`;
}

function bufferDaysLabel(arrivalDate: string, startDate: string) {
  const days = daysBetween(arrivalDate, startDate);
  if (days === null) return "일정 확인";
  if (days < 0) return "날짜 확인";
  return `${days}일`;
}

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function formatShortDate(value: string) {
  if (!value) return "미정";
  const [year, month, day] = value.split("T")[0].split("-");
  if (!year || !month || !day) return value;
  return `${Number(month)}.${Number(day)}`;
}

function formatDateRange(start: string, end: string) {
  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function urgencyLabel(status: string) {
  if (status === "ON_TRACK") return "일정 여유";
  if (status === "SOON") return "곧 준비";
  if (status === "URGENT") return "긴급";
  return "지연";
}

function urgencyTone(status: string) {
  if (status === "ON_TRACK") return "success";
  if (status === "SOON") return "warning";
  return "risk";
}

function milestoneLabel(status: string) {
  if (status === "DONE") return "기한 지남";
  if (status === "URGENT") return "긴급";
  return "예정";
}

function milestoneTone(status: string) {
  if (status === "DONE") return "muted";
  if (status === "URGENT") return "risk";
  return "brand";
}

function milestoneMarkerClass(status: string) {
  if (status === "DONE") return "bg-slate-200 text-slate-700";
  if (status === "URGENT") return "bg-red-600 text-white";
  return "bg-brand text-white";
}

function flightDataLabel(status: string) {
  if (status === "LIVE_DUFFEL") return "Duffel 실시간 후보";
  if (status === "LIVE_AMADEUS") return "Amadeus 실시간 후보";
  if (status === "NO_RESULTS_OR_FAILED") return "API 결과 없음";
  return "API 미설정";
}

function flightDataTone(status: string) {
  if (status === "LIVE_DUFFEL" || status === "LIVE_AMADEUS") return "success";
  if (status === "NO_RESULTS_OR_FAILED") return "warning";
  return "muted";
}

function isMissingSavedPlan(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("not found") || message.includes("404");
}

function formatDateTime(value: string) {
  if (!value) return "미기재";
  return value.replace("T", " ");
}
