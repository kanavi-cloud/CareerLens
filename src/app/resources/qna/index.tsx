import { View, Text, Pressable } from 'react-native';
import { ResourceBoard, type ResourceBoardPost } from "@/components/resources/resource-board";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, MetricCard, PageHeader, PageShell, SectionHeader } from "@/components/ui";
import { qnaItems } from "@/lib/resource-guides";

const topicGroups = [
  { title: "추천 진단", description: "프로필과 공고 패턴을 비교해 추천 결과가 나오는 방식" },
  { title: "프로필 입력", description: "희망 국가, 직무, 기술스택, 경력 정보를 입력하는 기준" },
  { title: "AI 활용", description: "추천 이유 요약, 로드맵 과제, 문서 분석에 AI가 쓰이는 방식" },
  { title: "비자 정보", description: "공식 링크와 준비 체크리스트를 함께 확인하는 원칙" }
];

const qnaBoardPosts: ResourceBoardPost[] = qnaItems.map((item, index) => ({
  id: `qna-${String(index + 1).padStart(3, "0")}`,
  category: item.tags[0] ?? "기타",
  title: item.question,
  date: `2026.05.${String(10 - Math.min(index, 5)).padStart(2, "0")}`,
  summary: item.answer,
  body: [
    item.answer,
    "관련 화면으로 이동하면 프로필 입력, 추천 진단, 로드맵 생성, 비자 정보 확인 흐름을 이어서 볼 수 있습니다.",
    "개인별 상황에 따라 결과가 달라질 수 있으므로 공고 원문과 공식 기관 안내를 함께 확인하는 것이 좋습니다."
  ],
  author: "CareerLens",
  views: 98 - index * 9,
  status: "답변완료",
  pinned: index < 2,
  tags: item.tags,
  relatedHref: item.relatedHref
}));

export default function QnaPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="Q&A BOARD"
        title="Q&A"
        description="CareerLens 이용 중 자주 생기는 질문을 정리했습니다. 추천 진단, 프로필 입력, AI 활용, 비자 정보 확인 기준을 검색과 카테고리로 빠르게 찾을 수 있습니다."
        actions={
          <>
            <LinkButton href="/resources" variant="secondary">자료실</LinkButton>
            <LinkButton href="/jobs/recommendation">추천 진단</LinkButton>
          </>
        }
      />

      <View>
        <View className="flex-row gap-3 md:flex-cols-4">
          <MetricCard label="등록 질문" value={`${qnaItems.length}건`} helper="자주 묻는 질문" />
          <MetricCard label="답변 상태" value="100%" helper="답변완료" />
          <MetricCard label="주요 주제" value={`${topicGroups.length}개`} helper="추천/프로필/AI/비자" />
          <MetricCard label="연결 화면" value="제공" helper="바로 이동" />
        </View>

        <View className="mt-6 flex-row gap-4 md:flex-cols-2 xl:flex-cols-4">
          {topicGroups.map((topic) => (
            <Card key={topic.title} className="p-5">
              <Badge tone="brand">{topic.title}</Badge>
              <Text className="mt-3 text-sm leading-6 text-slate-600">{topic.description}</Text>
            </Card>
          ))}
        </View>

        <View className="mt-6">
          <ResourceBoard posts={qnaBoardPosts} apiType="QNA" allowQuestion emptyMessage="조건에 맞는 질문이 없습니다." />
        </View>

        <Card className="mt-6 p-5">
          <SectionHeader
            kicker="HELP GUIDE"
            title="질문을 해결하는 순서"
            description="공고를 먼저 고르는 것이 아니라, 내 프로필을 정리한 뒤 추천 진단과 로드맵으로 이어가면 준비 항목을 더 명확히 확인할 수 있습니다."
          />
          <View className="mt-5 flex-row gap-3 md:flex-cols-3">
            <Tip title="1. 프로필 확인" description="희망 국가, 직무, 경력, 기술스택, 언어 정보를 마이페이지에서 먼저 정리합니다." />
            <Tip title="2. 추천 진단" description="저장된 프로필과 공고별 PatternProfile을 비교해 추천 공고와 부족 요소를 확인합니다." />
            <Tip title="3. 로드맵 연결" description="추천 결과에서 커리어 플래너를 생성하고 문서 분석, 지원 관리, 행정 준비로 이어갑니다." />
          </View>
        </Card>
      </View>
    </PageShell>
  );
}

function Tip({ title, description }: { title: string; description: string }) {
  return (
    <View className="border border-line bg-white p-4">
      <Text className="text-sm font-semibold text-night">{title}</Text>
      <Text className="mt-2 text-sm leading-6 text-slate-600">{description}</Text>
    </View>
  );
}
