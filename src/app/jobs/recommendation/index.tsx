import { View, Text, Pressable } from 'react-native';
"use client";

import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, MetricCard, PageShell } from "@/components/ui";
import type { AuthUser } from "@/lib/auth";
import {
  demoProfile,
  diagnoseStoredProfile,
  fetchUserProfile,
  type JobRecommendation,
  type RecommendationResponse,
  type UserProfileRequest
} from "@/lib/recommendation";
import { createPlannerRoadmap } from "@/lib/planner";
import { isMembershipLimitMessage } from "@/lib/membership";
import { countryLabel, languageLevelLabel } from "@/lib/display-labels";

const MAX_VISIBLE_RECOMMENDATIONS = 5;
const HORIZONTAL_BAR_COLOR = "#2f73d8";
const DISTRIBUTION_BAR_COLOR = "#9bb7ee";
const SCORE_RING_COLOR = "#168f93";

export default function RecommendationPage() {
  const router = useRouter();
  const auth = useRequiredAuth();
  const [profile, setProfile] = useState<UserProfileRequest>(demoProfile);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingPlannerId, setCreatingPlannerId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);

  const displayedRecommendations = useMemo(
    () => result?.recommendations.slice(0, MAX_VISIBLE_RECOMMENDATIONS) ?? [],
    [result]
  );

  const selectedRecommendation = useMemo(() => {
    if (!displayedRecommendations.length) return null;
    return displayedRecommendations.find((item) => item.job_id === selectedJobId) ?? displayedRecommendations[0];
  }, [displayedRecommendations, selectedJobId]);

  useEffect(() => {
    if (auth.isChecking || !auth.user) return;

    const activeUser = auth.user;
    setUser(activeUser);

    fetchUserProfile(activeUser.user_id)
      .then((storedProfile) => {
        setProfileMissing(false);
        setProfile({
          ...demoProfile,
          ...storedProfile,
          display_name: storedProfile.display_name,
          email: activeUser.email
        });
      })
      .catch((error) => {
        if (isProfileMissingError(error)) {
          setProfileMissing(true);
        } else {
          setErrorMessage(error instanceof Error ? error.message : "프로필 정보를 불러오지 못했습니다.");
        }
      });
  }, [auth.isChecking, auth.user]);

  if (auth.isChecking) {
    return <AuthCheckingScreen title="적합도 진단 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="적합도 진단은 로그인이 필요합니다." />;
  }

  async function runDiagnosis() {
    const activeUser = user ?? auth.user;
    if (!activeUser) return;

    if (profileMissing) {
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await diagnoseStoredProfile(activeUser.user_id);
      setResult(response);
      setSelectedJobId(response.recommendations[0]?.job_id ?? null);
    } catch (error) {
      if (isProfileMissingError(error)) {
        setProfileMissing(true);
        setResult(null);
      } else {
        setErrorMessage(error instanceof Error ? error.message : "적합도 진단 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function createPlanner(diagnosisId: number) {
    setCreatingPlannerId(diagnosisId);
    setErrorMessage(null);

    try {
      const roadmap = await createPlannerRoadmap(diagnosisId);
      router.push(`/planner/${roadmap.roadmap_id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "커리어 플래너 생성 중 오류가 발생했습니다.");
    } finally {
      setCreatingPlannerId(null);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <TopPageIntro />

      <View>
        <View className="mx-auto w-full max-w-[1680px]">
          <View className="flex w-full items-start gap-4 xl:flex-cols-[340px_minmax(0,1fr)_340px]">
            <View>
              <ProfileCard profile={profile} user={user} />
            </View>

            <View className="min-w-0 xl:col-span-2">
              <SummaryBanner
                result={result}
                recommendations={displayedRecommendations}
                isLoading={isLoading}
                errorMessage={errorMessage}
                profileMissing={profileMissing}
                onRun={runDiagnosis}
              />
            </View>

            <View>
              <ResultsHeader count={displayedRecommendations.length} hasResult={!!result} />

              {isLoading && <LoadingState />}

              {!isLoading && !result && !profileMissing && (
                <EmptyState
                  title="아직 진단 결과가 없습니다."
                  description="적합도 진단을 실행하면 상위 공고 5건과 세부 점수를 비교하기 쉬운 형태로 정리해드립니다."
                  action={
                    <Button  onPress={runDiagnosis}>
                      적합도 진단 실행
                    </Button>
                  }
                />
              )}

              {!isLoading && result && (
                <>
                  {displayedRecommendations.map((recommendation, index) => (
                    <RecommendationCard
                      key={`${recommendation.diagnosis_id}-${recommendation.job_id}`}
                      recommendation={recommendation}
                      rank={index + 1}
                      selected={selectedRecommendation?.job_id === recommendation.job_id}
                      onSelect={() => setSelectedJobId(recommendation.job_id)}
                      onCreatePlanner={() => createPlanner(recommendation.diagnosis_id)}
                      isCreatingPlanner={creatingPlannerId === recommendation.diagnosis_id}
                    />
                  ))}
                  {displayedRecommendations.length === 0 && <NoCandidateState />}
                </>
              )}
            </View>

            <ComparisonPanel recommendation={selectedRecommendation} recommendations={displayedRecommendations} />
          </View>
        </View>
      </View>
    </PageShell>
  );
}

function ResultsHeader({ count, hasResult }: { count: number; hasResult: boolean }) {
  return (
    <View className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.04)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <View>
        <Text className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ranking Overview</Text>
        <Text className="mt-1 text-xl font-semibold tracking-tight text-slate-950">상위 5개 공고 비교</Text>
      </View>
      <View className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <Text className="font-medium text-slate-700">정렬 기준</Text>
        <Text className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900 shadow-sm">적합도 높은 순</Text>
        <Text className="text-slate-400">|</Text>
        <Text>{hasResult ? `${count}개 표시` : "진단 후 표시"}</Text>
      </View>
    </View>
  );
}

function TopPageIntro() {
  return (
    <View className="border-b border-slate-200 bg-white px-2 py-6 sm:px-3 lg:px-4">
      <View className="mx-auto w-full max-w-[1680px] px-5">
        <Text className="flex-row items-center border border-slate-950 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-950">
          Recommendation Dashboard
        </Text>
        <Text className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">적합도 진단 서비스</Text>
        <Text className="mt-2 text-sm leading-6 text-slate-600">
          저장된 프로필을 기준으로 추천 공고의 적합도와 보완 포인트를 한 번에 비교할 수 있습니다.
        </Text>
      </View>
    </View>
  );
}

function ProfileCard({ profile, user }: { profile: UserProfileRequest; user: AuthUser | null }) {
  const priorities = priorityLabels(profile);

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_46px_rgba(15,23,42,0.07)]">
      <View className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5">
        <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Profile</Text>
        <Text className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          {profile.display_name || user?.display_name || "사용자 프로필"}
        </Text>
        <Text className="mt-1 text-sm text-slate-500">{user?.email || profile.email}</Text>
      </View>

      <View className="space-y-4 p-5">
        <dl className="flex-row gap-2 gap-2.5">
          <MetricCard label="희망 국가" value={countryLabel(profile.target_country)} />
          <MetricCard label="직무 분야" value={profile.target_job_family} />
          <MetricCard label="총 경력" value={`${profile.experience_years ?? 0}년`} />
          <MetricCard label="언어" value={languageLevelLabel(profile.language_level)} />
        </dl>

        <View>
          <Text className="text-sm font-semibold text-slate-900">우선순위</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {priorities.map((priority) => (
              <Badge key={priority} tone="success">
                {priority}
              </Badge>
            ))}
            {priorities.length === 0 && <Badge tone="muted">기본 기준 적용</Badge>}
          </View>
        </View>

        <View>
          <Text className="text-sm font-semibold text-slate-900">기술 스택</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {profile.tech_stack.slice(0, 8).map((tech) => (
              <Badge key={tech} tone="muted">
                {tech}
              </Badge>
            ))}
            {profile.tech_stack.length === 0 && <Badge tone="muted">등록된 기술 없음</Badge>}
          </View>
        </View>

        <LinkButton href="/mypage" variant="secondary" className="w-full rounded-xl border-slate-200">
          프로필 수정
        </LinkButton>
      </View>
    </Card>
  );
}

function SummaryBanner({
  result,
  recommendations,
  isLoading,
  errorMessage,
  profileMissing,
  onRun
}: {
  result: RecommendationResponse | null;
  recommendations: JobRecommendation[];
  isLoading: boolean;
  errorMessage: string | null;
  profileMissing: boolean;
  onRun: () => void;
}) {
  if (profileMissing) {
    return (
      <EmptyState
        title="해외취업 프로필 등록이 필요합니다."
        description="마이페이지에서 희망 국가, 직무, 경력, 언어와 기술 스택을 입력하면 적합도 진단을 시작할 수 있습니다."
        action={<LinkButton href="/mypage">프로필 등록하러 가기</LinkButton>}
      />
    );
  }

  if (errorMessage) {
    return (
      <View role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
        <View className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Text>{errorMessage}</Text>
          {isMembershipLimitMessage(errorMessage) && <LinkButton href="/membership">Pro 멤버십 보기</LinkButton>}
        </View>
      </View>
    );
  }

  const topScore = recommendations[0]?.score_breakdown.total_score ?? 0;
  const averageTotalScore = averageScore(recommendations.map((item) => item.score_breakdown.total_score));

  return (
    <Card className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_18px_48px_rgba(20,184,166,0.08)]">
      <View className="border-l-4 border-l-emerald-100 bg-[linear-gradient(90deg,#eefcf8_0%,#ffffff_50%,#f8fbff_100%)] px-4 py-4 sm:px-5">
        <View className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <View className="max-w-3xl">
            <Text className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">Diagnosis Result</Text>
            <Text className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {isLoading ? "적합도 진단을 분석하고 있어요" : "적합도 진단 결과"}
            </Text>
            <Text className="mt-2 max-w-2xl text-xs leading-5 text-slate-600">
              {result
                ? `분석된 공고 ${result.returned_recommendation_count}건 중 상위 ${Math.min(
                    recommendations.length,
                    MAX_VISIBLE_RECOMMENDATIONS
                  )}개를 카드 형태로 정리했습니다. 세부 점수와 보완 포인트를 한 화면에서 빠르게 비교할 수 있습니다.`
                : "저장된 프로필을 기준으로 추천 공고의 적합도와 준비 상태를 분석해, 비교하기 쉬운 카드형 대시보드로 보여드립니다."}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2 lg:justify-end">
            <LinkButton href="/mypage" variant="secondary" className="rounded-lg border-slate-200 px-4 py-2 text-xs">
              프로필 확인
            </LinkButton>
            <Button  onPress={onRun} disabled={isLoading} className="rounded-lg px-4 py-2 text-xs">
              {isLoading ? "진단 중..." : "적합도 진단 실행"}
            </Button>
          </View>
        </View>
      </View>

      <View className="flex-row gap-2 border-t-4 border-emerald-50 bg-[linear-gradient(90deg,#eefcf8_0%,#ffffff_56%,#f8fbff_100%)] px-4 py-3 sm:flex-cols-2 xl:flex-cols-4">
        <SummaryStatCard label="분석 공고 수" value={String(result?.total_candidate_count ?? 0)} helper="전체 후보 기준" />
        <SummaryStatCard label="표시 공고 수" value={String(recommendations.length)} helper="상위 적합도 5건" />
        <SummaryStatCard label="최고 적합도" value={`${topScore}%`} helper="가장 높은 점수" />
        <SummaryStatCard label="평균 적합도" value={`${averageTotalScore}%`} helper="표시된 공고 평균" />
      </View>
    </Card>
  );
}

function RecommendationCard({
  recommendation,
  rank,
  selected,
  onSelect,
  onCreatePlanner,
  isCreatingPlanner
}: {
  recommendation: JobRecommendation;
  rank: number;
  selected: boolean;
  onSelect: () => void;
  onCreatePlanner: () => void;
  isCreatingPlanner: boolean;
}) {
  const detailMetrics = detailMetricsForCard(recommendation);
  const totalScore = clampScore(recommendation.score_breakdown.total_score);

  return (
    <Card
      className={`overflow-hidden rounded-2xl border bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition ${
        selected
          ? "border-teal-300 ring-1 ring-teal-200"
          : "border-slate-200/80 hover:border-slate-300 hover:shadow-[0_20px_48px_rgba(15,23,42,0.07)]"
      }`}
    >
      <View className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="flex-row items-center h-6 min-w-6 items-center justify-center rounded-full bg-slate-950 px-2 text-xs font-semibold text-white">
              {rank}
            </Text>
            <Badge tone={gradeTone(recommendation.recommendation_grade)}>등급 {recommendation.recommendation_grade}</Badge>
            <Badge tone={readinessTone(recommendation.readiness_status)}>{recommendation.readiness_label}</Badge>
          </View>

          <View className="mt-4">
            <Text className="text-lg font-semibold tracking-tight text-slate-950">{recommendation.job_title}</Text>
            <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <Text className="font-medium text-slate-700">{recommendation.company_name}</Text>
              <Text>{countryLabel(recommendation.country)}</Text>
            </View>
          </View>

          <View className="mt-4 flex-row gap-3 sm:flex-cols-3">
            <MiniInfoCard label="추천 이유" value={recommendation.recommendation_summary} />
            <MiniInfoCard
              label="보완 항목"
              value={recommendation.missing_items.length > 0 ? recommendation.missing_items.slice(0, 3).join(", ") : "즉시 지원 가능"}
            />
            <MiniInfoCard label="비교 기준" value={recommendation.pattern_title || recommendation.pattern_ref || "프로필 기준 분석"} />
          </View>
        </View>

        <View className="flex shrink-0 flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 lg:w-[124px] lg:flex-col lg:items-center">
          <ScoreRing score={totalScore} />
          <View className="lg:text-center">
            <Text className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">Overall Score</Text>
            <Text className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{totalScore}%</Text>
            <Text className="mt-1 text-xs font-medium text-teal-700">{recommendation.readiness_label}</Text>
          </View>
        </View>
      </View>

      <View className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-sm font-semibold text-slate-900">비교 지표</Text>
          <Text className="text-xs font-medium text-slate-500">우선순위 기준 세부 점수</Text>
        </View>
        <View className="mt-3 flex-row gap-2 [flex-template-columns:repeat(auto-fit,minmax(132px,1fr))]">
          {detailMetrics.map((metric) => (
            <HorizontalMetricBar key={metric.label} label={metric.label} score={metric.score} />
          ))}
        </View>
      </View>

      <View className="mt-4 flex flex-col items-stretch justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
        <Button  variant="secondary" onPress={onSelect} className="w-full rounded-lg border-slate-200 py-2 text-xs sm:w-[190px]">
          {selected ? "선택됨" : "상세 비교"}
        </Button>
        <Button  onPress={onCreatePlanner} disabled={isCreatingPlanner} className="w-full rounded-lg py-2 text-xs sm:w-[230px]">
          {isCreatingPlanner ? "생성 중..." : "커리어 플래너 생성"}
        </Button>
      </View>
    </Card>
  );
}

function ComparisonPanel({
  recommendation,
  recommendations
}: {
  recommendation: JobRecommendation | null;
  recommendations: JobRecommendation[];
}) {
  const distributionMax = Math.max(...recommendations.map((item) => item.score_breakdown.total_score), 1);
  const averages = aggregateCategoryAverages(recommendations);

  return (
    <View>
      <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <View className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4">
          <Text className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Summary</Text>
          <Text className="mt-2 text-xl font-semibold tracking-tight text-slate-950">전체 요약</Text>
          <Text className="mt-2 text-sm leading-6 text-slate-500">상위 5개 공고 기준으로 적합도 분포와 평균 세부 점수를 정리했습니다.</Text>
        </View>

        <View className="space-y-4 p-4">
          <View className="flex-row gap-2 gap-2">
            <SummaryMiniStat label="최고 적합도" value={`${recommendations[0]?.score_breakdown.total_score ?? 0}%`} />
            <SummaryMiniStat label="평균 적합도" value={`${averageScore(recommendations.map((item) => item.score_breakdown.total_score))}%`} />
            <SummaryMiniStat label="평균 보완" value={`${averageScore(recommendations.map((item) => item.missing_items.length))}개`} />
          </View>

          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-slate-900">적합도 분포</Text>
              <Text className="text-xs text-slate-500">Top 5</Text>
            </View>
            <View className="mt-4 flex-row items-end gap-3">
              {recommendations.map((item, index) => {
                const score = clampScore(item.score_breakdown.total_score);
                const height = `${Math.max((score / distributionMax) * 100, 14)}%`;
                return (
                  <View key={`${item.job_id}-distribution`} className="flex flex-1 flex-col items-center gap-2">
                    <Text className="text-xs font-semibold text-slate-500">{score}%</Text>
                    <View className="flex h-24 w-full items-end rounded-full bg-slate-100 px-2 py-2">
                      <View className="w-full rounded-full" style={{ height, backgroundColor: DISTRIBUTION_BAR_COLOR }} />
                    </View>
                    <Text className="text-xs font-medium text-slate-500">{index + 1}위</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View>
            <Text className="text-sm font-semibold text-slate-900">항목별 평균 점수</Text>
            <View className="mt-4 space-y-3">
              {averages.map((item) => (
                <BlueScoreBar key={item.label} label={item.label} value={item.value} />
              ))}
            </View>
          </View>
        </View>
      </Card>

      <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <View className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4">
          <Text className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Selected Analysis</Text>
          <Text className="mt-2 text-xl font-semibold tracking-tight text-slate-950">선택 공고 분석</Text>
          {recommendation ? (
            <>
              <Text className="mt-3 text-base font-semibold text-slate-900">{recommendation.job_title}</Text>
              <Text className="mt-1 text-sm text-slate-500">{recommendation.company_name}</Text>
            </>
          ) : (
            <Text className="mt-3 text-sm leading-6 text-slate-500">카드를 선택하면 세부 분석과 비교 기준을 오른쪽에서 바로 볼 수 있습니다.</Text>
          )}
        </View>

        {recommendation ? (
          <View className="space-y-3 p-4">
            <PanelBlock title="평가 이유">{recommendation.evaluation_rationale || evaluationText(recommendation)}</PanelBlock>

            <PanelBlock title="비교 기준">
              <Text className="font-semibold text-teal-700">{recommendation.pattern_title || recommendation.pattern_ref}</Text>
              <Text className="mt-2">{patternText(recommendation)}</Text>
            </PanelBlock>

            <PanelBlock title="추천 액션">{recommendation.next_action_summary}</PanelBlock>
          </View>
        ) : (
          <View className="p-5">
            <View className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center text-sm text-slate-500">
              아직 선택된 공고가 없습니다.
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}

function PanelBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="text-sm font-semibold text-slate-900">{title}</Text>
      <View className="mt-2 text-sm leading-6 text-slate-600">{children}</View>
    </View>
  );
}

function SummaryStatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <View className="flex min-h-[74px] flex-col justify-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
      <Text className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</Text>
      <Text className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{value}</Text>
      <Text className="mt-1 text-[11px] leading-4 text-slate-500">{helper}</Text>
    </View>
  );
}

function SummaryMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
      <Text className="text-[11px] font-semibold text-slate-500">{label}</Text>
      <Text className="mt-2 text-lg font-semibold text-slate-950">{value}</Text>
    </View>
  );
}

function MiniInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-h-[72px] rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
      <Text className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</Text>
      <Text className="mt-1 line-clamp-3 text-xs leading-5 text-slate-700">{value}</Text>
    </View>
  );
}

function HorizontalMetricBar({ label, score }: { label: string; score: number }) {
  const safeScore = clampScore(score);

  return (
    <View className="min-w-[132px] rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="whitespace-nowrap text-[11px] font-medium text-slate-500">{label}</Text>
        <Text className="shrink-0 text-xs font-semibold text-slate-900">{safeScore}%</Text>
      </View>
      <View className="mt-3 h-1.5 rounded-full bg-slate-100">
        <View className="h-full rounded-full" style={{ width: `${safeScore}%`, backgroundColor: HORIZONTAL_BAR_COLOR }} />
      </View>
    </View>
  );
}

function BlueScoreBar({ label, value }: { label: string; value: number }) {
  const safeValue = clampScore(value);

  return (
    <View>
      <View className="flex-row items-center justify-between gap-3 text-sm">
        <Text className="font-medium text-slate-600">{label}</Text>
        <Text className="font-semibold text-slate-900">{safeValue}</Text>
      </View>
      <View className="mt-2 h-2 rounded-full bg-slate-100">
        <View className="h-full rounded-full" style={{ width: `${safeValue}%`, backgroundColor: HORIZONTAL_BAR_COLOR }} />
      </View>
    </View>
  );
}

function ScoreRing({ score }: { score: number }) {
  const safeScore = clampScore(score);

  return (
    <View
      className="relative h-16 w-16 rounded-full"
      style={{
        background: `conic-gradient(${SCORE_RING_COLOR} ${safeScore * 3.6}deg, #dbeafe 0deg)`
      }}
    >
      <View className="absolute inset-[7px] flex-row items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-950">
        {safeScore}
      </View>
    </View>
  );
}

function LoadingState() {
  return (
    <View className="flex-row gap-4">
      {[0, 1, 2].map((item) => (
        <Card key={item} className="h-[360px] animate-pulse rounded-[24px] border-slate-200 p-6">
          <View className="h-8 w-20 rounded-full bg-slate-200" />
          <View className="mt-5 h-8 w-64 rounded bg-slate-200" />
          <View className="mt-3 h-5 w-40 rounded bg-slate-200" />
          <View className="mt-6 flex flex-cols-1 gap-3 sm:flex-cols-3">
            <View className="h-20 rounded-2xl bg-slate-200" />
            <View className="h-20 rounded-2xl bg-slate-200" />
            <View className="h-20 rounded-2xl bg-slate-200" />
          </View>
          <View className="mt-6 flex-row gap-2 gap-3 lg:flex-cols-5">
            {[0, 1, 2, 3, 4].map((cell) => (
              <View key={cell} className="h-20 rounded-2xl bg-slate-200" />
            ))}
          </View>
        </Card>
      ))}
    </View>
  );
}

function NoCandidateState() {
  return (
    <EmptyState
      title="조건에 맞는 공고가 없습니다."
      description="희망 국가, 직무 분야, 언어 수준, 경력 조건을 다시 확인해보세요. 현재 프로필과 연결되는 공고가 있으면 상위 추천 결과가 표시됩니다."
    />
  );
}

function detailMetricsForCard(recommendation: JobRecommendation) {
  return [
    { label: "합격 가능성", score: recommendation.acceptance_probability_score ?? 0 },
    { label: "연봉", score: recommendation.salary_score ?? 0 },
    { label: "워라밸", score: recommendation.work_life_balance_score ?? 0 },
    { label: "기업 가치", score: recommendation.company_value_score ?? 0 },
    { label: "직무 적합도", score: recommendation.job_fit_score ?? 0 }
  ];
}

function priorityLabels(profile: UserProfileRequest) {
  const labels = [];
  if (profile.prioritize_salary) labels.push("연봉");
  if (profile.prioritize_acceptance_probability) labels.push("합격 가능성");
  if (profile.prioritize_work_life_balance) labels.push("워라밸");
  if (profile.prioritize_company_value) labels.push("기업 가치");
  if (profile.prioritize_job_fit) labels.push("직무 적합도");
  return labels;
}

function aggregateCategoryAverages(recommendations: JobRecommendation[]) {
  if (recommendations.length === 0) {
    return [
      { label: "스킬", value: 0 },
      { label: "경력", value: 0 },
      { label: "언어", value: 0 },
      { label: "포트폴리오", value: 0 }
    ];
  }

  return [
    { label: "스킬", value: averageScore(recommendations.map((item) => item.score_breakdown.skill_score)) },
    { label: "경력", value: averageScore(recommendations.map((item) => item.score_breakdown.experience_score)) },
    { label: "언어", value: averageScore(recommendations.map((item) => item.score_breakdown.language_score)) },
    { label: "포트폴리오", value: averageScore(recommendations.map((item) => item.score_breakdown.portfolio_score)) }
  ];
}

function averageScore(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function evaluationText(recommendation: JobRecommendation) {
  const core = `${recommendation.company_name}의 ${recommendation.job_title} 공고와 저장된 프로필을 비교한 결과입니다.`;
  return `${core} 기술 역량, 경력 조건, 언어 조건, 포트폴리오 준비도를 중심으로 점수를 계산했고, 우선순위 기준도 함께 반영했습니다.`;
}

function patternText(recommendation: JobRecommendation) {
  if (recommendation.pattern_evidence_summary) return recommendation.pattern_evidence_summary;
  return "공고 요구사항과 직무 패턴을 기준으로 강점과 보완 포인트를 정리한 결과입니다.";
}

function gradeTone(grade: string) {
  if (grade === "A") return "success";
  if (grade === "B") return "brand";
  return "warning";
}

function readinessTone(status: string) {
  if (status === "IMMEDIATE_APPLY") return "success";
  if (status === "PREPARE_THEN_APPLY") return "brand";
  return "warning";
}

function isProfileMissingError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("user profile not found") || message.includes("profile not found") || message.includes("404");
}
