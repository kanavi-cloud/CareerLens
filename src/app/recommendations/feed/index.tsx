import { View, Text, Pressable } from 'react-native';
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageHeader, PageShell, SectionHeader } from "@/components/ui";
import { countryGuides, visaGuides } from "@/lib/resource-guides";

const feedItems = [
  {
    type: "추천 준비",
    title: "추천 진단 전 프로필을 먼저 채우세요",
    description: "희망 국가, 직무군, 기술스택, 언어 수준, 포트폴리오/GitHub 여부가 추천 결과에 직접 반영됩니다.",
    href: "/mypage"
  },
  {
    type: "로드맵",
    title: "부족 요소는 커리어 플래너 과제로 전환됩니다",
    description: "추천 결과의 부족 요소가 주차별 과제, 기대 산출물, 검증 기준으로 바뀝니다.",
    href: "/planner"
  },
  {
    type: "검증",
    title: "이력서와 GitHub는 AI 문서 분석에서 검증하세요",
    description: "텍스트, PDF/DOCX, GitHub repository를 제출하면 검증 점수와 배지를 받을 수 있습니다.",
    href: "/roadmap/employment/documents"
  }
];

export default function RecommendationFeedPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="PERSONALIZED FEED"
        title="맞춤 피드"
        description="사용자 프로필, 추천 진단, 국가/비자 자료를 연결해 해외취업 준비 다음 액션을 피드 형태로 보여줍니다."
        actions={<LinkButton href="/mypage">프로필 수정</LinkButton>}
      />

      <View>
        <View className="flex-row gap-4 lg:flex-cols-[1fr_0.8fr]">
          <View className="space-y-4">
            {feedItems.map((item) => (
              <Card key={item.title} className="p-5">
                <Badge tone="brand">{item.type}</Badge>
                <Text className="mt-3 text-xl font-semibold text-night">{item.title}</Text>
                <Text className="mt-2 text-sm leading-6 text-slate-600">{item.description}</Text>
                <View className="mt-4">
                  <LinkButton href={item.href} variant="secondary">이동</LinkButton>
                </View>
              </Card>
            ))}
          </View>

          <View>
            <Card className="p-5">
              <SectionHeader kicker="COUNTRY TIPS" title="국가별 준비 팁" />
              <View className="mt-4 space-y-3">
                {countryGuides.map((guide) => (
                  <View key={guide.country} className="border border-line bg-panel p-4">
                    <Text className="text-sm font-semibold text-night">{guide.country}</Text>
                    <Text className="mt-2 text-sm leading-6 text-slate-600">{guide.visaFocus}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card className="p-5">
              <SectionHeader kicker="VISA CHECK" title="비자 체크리스트" />
              <View className="mt-4 space-y-3">
                {visaGuides.map((guide) => (
                  <View key={guide.country} className="border border-line bg-panel p-4">
                    <Badge tone="muted">{guide.country}</Badge>
                    <ul className="mt-3 space-y-1">
                      {guide.checklist.slice(0, 2).map((item) => (
                        <li key={item} className="text-sm leading-6 text-slate-600">- {item}</li>
                      ))}
                    </ul>
                  </View>
                ))}
              </View>
              <View className="mt-4 flex-row flex-wrap gap-2">
                <LinkButton href="/resources/visas" variant="secondary">비자정보</LinkButton>
                <LinkButton href="/roadmap/administration" variant="subtle">행정로드맵</LinkButton>
              </View>
            </Card>
          </View>
        </View>
      </View>
    </PageShell>
  );
}
