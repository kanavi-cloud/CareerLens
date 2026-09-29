import { View, Text, Pressable } from 'react-native';
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, MetricCard, PageHeader, PageShell, SectionHeader, TimelineCard } from "@/components/ui";
import { resourceDisclaimer, visaGuides } from "@/lib/resource-guides";

export default function VisasPage() {
  const highDifficultyCount = visaGuides.filter((guide) => guide.difficulty === "HIGH").length;

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="VISA GUIDE"
        title="비자정보"
        description="비자정보는 최신성과 공식 출처가 중요한 영역입니다. CareerLens는 비자 가능 여부를 판정하지 않고, 공고의 비자 문구를 공식 확인 링크와 행정 로드맵 체크리스트로 연결합니다."
        actions={
          <>
            <LinkButton href="/resources/countries" variant="secondary">국가정보</LinkButton>
            <LinkButton href="/roadmap/administration">행정로드맵</LinkButton>
          </>
        }
      />

      <View>
        <View className="flex-row gap-3 md:flex-cols-4">
          <MetricCard label="비자 가이드" value={`${visaGuides.length}개`} helper="국가별 시연 데이터" />
          <MetricCard label="고난도 국가" value={`${highDifficultyCount}개`} helper="스폰서/요건 확인 필요" />
          <MetricCard label="판정 방식" value="공식 링크 우선" helper="AI 법률 판단 금지" />
          <MetricCard label="연결 화면" value="행정로드맵" helper="체크리스트 전환" />
        </View>

        <View>
          <View className="space-y-4">
            {visaGuides.map((guide) => (
              <TimelineCard key={guide.country} label={guide.country} title={guide.category}>
                <View className="flex-row gap-5 xl:flex-cols-[1fr_280px]">
                  <View>
                    <View className="flex-row flex-wrap gap-2">
                      <Badge tone="brand">{guide.targetUser}</Badge>
                      <Badge tone={guide.difficulty === "HIGH" ? "risk" : "warning"}>{difficultyLabel(guide.difficulty)}</Badge>
                    </View>
                    <Text className="mt-3 text-sm leading-7 text-slate-600">{guide.summary}</Text>

                    <View>
                      <Panel title="확인해야 할 신호" items={guide.requiredSignals} />
                      <Panel title="준비 체크리스트" items={guide.checklist} />
                    </View>

                    <View>
                      <Text className="text-sm font-semibold text-amber">주의해야 할 점</Text>
                      <ul className="mt-3 space-y-2">
                        {guide.riskNotes.map((item) => (
                          <li key={item} className="text-sm leading-6 text-slate-700">- {item}</li>
                        ))}
                      </ul>
                    </View>
                  </View>

                  <View>
                    <Text className="text-xs font-bold text-slate-500">연결 화면</Text>
                    <View className="mt-3 flex flex-col gap-2">
                      <LinkButton href="/roadmap/administration" variant="secondary">행정로드맵</LinkButton>
                      <LinkButton href="/settlement" variant="subtle">정착 체크리스트</LinkButton>
                      <LinkButton href="/jobs/recommendation" variant="subtle">추천 진단</LinkButton>
                    </View>
                    <Text className="mt-4 text-xs leading-5 text-slate-500">{guide.officialReminder}</Text>
                  </View>
                </View>

                <View>
                  <SectionHeader kicker="OFFICIAL SOURCES" title="공식 확인 링크" />
                  <View className="mt-4 flex-row gap-3 md:flex-cols-2">
                    {guide.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className=" border border-line bg-white p-4 transition hover:border-night"
                      >
                        <Text className="text-sm font-semibold text-night">{link.label}</Text>
                        <Text className="mt-1 text-sm leading-6 text-slate-600">{link.description}</Text>
                      </a>
                    ))}
                  </View>
                </View>
              </TimelineCard>
            ))}
          </View>
        </View>

        <Card className="mt-6 p-5">
          <SectionHeader
            kicker="AI POLICY"
            title="AI 사용 원칙"
            description="AI는 비자 가능 여부를 판정하지 않습니다. 공고 본문에서 sponsorship, work authorization, salary, location 문구를 요약하고 사용자가 공식 링크를 확인하도록 돕는 보조 기능으로만 사용합니다."
          />
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Badge tone="muted">No legal decision</Badge>
            <Badge tone="muted">Official source first</Badge>
            <Badge tone="brand">Checklist summary</Badge>
            <Badge tone="warning">Human verification required</Badge>
          </View>
          <Text className="mt-4 text-xs leading-5 text-slate-500">{resourceDisclaimer}</Text>
        </Card>
      </View>
    </PageShell>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <View className="border border-line bg-white p-4">
      <Text className="text-sm font-semibold text-night">{title}</Text>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex-row gap-2 text-sm leading-6 text-slate-700">
            <Text className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand" />
            <Text>{item}</Text>
          </li>
        ))}
      </ul>
    </View>
  );
}

function difficultyLabel(value: string) {
  if (value === "HIGH") return "검토 난이도 높음";
  if (value === "MEDIUM") return "검토 난이도 보통";
  return "검토 난이도 낮음";
}
