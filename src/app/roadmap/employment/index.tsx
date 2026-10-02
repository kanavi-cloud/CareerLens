"use client";

import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageHeader, PageShell } from "@/components/ui";

const modules = [
  {
    title: "커리어 플래너",
    href: "/planner",
    bullets: ["로드맵 목록", "주차별 과제", "완료율 확인", "지원 관리 전환"]
  },
  {
    title: "AI 문서 분석",
    href: "/roadmap/employment/documents",
    bullets: ["이력서 피드백", "자기소개서 보완", "포트폴리오 증빙", "GitHub 요약"]
  },
  {
    title: "기업 지원 관리",
    href: "/applications",
    bullets: ["관심 공고", "서류 준비", "지원 상태", "다음 액션"]
  }
];

export default function EmploymentRoadmapPage() {
  const auth = useRequiredAuth();

  if (auth.isChecking) {
    return <AuthCheckingScreen title="취업로드맵 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="취업로드맵은 로그인 후 이용할 수 있습니다." />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="EMPLOYMENT ROADMAP"
        title="취업로드맵"
        actions={<LinkButton href="/planner">로드맵 목록으로</LinkButton>}
      />

      <View>
        <View>
          <Text className="text-xs font-extrabold tracking-[0.14em] text-brand">APPLICATION PREP</Text>
          <Text className="mt-2 text-2xl font-bold text-night">지원 준비 대시보드</Text>
        </View>

        <View className="mt-6 flex-row gap-5 lg:flex-cols-3">
          {modules.map((module) => (
            <Link key={module.title} href={module.href as any} asChild>
              <Pressable>
                <Card className="flex min-h-[270px] flex-col rounded-2xl border-slate-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]">
                  <Text className="text-xl font-bold text-night">{module.title}</Text>

                  <View className="mt-8 flex-1 border-t border-slate-100 pt-4">
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      {module.bullets.map((bullet) => (
                        <Badge key={bullet} tone="muted">{bullet}</Badge>
                      ))}
                    </View>
                    <Text className="mt-4 text-sm font-bold text-brand">바로가기</Text>
                  </View>
                </Card>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    </PageShell>
  );
}
