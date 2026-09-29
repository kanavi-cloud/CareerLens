import { View, Text, Pressable } from 'react-native';
import { ResourceBoard, type ResourceBoardPost } from "@/components/resources/resource-board";
import { SiteHeader } from "@/components/site-header";
import { Card, LinkButton, MetricCard, PageHeader, PageShell, SectionHeader } from "@/components/ui";
import { noticeItems } from "@/lib/resource-guides";

const categoryCounts = noticeItems.reduce<Record<string, number>>((acc, notice) => {
  acc[notice.category] = (acc[notice.category] ?? 0) + 1;
  return acc;
}, {});

const noticeBoardPosts: ResourceBoardPost[] = noticeItems.map((notice, index) => ({
  id: notice.id,
  category: notice.category,
  title: notice.title,
  date: notice.date,
  summary: notice.summary,
  body: [
    notice.summary,
    "자세한 내용은 연결된 화면에서 확인할 수 있습니다. 추천 진단, 공고 조회, 로드맵 생성 흐름과 함께 확인하면 준비 상태를 더 구체적으로 점검할 수 있습니다.",
    "비자, 체류자격, 고용 조건처럼 변경 가능성이 큰 정보는 반드시 공식 기관과 고용주 안내를 함께 확인해야 합니다."
  ],
  author: "CareerLens",
  views: 152 - index * 17,
  priority: notice.priority,
  pinned: notice.priority === "높음",
  relatedHref: notice.relatedHref,
  tags: [notice.category, notice.priority, notice.audience]
}));

export default function NoticesPage() {
  const highPriorityCount = noticeItems.filter((notice) => notice.priority === "높음").length;

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="NOTICE BOARD"
        title="공지사항"
        description="CareerLens 이용 안내와 공고 데이터, 추천 진단, 비자 정보 업데이트를 확인합니다. 필요한 공지는 연결 화면에서 바로 이어서 확인할 수 있습니다."
        actions={
          <>
            <LinkButton href="/resources" variant="secondary">자료실</LinkButton>
            <LinkButton href="/mypage">프로필 확인</LinkButton>
          </>
        }
      />

      <View>
        <View className="flex-row gap-3 md:flex-cols-4">
          <MetricCard label="전체 공지" value={`${noticeItems.length}건`} helper="게시판 등록" />
          <MetricCard label="중요 안내" value={`${highPriorityCount}건`} helper="우선 확인" />
          <MetricCard label="분류" value={`${Object.keys(categoryCounts).length}개`} helper="서비스/데이터/정책" />
          <MetricCard label="연결 화면" value="제공" helper="상세 확인" />
        </View>

        <View className="mt-6">
          <ResourceBoard posts={noticeBoardPosts} apiType="NOTICE" />
        </View>

        <Card className="mt-6 p-5">
          <SectionHeader
            kicker="SERVICE GUIDE"
            title="이용 전 확인할 기준"
            description="CareerLens는 추천 결과를 더 쉽게 이해하도록 돕는 서비스입니다. 공고와 비자 정보는 공식 출처 확인을 함께 진행해야 합니다."
          />
          <View className="mt-5 flex-row gap-3 md:flex-cols-3">
            <RuleCard title="프로필 최신화" description="추천 진단 전 마이페이지의 희망 국가, 직무, 기술스택, 경력 정보를 먼저 확인하세요." />
            <RuleCard title="공고 원문 확인" description="지원 전에는 공고 원문에서 근무지, 경력, 비자, 마감 여부를 다시 확인하세요." />
            <RuleCard title="공식 출처 우선" description="비자와 행정 절차는 공식 기관과 고용주 안내를 기준으로 최종 판단하세요." />
          </View>
        </Card>
      </View>
    </PageShell>
  );
}

function RuleCard({ title, description }: { title: string; description: string }) {
  return (
    <View className="border border-line bg-panel p-4">
      <Text className="text-sm font-semibold text-night">{title}</Text>
      <Text className="mt-2 text-sm leading-6 text-slate-600">{description}</Text>
    </View>
  );
}
