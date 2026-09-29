import { View, Text, Pressable } from 'react-native';
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, MetricCard, PageHeader, PageShell, SectionHeader } from "@/components/ui";
import { countryGuides, resourceDisclaimer } from "@/lib/resource-guides";

export default function CountriesPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="COUNTRY GUIDE"
        title="국가정보"
        description="국가별 채용시장 신호, 언어, 비자 확인 포인트, 정착 준비 항목을 추천 진단 이후 흐름과 연결합니다. 실제 지원 전에는 공식 출처와 고용주 안내를 함께 확인해야 합니다."
        actions={
          <>
            <LinkButton href="/recommendations/compare" variant="secondary">비교대시보드</LinkButton>
            <LinkButton href="/settlement">정착 지원</LinkButton>
          </>
        }
      />

      <View>
        <View className="flex-row gap-3 md:flex-cols-4">
          <MetricCard label="정리 국가" value={`${countryGuides.length}개`} helper="국가별 가이드" />
          <MetricCard label="핵심 기준" value="채용·비자·정착" helper="추천 이후 연결" />
          <MetricCard label="공식 링크" value="국가별 제공" helper="최종 확인 경로" />
          <MetricCard label="AI 활용" value="요약 보조" helper="판정 대신 설명" />
        </View>

        <View className="mt-6 flex-row gap-5 xl:flex-cols-2">
          {countryGuides.map((guide) => (
            <Card key={guide.country} className="p-5">
              <View className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <View>
                  <Text className="lens-kicker">COUNTRY DOSSIER</Text>
                  <Text className="mt-3 text-2xl font-semibold text-night">
                    {guide.country}
                    <Text className="ml-2 text-sm font-semibold text-brand">{guide.code}</Text>
                  </Text>
                </View>
                <Badge tone={guide.preparationDifficulty === "HIGH" ? "risk" : "warning"}>{difficultyLabel(guide.preparationDifficulty)}</Badge>
              </View>
              <Text className="mt-4 text-sm leading-7 text-slate-700">{guide.marketSummary}</Text>

              <View className="mt-5 flex-row gap-3 md:flex-cols-2">
                <InfoBlock label="주요 언어" value={guide.primaryLanguage} />
                <InfoBlock label="비자 확인 포인트" value={guide.visaFocus} />
                <InfoBlock label="정착 준비 포인트" value={guide.settlementFocus} />
                <InfoBlock label="대표 직무" value={guide.commonRoles.join(", ")} />
              </View>

              <View>
                <Checklist title="채용 신호" items={guide.hiringSignals} />
                <Checklist title="프로필 입력 팁" items={guide.profileTips} />
              </View>

              <View>
                <SectionHeader kicker="OFFICIAL LINKS" title="공식 확인 링크" />
                <View className="mt-4 flex-row gap-3">
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
            </Card>
          ))}
        </View>

        <Card className="mt-6 p-5">
          <View className="flex-row flex-wrap gap-2">
            <LinkButton href="/resources/visas" variant="secondary">비자정보로</LinkButton>
            <LinkButton href="/roadmap/administration" variant="subtle">행정로드맵으로</LinkButton>
          </View>
          <Text className="mt-4 text-xs leading-5 text-slate-500">{resourceDisclaimer}</Text>
        </Card>
      </View>
    </PageShell>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <View className="border border-line bg-panel p-4">
      <Text className="text-xs font-bold text-slate-500">{label}</Text>
      <Text className="mt-2 text-sm leading-6 text-slate-700">{value}</Text>
    </View>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
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
  if (value === "HIGH") return "준비 난이도 높음";
  if (value === "MEDIUM") return "준비 난이도 보통";
  return "준비 난이도 낮음";
}
