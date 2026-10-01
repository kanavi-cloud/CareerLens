"use client";

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, PageShell, ScoreBar } from "@/components/ui";
import type { AuthUser } from "@/lib/auth";
import { countryLabel, languageLevelLabel } from "@/lib/display-labels";
import { isMembershipLimitMessage } from "@/lib/membership";
import { createPlannerRoadmap } from "@/lib/planner";
import {
  demoProfile,
  diagnoseStoredProfile,
  fetchUserProfile,
  type JobRecommendation,
  type RecommendationResponse,
  type UserProfileRequest
} from "@/lib/recommendation";

const MAX_VISIBLE_RECOMMENDATIONS = 5;

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
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);

  const displayedRecommendations = useMemo(
    () => result?.recommendations.slice(0, MAX_VISIBLE_RECOMMENDATIONS) ?? [],
    [result]
  );

  const selectedRecommendation = useMemo(() => {
    if (!displayedRecommendations.length) return null;
    return displayedRecommendations.find((item) => item.job_id === selectedJobId) ?? displayedRecommendations[0];
  }, [displayedRecommendations, selectedJobId]);

  useFocusEffect(useCallback(() => {
    if (auth.isChecking || !auth.user) return;

    const activeUser = auth.user;
    let active = true;
    setProfileLoading(true);
    setProfileReady(false);
    setProfileMissing(false);
    setErrorMessage(null);
    setResult(null);
    setUser(activeUser);

    fetchUserProfile(activeUser.user_id)
      .then((storedProfile) => {
        if (!active) return;
        setProfileReady(true);
        setProfileMissing(false);
        setProfile({
          ...storedProfile,
          tech_stack: storedProfile.tech_stack ?? [],
          certifications: storedProfile.certifications ?? [],
          preferences: storedProfile.preferences ?? [],
          display_name: storedProfile.display_name || activeUser.display_name,
          email: activeUser.email
        });
      })
      .catch((error) => {
        if (!active) return;
        if (isProfileMissingError(error)) {
          setProfileMissing(true);
        } else {
          setErrorMessage(error instanceof Error ? error.message : "프로필 정보를 불러오지 못했습니다.");
        }
      })
      .finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, [auth.isChecking, auth.user]));

  if (auth.isChecking) {
    return <AuthCheckingScreen title="적합도 진단 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="적합도 진단은 로그인이 필요합니다." />;
  }

  async function runDiagnosis() {
    const activeUser = user ?? auth.user;
    if (!activeUser) return;
    if (isLoading || profileLoading || !profileReady) return;

    if (profileMissing) {
      setErrorMessage("프로필을 먼저 등록해야 적합도 진단을 실행할 수 있습니다.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await diagnoseStoredProfile(activeUser.user_id);
      const recommendations = response.recommendations.slice(0, MAX_VISIBLE_RECOMMENDATIONS);
      setResult(response);
      setSelectedJobId(recommendations[0]?.job_id ?? null);
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
    if (creatingPlannerId !== null) return;
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
      <View className="w-full flex-col gap-4 px-4 py-4">
        <HeaderSection />

        {profileReady ? (
          <ProfileSummary profile={profile} user={user} profileMissing={profileMissing} />
        ) : profileLoading ? (
          <View className="flex-row items-center gap-3 py-4">
            <ActivityIndicator color="#0f766e" />
            <Text className="text-sm text-slate-700">프로필을 불러오는 중입니다.</Text>
          </View>
        ) : null}

        <ActionPanel
          result={result}
          recommendations={displayedRecommendations}
          isLoading={isLoading}
          profileMissing={profileMissing}
          profileUnavailable={profileLoading || !profileReady}
          errorMessage={errorMessage}
          onRun={runDiagnosis}
        />

        {isLoading && <LoadingState />}

        {!isLoading && !result && profileReady && (
          <EmptyState
            title="아직 진단 결과가 없습니다."
            description="저장된 프로필을 기준으로 채용공고 적합도와 보완 포인트를 분석합니다."
            action={<Button onPress={runDiagnosis}>적합도 진단 실행</Button>}
          />
        )}

        {!isLoading && result && displayedRecommendations.length > 0 && (
          <View className="flex-col gap-3">
            <SectionTitle title="추천 공고 Top 5" subtitle="총점이 높은 순서로 정리했습니다." />
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
          </View>
        )}

        {!isLoading && result && displayedRecommendations.length === 0 && (
          <EmptyState
            title="조건에 맞는 공고가 없습니다."
            description="프로필의 희망 국가, 직무, 언어 수준, 경력 조건을 조정한 뒤 다시 진단해보세요."
          />
        )}

        {!isLoading && <SelectedAnalysis recommendation={selectedRecommendation} />}
      </View>
    </PageShell>
  );
}

function HeaderSection() {
  return (
    <View className="flex-col gap-2">
      <Text className="text-xs font-black tracking-[0.16em] text-brand">SUITABILITY DIAGNOSIS</Text>
      <Text className="text-2xl font-black leading-tight text-night">적합도 진단</Text>
      <Text className="text-sm leading-6 text-slate-600">
        저장된 프로필과 해외 채용공고를 비교해 지원 우선순위와 보완할 항목을 보여줍니다.
      </Text>
    </View>
  );
}

function ProfileSummary({
  profile,
  user,
  profileMissing
}: {
  profile: UserProfileRequest;
  user: AuthUser | null;
  profileMissing: boolean;
}) {
  const priorities = priorityLabels(profile);

  return (
    <Card className="flex-col gap-4 shadow-sm">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-black tracking-[0.14em] text-brand">내 프로필</Text>
          <Text className="mt-2 text-lg font-black text-night">{profile.display_name || user?.display_name || "사용자"}</Text>
          <Text className="mt-1 text-xs text-slate-500">{user?.email || profile.email}</Text>
        </View>
        <Badge tone={profileMissing ? "warning" : "success"}>{profileMissing ? "등록 필요" : "사용 가능"}</Badge>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <InfoPill label="희망 국가" value={countryLabel(profile.target_country)} />
        <InfoPill label="직무" value={profile.target_job_family || "미입력"} />
        <InfoPill label="경력" value={`${profile.experience_years ?? 0}년`} />
        <InfoPill label="언어" value={languageLevelLabel(profile.language_level)} />
      </View>

      <View className="flex-col gap-2">
        <Text className="text-sm font-black text-night">우선순위</Text>
        <View className="flex-row flex-wrap gap-2">
          {priorities.map((priority) => (
            <Badge key={priority} tone="brand">{priority}</Badge>
          ))}
          {priorities.length === 0 && <Badge tone="muted">기본 기준</Badge>}
        </View>
      </View>

      <View className="flex-col gap-2">
        <Text className="text-sm font-black text-night">기술 스택</Text>
        <View className="flex-row flex-wrap gap-2">
          {profile.tech_stack.slice(0, 8).map((tech) => (
            <Badge key={tech} tone="muted">{tech}</Badge>
          ))}
          {profile.tech_stack.length === 0 && <Badge tone="muted">등록된 기술 없음</Badge>}
        </View>
      </View>

      <LinkButton href="/onboarding/profile" variant="secondary">프로필 수정</LinkButton>
    </Card>
  );
}

function ActionPanel({
  result,
  recommendations,
  isLoading,
  profileMissing,
  profileUnavailable,
  errorMessage,
  onRun
}: {
  result: RecommendationResponse | null;
  recommendations: JobRecommendation[];
  isLoading: boolean;
  profileMissing: boolean;
  profileUnavailable: boolean;
  errorMessage: string | null;
  onRun: () => void;
}) {
  const topScore = recommendations[0]?.score_breakdown.total_score ?? 0;
  const averageTotalScore = averageScore(recommendations.map((item) => item.score_breakdown.total_score));

  return (
    <Card className="flex-col gap-4 border-teal-100 bg-[#f5fffb] shadow-sm">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-black tracking-[0.14em] text-teal-700">진단 실행</Text>
          <Text className="mt-2 text-xl font-black text-night">
            {result ? result.overall_readiness_label : "프로필 기반으로 공고를 분석합니다"}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-slate-600">
            {result
              ? `${result.returned_recommendation_count}개 추천 결과가 생성되었습니다.`
              : "버튼을 누르면 저장된 프로필과 현재 공고 데이터를 비교합니다."}
          </Text>
        </View>
        {isLoading && <ActivityIndicator color="#0f766e" />}
      </View>

      {errorMessage && (
        <View className="rounded-xl border border-red-200 bg-red-50 px-3 py-3">
          <Text className="text-sm font-semibold text-red-700">{errorMessage}</Text>
          {isMembershipLimitMessage(errorMessage) && (
            <View className="mt-3">
              <LinkButton href="/membership">Pro 멤버십 보기</LinkButton>
            </View>
          )}
        </View>
      )}

      {profileMissing && (
        <View className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
          <Text className="text-sm font-semibold text-amber-800">진단 전 프로필 등록이 필요합니다.</Text>
          <View className="mt-3">
            <LinkButton href="/onboarding/profile">프로필 등록하기</LinkButton>
          </View>
        </View>
      )}

      {result && (
        <View className="flex-row gap-2">
          <StatCard label="분석 공고" value={`${result.total_candidate_count}`} />
          <StatCard label="최고 점수" value={`${clampScore(topScore)}%`} />
          <StatCard label="평균 점수" value={`${clampScore(averageTotalScore)}%`} />
        </View>
      )}

      <Button onPress={onRun} loading={isLoading} disabled={profileMissing || profileUnavailable}>
        {isLoading ? "진단 중" : result ? "다시 진단하기" : "적합도 진단 실행"}
      </Button>
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
  const totalScore = clampScore(recommendation.score_breakdown.total_score);

  return (
    <Card className={`flex-col gap-4 shadow-sm ${selected ? "border-teal-400" : ""}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="h-7 min-w-7 items-center justify-center rounded-full bg-night px-2">
              <Text className="text-xs font-black text-white">{rank}</Text>
            </View>
            <Badge tone={gradeTone(recommendation.recommendation_grade)}>등급 {recommendation.recommendation_grade}</Badge>
            <Badge tone={readinessTone(recommendation.readiness_status)}>{recommendation.readiness_label}</Badge>
          </View>
          <Text className="mt-3 text-lg font-black leading-6 text-night">{recommendation.job_title}</Text>
          <Text className="mt-1 text-sm font-semibold text-slate-700">{recommendation.company_name}</Text>
          <Text className="mt-1 text-xs text-slate-500">
            {countryLabel(recommendation.country)} · {recommendation.work_type} · {recommendation.salary_range}
          </Text>
        </View>
        <View className="h-20 w-20 items-center justify-center rounded-2xl bg-teal-50">
          <Text className="text-2xl font-black text-teal-700">{totalScore}</Text>
          <Text className="text-[10px] font-bold text-teal-700">점</Text>
        </View>
      </View>

      <View className="flex-col gap-3">
        <ScoreBar label="기술" value={clampScore(recommendation.score_breakdown.skill_score)} tone="brand" />
        <ScoreBar label="경력" value={clampScore(recommendation.score_breakdown.experience_score)} tone="brand" />
        <ScoreBar label="언어" value={clampScore(recommendation.score_breakdown.language_score)} tone="brand" />
        <ScoreBar label="직무 적합도" value={clampScore(recommendation.job_fit_score)} tone="success" />
      </View>

      <View className="rounded-xl bg-slate-50 px-3 py-3">
        <Text className="text-xs font-black text-slate-500">추천 이유</Text>
        <Text className="mt-1 text-sm leading-6 text-slate-700">{recommendation.recommendation_summary}</Text>
      </View>

      <View className="flex-col gap-2">
        <Text className="text-sm font-black text-night">보완 항목</Text>
        <View className="flex-row flex-wrap gap-2">
          {recommendation.missing_items.length > 0 ? (
            recommendation.missing_items.slice(0, 4).map((item) => <Badge key={item} tone="warning">{item}</Badge>)
          ) : (
            <Badge tone="success">즉시 지원 가능</Badge>
          )}
        </View>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button variant="outline" onPress={onSelect}>{selected ? "선택됨" : "상세 보기"}</Button>
        </View>
        <View className="flex-1">
          <Button variant="secondary" onPress={onCreatePlanner} loading={isCreatingPlanner}>
            플래너 생성
          </Button>
        </View>
      </View>
    </Card>
  );
}

function SelectedAnalysis({ recommendation }: { recommendation: JobRecommendation | null }) {
  if (!recommendation) {
    return null;
  }

  return (
    <Card className="flex-col gap-4 shadow-sm">
      <SectionTitle title="선택 공고 상세 분석" subtitle={`${recommendation.company_name} · ${recommendation.job_title}`} />
      <PanelBlock title="평가 이유">{recommendation.evaluation_rationale || evaluationText(recommendation)}</PanelBlock>
      <PanelBlock title="비교 기준">
        {recommendation.pattern_title || recommendation.pattern_ref || "저장 프로필 기준 분석"}
        {recommendation.pattern_evidence_summary ? `\n${recommendation.pattern_evidence_summary}` : ""}
      </PanelBlock>
      <PanelBlock title="추천 액션">{recommendation.next_action_summary}</PanelBlock>
      <View className="flex-row flex-wrap gap-2">
        <MetricBadge label="합격" value={recommendation.acceptance_probability_score} />
        <MetricBadge label="연봉" value={recommendation.salary_score} />
        <MetricBadge label="워라밸" value={recommendation.work_life_balance_score} />
        <MetricBadge label="기업" value={recommendation.company_value_score} />
      </View>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card className="items-center justify-center gap-3 py-10">
      <ActivityIndicator color="#0f766e" />
      <Text className="text-sm font-semibold text-slate-700">적합도 진단을 분석하고 있습니다.</Text>
      <Text className="text-center text-xs leading-5 text-slate-500">프로필과 공고 조건을 비교해 추천 결과를 만드는 중입니다.</Text>
    </Card>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View>
      <Text className="text-lg font-black text-night">{title}</Text>
      {subtitle && <Text className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</Text>}
    </View>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[46%] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <Text className="text-[11px] font-bold text-slate-500">{label}</Text>
      <Text className="mt-1 text-sm font-black text-night">{value}</Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl border border-teal-100 bg-white px-3 py-3">
      <Text className="text-[11px] font-bold text-slate-500">{label}</Text>
      <Text className="mt-1 text-lg font-black text-night">{value}</Text>
    </View>
  );
}

function PanelBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="rounded-xl bg-slate-50 px-3 py-3">
      <Text className="text-xs font-black text-slate-500">{title}</Text>
      <Text className="mt-1 text-sm leading-6 text-slate-700">{children}</Text>
    </View>
  );
}

function MetricBadge({ label, value }: { label: string; value: number }) {
  return (
    <View className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <Text className="text-[11px] font-bold text-slate-500">{label}</Text>
      <Text className="mt-1 text-base font-black text-night">{clampScore(value)}%</Text>
    </View>
  );
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

function averageScore(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score ?? 0)));
}

function evaluationText(recommendation: JobRecommendation) {
  return `${recommendation.company_name}의 ${recommendation.job_title} 공고와 저장된 프로필을 비교한 결과입니다. 기술 역량, 경력 조건, 언어 조건, 포트폴리오 준비도를 중심으로 계산했습니다.`;
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
