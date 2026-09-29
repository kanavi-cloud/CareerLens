import { View, Text, Pressable } from 'react-native';
"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, EmptyState, LinkButton, MetricCard, PageHeader, PageShell, SectionHeader } from "@/components/ui";
import { fetchUserBadges, type VerificationBadge } from "@/lib/verifications";

export default function MyPageBadgesPage() {
  const auth = useRequiredAuth();
  const [badges, setBadges] = useState<VerificationBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (auth.isChecking) {
      return;
    }
    if (!auth.user) {
      setIsLoading(false);
      return;
    }

    fetchUserBadges(auth.user.user_id)
      .then(setBadges)
      .catch((error: Error) => setErrorMessage(error.message))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  const summary = useMemo(() => {
    const gold = badges.filter((badge) => badge.badge_type.includes("GOLD")).length;
    const silver = badges.filter((badge) => badge.badge_type.includes("SILVER")).length;
    const bronze = badges.filter((badge) => badge.badge_type.includes("BRONZE")).length;
    const github = badges.filter((badge) => badge.badge_type.includes("GITHUB")).length;
    const average = badges.length === 0 ? 0 : Math.round(badges.reduce((sum, badge) => sum + (badge.score_at_issue ?? 0), 0) / badges.length);
    return { gold, silver, bronze, github, average };
  }, [badges]);

  if (auth.isChecking) {
    return <AuthCheckingScreen title="검증 배지 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="검증 배지는 로그인 후 이용할 수 있습니다." />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="VERIFICATION BADGES"
        title="검증 배지"
        description="커리어 플래너 과제, AI 문서 분석, GitHub repository 검증 결과로 발급된 준비 증빙 배지를 확인합니다."
        actions={
          <>
            <LinkButton href="/roadmap/employment/documents" variant="secondary">AI 문서 분석</LinkButton>
            <LinkButton href="/planner">로드맵 목록</LinkButton>
          </>
        }
      />

      <View>
        {isLoading ? (
          <EmptyState title="검증 배지를 불러오는 중입니다" description="사용자의 검증 기록과 발급 배지를 확인하고 있습니다." />
        ) : (
          <View className="space-y-6">
            <Card className="p-5">
              <View className="flex-row gap-3 sm:flex-cols-2 lg:flex-cols-5">
                <MetricCard label="총 배지" value={`${badges.length}개`} />
                <MetricCard label="평균 검증점수" value={`${summary.average}점`} />
                <MetricCard label="Gold" value={`${summary.gold}개`} />
                <MetricCard label="Silver" value={`${summary.silver}개`} />
                <MetricCard label="GitHub 검증" value={`${summary.github}개`} />
              </View>
            </Card>

            <Card className="p-5">
              <SectionHeader
                kicker="ISSUE RULES"
                title="배지 발급 기준"
                description="검증 배지는 합격 보장이 아니라, 사용자가 제출한 과제 산출물이 플래너 기준을 얼마나 충족했는지 보여주는 준비 증빙입니다."
              />
              <View className="mt-5 flex-row gap-3 md:flex-cols-4">
                <RuleCard title="Bronze" score="60점 이상" description="기본 산출물은 있으나 구체성과 검증 가능성 보완이 필요합니다." tone="warning" />
                <RuleCard title="Silver" score="75점 이상" description="주요 검증 기준을 대체로 충족했고 지원 자료로 발전 가능합니다." tone="brand" />
                <RuleCard title="Gold" score="90점 이상" description="산출물과 검증 기준이 매우 구체적이고 포트폴리오 증빙으로 바로 활용 가능합니다." tone="success" />
                <RuleCard title="GitHub Project" score="GitHub 75점 이상" description="실제 GitHub repository URL과 README/프로젝트 구조를 함께 검증한 경우 발급됩니다." tone="success" />
              </View>
            </Card>

            {errorMessage && (
              <View role="alert" className="border border-coral/30 bg-red-50 px-4 py-3 text-sm font-medium text-coral">
                {errorMessage}
              </View>
            )}

            {badges.length === 0 ? (
              <EmptyState
                title="아직 발급된 검증 배지가 없습니다"
                description="커리어 플래너 과제에서 산출물을 만들고 AI 문서 분석에서 텍스트, PDF/DOCX, GitHub repository를 검증하면 배지가 발급됩니다."
                action={<LinkButton href="/roadmap/employment/documents">첫 검증 시작</LinkButton>}
              />
            ) : (
              <View>
                <SectionHeader
                  kicker="BADGE WALLET"
                  title="내 검증 배지 목록"
                  description="최근 발급된 배지부터 표시됩니다. 같은 과제라도 제출 방식과 점수에 따라 다른 배지가 발급될 수 있습니다."
                />
                <View className="mt-5 flex-row gap-4 md:flex-cols-2 xl:flex-cols-3">
                  {badges.map((badge) => (
                    <BadgeWalletCard key={badge.badge_id} badge={badge} />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </PageShell>
  );
}

function RuleCard({
  title,
  score,
  description,
  tone
}: {
  title: string;
  score: string;
  description: string;
  tone: "brand" | "success" | "warning";
}) {
  return (
    <View className="border border-line bg-panel p-4">
      <Badge tone={tone}>{score}</Badge>
      <Text className="mt-3 text-base font-semibold text-night">{title}</Text>
      <Text className="mt-2 text-sm leading-6 text-slate-600">{description}</Text>
    </View>
  );
}

function BadgeWalletCard({ badge }: { badge: VerificationBadge }) {
  return (
    <Card className="p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View>
          <Badge tone={badgeTone(badge.badge_type)}>{badgeLabel(badge.badge_type)}</Badge>
          <Text className="mt-3 text-lg font-semibold text-night">{badge.label}</Text>
        </View>
        <View className="border border-line bg-panel px-3 py-2 text-right">
          <Text className="text-xs font-semibold text-slate-500">SCORE</Text>
          <Text className="text-lg font-semibold text-night">{badge.score_at_issue}점</Text>
        </View>
      </View>
      <Text className="mt-3 text-sm leading-6 text-slate-600">{badge.description}</Text>
      <View className="mt-4 flex-row gap-2 gap-2 text-xs text-slate-500">
        <View className="border border-line bg-panel p-2">
          <Text className="font-semibold text-slate-600">Task</Text>
          <Text className="mt-1">#{badge.task_id}</Text>
        </View>
        <View className="border border-line bg-panel p-2">
          <Text className="font-semibold text-slate-600">Verification</Text>
          <Text className="mt-1">#{badge.verification_id}</Text>
        </View>
      </View>
      <Text className="mt-3 text-xs text-slate-500">발급일: {formatDate(badge.issued_at)}</Text>
    </Card>
  );
}

function badgeLabel(type: string) {
  if (type.includes("GITHUB")) return "GitHub Project";
  if (type.includes("GOLD")) return "Gold";
  if (type.includes("SILVER")) return "Silver";
  if (type.includes("BRONZE")) return "Bronze";
  return "Verified";
}

function badgeTone(type: string) {
  if (type.includes("GOLD") || type.includes("GITHUB")) return "success";
  if (type.includes("SILVER")) return "brand";
  return "warning";
}

function formatDate(value?: string) {
  if (!value) return "미기재";
  return value.slice(0, 10).replaceAll("-", ".");
}
