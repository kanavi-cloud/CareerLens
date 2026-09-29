import { View, Text, Pressable } from 'react-native';
"use client";

import { useEffect, useState } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, MetricCard, PageHeader, PageShell, ScoreBar } from "@/components/ui";
import { fetchMembershipSummary, startKakaoPayProPass, type MembershipSummary } from "@/lib/membership";

export default function MembershipPage() {
  const auth = useRequiredAuth();
  const [summary, setSummary] = useState<MembershipSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (auth.isChecking) {
      return;
    }
    if (!auth.user) {
      setIsLoading(false);
      return;
    }
    fetchMembershipSummary()
      .then(setSummary)
      .catch((error: Error) => setErrorMessage(error.message))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  async function handleStartPayment() {
    setIsStartingPayment(true);
    setErrorMessage("");
    try {
      const ready = await startKakaoPayProPass();
      window.location.href = ready.redirect_url;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "결제 준비 중 오류가 발생했습니다.");
      setIsStartingPayment(false);
    }
  }

  if (auth.isChecking) {
    return <AuthCheckingScreen title="멤버십 정보를 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="멤버십 관리는 로그인 후 이용할 수 있습니다." />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="CAREERLENS PRO"
        title="멤버십"
        actions={<LinkButton href="/mypage" variant="secondary">마이페이지로</LinkButton>}
      />

      <View>
        {isLoading && <EmptyState title="멤버십 정보를 불러오는 중입니다." />}
        {!isLoading && errorMessage && (
          <View role="alert" className="mb-5 rounded-2xl border border-coral/30 bg-red-50 px-4 py-3 text-sm font-semibold text-coral">
            {errorMessage}
          </View>
        )}
        {!isLoading && summary && (
          <View className="flex-row gap-6 lg:flex-cols-[1fr_380px] xl:flex-cols-[1fr_420px]">
            <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white p-0 shadow-[0_22px_70px_rgba(15,23,42,0.07)]">
              <View className="border-b border-slate-100 bg-gradient-to-br from-white via-white to-teal-50/70 px-6 py-6">
                <View className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <View>
                    <Text className="text-xs font-extrabold tracking-[0.14em] text-brand">CURRENT PLAN</Text>
                    <Text className="mt-3 text-3xl font-extrabold text-night">
                      {summary.pro_active ? "CareerLens Pro" : "Free 플랜"}
                    </Text>
                    <Text className="mt-2 text-sm text-slate-600">
                      {summary.pro_active
                        ? `Pro 이용 기간: ${formatDate(summary.pro_expires_at)}까지`
                        : "기본 진단과 제한된 로드맵, 문서 분석을 사용할 수 있습니다."}
                    </Text>
                  </View>
                  <Badge tone={summary.pro_active ? "success" : "warning"} className="whitespace-nowrap rounded-full">
                    {summary.pro_active ? "PRO 활성" : "FREE"}
                  </Badge>
                </View>
              </View>

              <View className="p-6">
                {summary.pro_active && (
                  <View className="mb-5 flex-row gap-3 sm:flex-cols-3">
                    <MetricCard label="플랜 상태" value="Pro 이용 중" helper="결제 완료" />
                    <MetricCard label="남은 기간" value={`${daysUntil(summary.pro_expires_at)}일`} helper="만료일 기준" />
                    <MetricCard label="이번 달 한도" value="130회" helper="로드맵 + 문서 분석" />
                  </View>
                )}

                {!summary.pro_active && (
                  <View className="mb-5 rounded-2xl border border-amber/30 bg-amber-50 px-4 py-3">
                    <Text className="text-sm font-bold text-night">Pro로 전환하면 준비 작업 한도가 크게 늘어납니다.</Text>
                    <Text className="mt-1 text-xs leading-5 text-slate-600">
                      커리어 플래너와 AI 문서 분석을 더 자주 사용할 수 있습니다.
                    </Text>
                  </View>
                )}

                <View className="flex-row gap-4 md:flex-cols-2">
                  <UsagePanel
                    title="커리어 플래너"
                    used={summary.roadmap_used}
                    limit={summary.roadmap_limit}
                    remaining={summary.roadmap_remaining}
                  />
                  <UsagePanel
                    title="AI 문서 분석"
                    used={summary.ai_document_analysis_used}
                    limit={summary.ai_document_analysis_limit}
                    remaining={summary.ai_document_analysis_remaining}
                  />
                </View>
              </View>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white p-0 shadow-[0_22px_70px_rgba(15,23,42,0.07)]">
              <View className="bg-night px-6 py-6 text-white">
                <Text className="text-xs font-extrabold tracking-[0.14em] text-mint">PRO PASS</Text>
                <Text className="mt-3 text-2xl font-extrabold">
                  {summary.pro_active ? "Pro 기간 연장" : "30일 Pro 패스"}
                </Text>
                <Text className="mt-2 text-3xl font-extrabold">{summary.price_label}</Text>
                <Text className="mt-3 text-sm leading-6 text-slate-200">
                  {summary.pro_active
                    ? "현재 Pro 혜택을 유지하고 다음 준비 기간까지 이어갈 수 있습니다."
                    : "로드맵 생성과 문서 분석 한도를 확장해 준비 과정을 더 촘촘하게 관리합니다."}
                </Text>
              </View>

              <View className="p-6">
                <View className="flex-row gap-3">
                  <MetricCard label="로드맵 생성" value="월 30회" helper="공고별 준비 로드맵" />
                  <MetricCard label="AI 문서 분석" value="월 100회" helper="이력서, GitHub, 제출물 검토" />
                  <MetricCard label="이용 기간" value="30일" helper="결제 완료 후 바로 적용" />
                </View>

                <Button
                  
                  className="mt-6 w-full rounded-2xl"
                  onPress={handleStartPayment}
                  disabled={isStartingPayment}
                >
                  {isStartingPayment
                    ? "카카오페이로 이동 중"
                    : summary.pro_active
                      ? "Pro 기간 연장하기"
                      : "카카오페이로 Pro 시작"}
                </Button>

                {summary.pro_active && (
                  <View className="mt-4 rounded-2xl border border-mint/30 bg-mint/10 px-4 py-3">
                    <Text className="text-sm font-bold text-night">현재 Pro 혜택이 적용되어 있습니다.</Text>
                    <Text className="mt-1 text-xs leading-5 text-slate-600">
                      결제하면 현재 만료일 이후로 30일이 추가됩니다.
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          </View>
        )}
      </View>
    </PageShell>
  );
}

function UsagePanel({ title, used, limit, remaining }: { title: string; used: number; limit: number; remaining: number }) {
  const rate = limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View>
          <Text className="text-sm font-bold text-night">{title}</Text>
          <Text className="mt-1 text-xs text-slate-500">이번 달 사용량</Text>
        </View>
        <Badge tone={remaining > 0 ? "success" : "warning"}>{remaining}회 남음</Badge>
      </View>
      <View className="mt-4">
        <ScoreBar label={`${used}/${limit}회 사용`} value={rate} tone={rate >= 90 ? "warning" : "brand"} />
      </View>
    </View>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("ko-KR");
}

function daysUntil(value: string | null) {
  if (!value) {
    return 0;
  }
  const end = new Date(value).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}
