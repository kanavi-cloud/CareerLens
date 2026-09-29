import { View, Text, Pressable } from 'react-native';
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageHeader, PageShell, SectionHeader, StepCard } from "@/components/ui";

export type PlaceholderItem = {
  title: string;
  description: string;
  status?: string;
};

export function RoadmapPlaceholderPage({
  kicker,
  title,
  description,
  primaryHref,
  primaryLabel,
  items
}: {
  kicker: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  items: PlaceholderItem[];
}) {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker={kicker}
        title={title}
        description={description}
        actions={<LinkButton href={primaryHref}>{primaryLabel}</LinkButton>}
      />
      <View>
        <SectionHeader
          kicker="PROTOTYPE SCOPE"
          title="시연용 확장 구조"
          description="현재는 핵심 흐름을 먼저 구현하고, 이 영역은 이후 세부 기능을 붙일 수 있도록 메뉴와 화면 구조를 열어둔 상태입니다."
        />
        <View className="mt-6 flex-row gap-4 md:flex-cols-2 xl:flex-cols-3">
          {items.map((item, index) => (
            <StepCard key={item.title} index={index + 1} title={item.title} description={item.description} />
          ))}
        </View>
        <Card className="mt-6 p-5">
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge tone="warning">확장 예정</Badge>
            <Badge tone="muted">수동 조사 데이터 기반</Badge>
            <Badge tone="muted">AI 보조 분석 가능</Badge>
          </View>
          <Text className="mt-4 text-sm leading-6 text-slate-600">
            이 페이지는 1차 시연에서 서비스 구조를 보여주기 위한 확장 지점입니다. 실제 데이터 저장과 진단은 현재 구현된
            맞춤추천, 플래너, 지원 관리, 정착 지원 흐름을 우선 사용합니다.
          </Text>
        </Card>
      </View>
    </PageShell>
  );
}
