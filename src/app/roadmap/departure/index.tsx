"use client";

import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, PageHeader, PageShell, TextInput, type Tone } from "@/components/ui";
import {
  fetchDeparturePlanFromRoadmap,
  generateDeparturePlan,
  generateDeparturePlanFromRoadmap,
  refreshDeparturePlanFromRoadmap,
  type DeparturePlan,
  type DeparturePlanRequest
} from "@/lib/departure";

const countryOptions = [
  { country: "일본", city: "도쿄", airport: "HND" },
  { country: "미국", city: "샌프란시스코", airport: "SFO" }
];

const defaultRequest: DeparturePlanRequest = {
  target_country: "일본",
  destination_city: "도쿄",
  origin_airport: "ICN",
  destination_airport: "HND",
  start_date: defaultStartDate(),
  arrival_buffer_days: 14,
  visa_status: "내정 후 회사 제출 서류 확인 필요",
  housing_status: "임시 숙소 미정"
};

type DepartureMilestone = DeparturePlan["milestones"][number];

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() + 90);
  return date.toISOString().slice(0, 10);
}

export default function DepartureRoadmapPage() {
  const params = useLocalSearchParams<{ roadmapId?: string | string[] }>();
  const auth = useRequiredAuth();
  const roadmapIdValue = Array.isArray(params.roadmapId) ? params.roadmapId[0] : params.roadmapId;
  const parsedRoadmapId = Number(roadmapIdValue ?? 0);
  const [form, setForm] = useState<DeparturePlanRequest>(defaultRequest);
  const [plan, setPlan] = useState<DeparturePlan | null>(null);
  const [linkedRoadmapId, setLinkedRoadmapId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (auth.isChecking || !auth.user) return;
    if (!parsedRoadmapId) return;

    setLinkedRoadmapId(parsedRoadmapId);
    setIsLoading(true);
    setErrorMessage(null);
    loadRoadmapPlan(parsedRoadmapId)
      .then(setPlan)
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "출국 로드맵을 생성하지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user, parsedRoadmapId]);

  const destinationLabel = useMemo(() => {
    return `${form.target_country} · ${form.destination_city} · ${form.destination_airport}`;
  }, [form.destination_airport, form.destination_city, form.target_country]);

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

  function selectCountry(country: (typeof countryOptions)[number]) {
    setForm((current) => ({
      ...current,
      target_country: country.country,
      destination_city: country.city,
      destination_airport: country.airport
    }));
  }

  function update<Key extends keyof DeparturePlanRequest>(key: Key, value: DeparturePlanRequest[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="DEPARTURE ROADMAP"
        title="출국로드맵"
        description="입사 예정일을 기준으로 출국 후보 기간, 입국 여유일, 항공 확인 기준, 준비 마일스톤을 정리합니다."
        actions={
          <>
            <LinkButton
              href={linkedRoadmapId ? `/roadmap/administration?roadmapId=${linkedRoadmapId}` : "/roadmap/administration"}
              variant="secondary"
            >
              행정로드맵
            </LinkButton>
            {linkedRoadmapId && (
              <Button variant="outline" onPress={refreshLinkedPlan} disabled={isRefreshing || isLoading} loading={isRefreshing}>
                최신 정보로 갱신
              </Button>
            )}
          </>
        }
      />

      <View className="lens-container gap-5 pb-10 xl:flex-row">
        <View className="gap-5 xl:w-[360px]">
          <Card className="p-5">
            <Text className="lens-kicker">TRAVEL INPUT</Text>
            <Text className="mt-3 text-2xl font-semibold text-night">출국 조건 입력</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-600">{destinationLabel}</Text>

            <View className="mt-5 gap-4">
              <View>
                <Text className="mb-2 text-sm font-semibold text-slate-700">목표 국가</Text>
                <View className="flex-row flex-wrap gap-2">
                  {countryOptions.map((option) => {
                    const active = form.target_country === option.country;
                    return (
                      <Pressable
                        key={option.country}
                        onPress={() => selectCountry(option)}
                        className={`rounded-lg border px-3 py-2 ${active ? "border-night bg-night" : "border-line bg-white"}`}
                      >
                        <Text className={`text-sm font-semibold ${active ? "text-white" : "text-night"}`}>{option.country}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <TextInput label="도착 도시" value={form.destination_city} onChangeText={(value) => update("destination_city", value)} />
              <View className="gap-3 sm:flex-row">
                <TextInput label="출발 공항" value={form.origin_airport} onChangeText={(value) => update("origin_airport", value.toUpperCase())} autoCapitalize="characters" />
                <TextInput label="도착 공항" value={form.destination_airport} onChangeText={(value) => update("destination_airport", value.toUpperCase())} autoCapitalize="characters" />
              </View>
              <TextInput label="입사 예정일" value={form.start_date} onChangeText={(value) => update("start_date", value)} placeholder="YYYY-MM-DD" />
              <TextInput
                label="입국 여유일"
                value={String(form.arrival_buffer_days)}
                onChangeText={(value) => update("arrival_buffer_days", Number(value) || 0)}
                keyboardType="number-pad"
              />
              <TextInput label="비자 상태" value={form.visa_status} onChangeText={(value) => update("visa_status", value)} />
              <TextInput label="숙소 상태" value={form.housing_status} onChangeText={(value) => update("housing_status", value)} />
              <Button disabled={isLoading} loading={isLoading} onPress={submitPlan}>
                출국 로드맵 생성
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

        <View className="flex-1 gap-5">
          {errorMessage && <EmptyState title="출국 로드맵 생성 실패" description={errorMessage} />}

          {!plan && !errorMessage && !isLoading && (
            <EmptyState
              title="입사 예정일 기준 출국 일정을 생성할 수 있습니다."
              description="도착 도시, 공항 코드, 입사 예정일, 비자/숙소 상태를 입력하면 출국 후보 기간과 준비 마일스톤을 계산합니다."
            />
          )}

          {plan && (
            <>
              <DepartureJourneyPanel plan={plan} linkedRoadmapId={linkedRoadmapId} />
              <View className="gap-5 xl:flex-row">
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
}

function DepartureJourneyPanel({ plan, linkedRoadmapId }: { plan: DeparturePlan; linkedRoadmapId: number | null }) {
  const isAiAssisted = plan.generation_mode.includes("AI");
  const updatedLabel = plan.updated_at
    ? `저장일 ${formatDateTime(plan.created_at ?? plan.updated_at)} · 최근 갱신 ${formatDateTime(plan.refreshed_at ?? plan.updated_at)}`
    : null;

  return (
    <Card className="p-5">
      <View className="gap-3 md:flex-row md:items-start md:justify-between">
        <View className="flex-1">
          <View className="flex-row flex-wrap gap-2">
            <Badge tone={isAiAssisted ? "brand" : "muted"}>{isAiAssisted ? "AI 보조" : "규칙 기반"}</Badge>
            <Badge tone={urgencyTone(plan.urgency_status)}>{urgencyLabel(plan.urgency_status)}</Badge>
            <Badge tone={flightDataTone(plan.flight_data_status)}>{flightDataLabel(plan.flight_data_status)}</Badge>
          </View>
          <Text className="mt-4 text-2xl font-semibold leading-8 text-night">
            {plan.origin_airport} → {plan.destination_airport} 출국 계획
          </Text>
          <Text className="mt-2 text-sm leading-6 text-slate-600">{plan.summary}</Text>
          {updatedLabel && <Text className="mt-2 text-xs font-semibold text-slate-500">{updatedLabel}</Text>}
        </View>
        <LinkButton
          href={linkedRoadmapId ? `/roadmap/administration?roadmapId=${linkedRoadmapId}` : "/roadmap/administration"}
          variant="secondary"
        >
          행정로드맵 확인
        </LinkButton>
      </View>

      <View className="mt-5 flex-row flex-wrap gap-3">
        <SummaryFact label="출국 후보" value={formatDateRange(plan.departure_window_start, plan.departure_window_end)} />
        <SummaryFact label="권장 입국" value={plan.recommended_arrival_date} />
        <SummaryFact label="입사 예정" value={plan.start_date} />
        <SummaryFact label="준비 D-day" value={dDayLabel(plan.days_until_departure_window)} helper={`${bufferDaysLabel(plan.recommended_arrival_date, plan.start_date)} 여유`} />
      </View>
    </Card>
  );
}

function FlightOfferDeck({ plan }: { plan: DeparturePlan }) {
  return (
    <Card className="flex-1 p-5">
      <View className="gap-3 sm:flex-row sm:items-start sm:justify-between">
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
        <View className="mt-5 gap-3">
          {plan.flight_offers.map((offer, index) => (
            <View key={`${offer.provider}-${offer.departure_at}-${index}`} className="rounded-xl border border-line bg-panel p-4">
              <View className="gap-4 md:flex-row md:items-center md:justify-between">
                <View className="flex-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="text-base font-semibold text-night">{offer.origin_code} → {offer.destination_code}</Text>
                    <Badge tone="muted">{offer.provider}</Badge>
                  </View>
                  <Text className="mt-2 text-xs leading-5 text-slate-500">
                    {formatDateTime(offer.departure_at)} 출발 · {formatDateTime(offer.arrival_at)} 도착
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-slate-600">
                    {offer.carrier_name || offer.carrier_code} {offer.flight_number} · {offer.duration || "소요시간 미기재"}
                  </Text>
                </View>
                <View className="rounded-xl bg-white px-4 py-3">
                  <Text className="text-xs font-semibold text-slate-500">예상 비용</Text>
                  <Text className="mt-1 text-lg font-semibold text-night">{offer.currency} {offer.total_price || "미기재"}</Text>
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
    </Card>
  );
}

function MilestoneJourney({ milestones }: { milestones: DepartureMilestone[] }) {
  return (
    <Card className="flex-1 p-5">
      <View className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <View>
          <Text className="lens-kicker">MILESTONES</Text>
          <Text className="mt-3 text-xl font-semibold text-night">준비 단계</Text>
        </View>
        <Badge tone="muted">{milestones.length}개 단계</Badge>
      </View>

      <View className="mt-5 gap-3">
        {milestones.map((milestone, index) => (
          <View key={`${milestone.phase}-${milestone.title}`} className="flex-row gap-3 rounded-xl border border-line bg-panel p-4">
            <View className={`h-8 w-8 items-center justify-center rounded-full ${milestoneMarkerClass(milestone.status)}`}>
              <Text className={`text-xs font-semibold ${milestone.status === "DONE" ? "text-slate-700" : "text-white"}`}>{index + 1}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="text-xs font-semibold uppercase text-brand">{milestone.phase}</Text>
                <Text className="text-xs font-semibold text-slate-500">기한 {milestone.due_date}</Text>
              </View>
              <Text className="mt-1 text-base font-semibold leading-6 text-night">{milestone.title}</Text>
              <Text className="mt-1 text-sm leading-6 text-slate-600">{milestone.description}</Text>
            </View>
            <Badge tone={milestoneTone(milestone.status)}>{milestoneLabel(milestone.status)}</Badge>
          </View>
        ))}
      </View>
    </Card>
  );
}

function SummaryFact({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <View className="rounded-xl border border-line bg-panel px-4 py-3">
      <Text className="text-xs font-semibold text-slate-500">{label}</Text>
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

function urgencyTone(status: string): Tone {
  if (status === "ON_TRACK") return "success";
  if (status === "SOON") return "warning";
  return "risk";
}

function milestoneLabel(status: string) {
  if (status === "DONE") return "기한 지남";
  if (status === "URGENT") return "긴급";
  return "예정";
}

function milestoneTone(status: string): Tone {
  if (status === "DONE") return "muted";
  if (status === "URGENT") return "risk";
  return "brand";
}

function milestoneMarkerClass(status: string) {
  if (status === "DONE") return "bg-slate-200";
  if (status === "URGENT") return "bg-coral";
  return "bg-brand";
}

function flightDataLabel(status: string) {
  if (status === "LIVE_DUFFEL") return "Duffel 실시간 후보";
  if (status === "LIVE_AMADEUS") return "Amadeus 실시간 후보";
  if (status === "NO_RESULTS_OR_FAILED") return "API 결과 없음";
  return "API 미설정";
}

function flightDataTone(status: string): Tone {
  if (status === "LIVE_DUFFEL" || status === "LIVE_AMADEUS") return "success";
  if (status === "NO_RESULTS_OR_FAILED") return "warning";
  return "muted";
}

function isMissingSavedPlan(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("not found") || message.includes("404");
}

function formatDateTime(value?: string | null) {
  if (!value) return "미기재";
  return value.replace("T", " ");
}
