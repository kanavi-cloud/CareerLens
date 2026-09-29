import { View, Text, Pressable } from 'react-native';
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageHeader, PageShell, SectionHeader, StepCard } from "@/components/ui";
import { countryGuides, noticeItems, qnaItems, resourceDisclaimer, visaGuides } from "@/lib/resource-guides";

const resourceSections = [
  {
    title: "공지사항",
    description: "서비스 이용 안내, 공고 데이터 업데이트, 추천 진단 변경사항을 확인합니다.",
    href: "/resources/notices",
    badge: "NOTICE"
  },
  {
    title: "Q&A",
    description: "추천 진단, PatternProfile, AI 활용, 권한 정책에 대한 자주 묻는 질문을 정리합니다.",
    href: "/resources/qna",
    badge: "FAQ"
  },
  {
    title: "국가정보",
    description: "국가별 채용시장, 언어, 정착 준비 포인트를 추천 흐름과 연결합니다.",
    href: "/resources/countries",
    badge: "COUNTRY"
  },
  {
    title: "비자정보",
    description: "공식 기관 링크와 준비 체크리스트를 행정 로드맵으로 이어줍니다.",
    href: "/resources/visas",
    badge: "VISA"
  }
];

export default function ResourcesPage() {
  const urgentNotices = noticeItems.slice(0, 3);
  const featuredQuestions = qnaItems.slice(0, 4);

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="RESOURCE CENTER"
        title="자료실"
        description="해외취업 준비에서 흩어지는 공고, 비자, 정책, 추천 진단 정보를 하나의 흐름으로 정리합니다. 자료실은 법률 판단이 아니라 공식 출처 확인과 서비스 사용을 돕는 정보 허브입니다."
        actions={
          <>
            <LinkButton href="/resources/notices" variant="secondary">공지 보기</LinkButton>
            <LinkButton href="/resources/visas">비자정보 보기</LinkButton>
          </>
        }
      />

      <View>
        <View className="flex-row gap-4 md:flex-cols-2 xl:flex-cols-4">
          {resourceSections.map((section, index) => (
            <Card key={section.title} className="p-5">
              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-xs font-bold text-brand">0{index + 1}</Text>
                <Badge tone="muted">{section.badge}</Badge>
              </View>
              <Text className="mt-3 text-lg font-semibold text-night">{section.title}</Text>
              <Text className="mt-2 min-h-16 text-sm leading-6 text-slate-600">{section.description}</Text>
              <View className="mt-4">
                <LinkButton href={section.href} variant="secondary">열기</LinkButton>
              </View>
            </Card>
          ))}
        </View>

        <View>
          <Card className="p-5">
            <SectionHeader
              kicker="NOTICE BRIEF"
              title="최근 공지"
              description="서비스 이용 흐름과 데이터 반영 기준에서 꼭 확인해야 할 안내입니다."
              actions={<LinkButton href="/resources/notices" variant="subtle">전체 공지</LinkButton>}
            />
            <View className="mt-5 flex-row gap-3">
              {urgentNotices.map((notice) => (
                <View>
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Badge tone={notice.priority === "높음" ? "warning" : "muted"}>{notice.priority}</Badge>
                    <Badge tone="brand">{notice.category}</Badge>
                    <Text className="text-xs font-semibold text-slate-500">{notice.date}</Text>
                  </View>
                  <Text className="mt-3 text-base font-semibold text-night">{notice.title}</Text>
                  <Text className="mt-2 text-sm leading-6 text-slate-600">{notice.summary}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card className="p-5">
            <SectionHeader
              kicker="SERVICE Q&A"
              title="자주 묻는 질문"
              description="추천 진단, AI 활용, 비자 정보처럼 사용자가 궁금해할 항목을 정리했습니다."
              actions={<LinkButton href="/resources/qna" variant="subtle">Q&A 전체</LinkButton>}
            />
            <View className="mt-5 space-y-3">
              {featuredQuestions.map((item) => (
                <details key={item.question} className="group border border-line bg-panel p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-night">{item.question}</summary>
                  <Text className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</Text>
                  <View className="mt-3 flex-row flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <Badge key={tag} tone="muted">{tag}</Badge>
                    ))}
                  </View>
                </details>
              ))}
            </View>
          </Card>
        </View>

        <View>
          <Card className="p-5">
            <SectionHeader
              kicker="COUNTRY SNAPSHOT"
              title="국가별 준비 포인트"
              description="추천 진단 이후 국가별 행정/정착 준비로 이어지는 핵심 기준입니다."
              actions={<LinkButton href="/resources/countries" variant="secondary">국가정보</LinkButton>}
            />
            <View className="mt-5 flex-row gap-3">
              {countryGuides.slice(0, 3).map((guide) => (
                <View key={guide.country} className="border border-line bg-panel p-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="text-lg font-semibold text-night">{guide.country}</Text>
                    <Badge tone={guide.preparationDifficulty === "HIGH" ? "risk" : "warning"}>{difficultyLabel(guide.preparationDifficulty)}</Badge>
                  </View>
                  <Text className="mt-2 text-sm leading-6 text-slate-600">{guide.marketSummary}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card className="p-5">
            <SectionHeader
              kicker="VISA TO ROADMAP"
              title="비자정보 연결 흐름"
              description="비자 페이지는 법률 판단 대신 공식 링크 확인과 행정 로드맵 체크리스트로 연결됩니다."
              actions={<LinkButton href="/resources/visas" variant="secondary">비자정보</LinkButton>}
            />
            <View className="mt-5 flex-row gap-3">
              {visaGuides.slice(0, 2).map((guide, index) => (
                <StepCard key={guide.country} index={index + 1} title={`${guide.country} ${guide.category}`} description={guide.summary} />
              ))}
            </View>
            <View className="mt-5 flex-row flex-wrap gap-2">
              <LinkButton href="/roadmap/administration" variant="secondary">행정로드맵</LinkButton>
              <LinkButton href="/settlement" variant="subtle">정착 지원</LinkButton>
            </View>
          </Card>
        </View>

        <Card className="mt-6 p-5">
          <Text className="text-xs leading-5 text-slate-500">{resourceDisclaimer}</Text>
        </Card>
      </View>
    </PageShell>
  );
}

function difficultyLabel(value: string) {
  if (value === "HIGH") return "준비 난이도 높음";
  if (value === "MEDIUM") return "준비 난이도 보통";
  return "준비 난이도 낮음";
}
