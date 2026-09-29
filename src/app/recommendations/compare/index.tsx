import { View, Text, Pressable } from 'react-native';
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, MetricCard, PageHeader, PageShell, ScoreBar, SectionHeader } from "@/components/ui";
import { countryGuides } from "@/lib/resource-guides";

const countryScores = [
  { country: "미국", salary: 88, visa: 45, language: 65, settlement: 58, jobFit: 82 },
  { country: "일본", salary: 64, visa: 68, language: 55, settlement: 72, jobFit: 76 }
];

export default function RecommendationComparePage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="COMPARISON DASHBOARD"
        title="비교 대시보드"
        description="국가별 취업 준비 메리트를 연봉, 비자, 언어, 정착, 직무 적합도 관점으로 비교합니다."
        actions={<LinkButton href="/jobs/recommendation">적합도 진단으로</LinkButton>}
      />

      <View>
        <View className="flex-row gap-3 md:flex-cols-4">
          <MetricCard label="비교 국가" value="2개" helper="미국/일본" />
          <MetricCard label="비교 축" value="5개" helper="연봉/비자/언어/정착/직무" />
          <MetricCard label="데이터 성격" value="수동 검수" helper="seed/manual 기반" />
          <MetricCard label="연결 화면" value="4개" helper="추천/국가/비자/정착" />
        </View>

        <View className="mt-6 flex-row gap-5 lg:flex-cols-2">
          {countryScores.map((score) => {
            const guide = countryGuides.find((item) => item.country === score.country);
            return (
              <Card key={score.country} className="p-5">
                <View className="flex-row items-start justify-between gap-3">
                  <View>
                    <Text className="lens-kicker">COUNTRY FIT</Text>
                    <Text className="mt-3 text-2xl font-semibold text-night">{score.country}</Text>
                  </View>
                  <Badge tone={guide?.preparationDifficulty === "HIGH" ? "risk" : "warning"}>
                    {guide?.preparationDifficulty === "HIGH" ? "준비 난이도 높음" : "준비 난이도 중간"}
                  </Badge>
                </View>
                <Text className="mt-4 text-sm leading-6 text-slate-600">{guide?.marketSummary}</Text>
                <View className="mt-5 space-y-4">
                  <ScoreBar label="연봉 매력도" value={score.salary} tone="brand" />
                  <ScoreBar label="비자 준비 용이성" value={score.visa} tone={score.visa >= 65 ? "success" : "warning"} />
                  <ScoreBar label="언어 준비도" value={score.language} tone={score.language >= 65 ? "success" : "warning"} />
                  <ScoreBar label="정착 준비 용이성" value={score.settlement} tone={score.settlement >= 65 ? "success" : "warning"} />
                  <ScoreBar label="직무 적합도" value={score.jobFit} tone="brand" />
                </View>
              </Card>
            );
          })}
        </View>

        <Card className="mt-6 p-5">
          <SectionHeader
            kicker="NEXT ACTION"
            title="비교 결과를 추천/로드맵으로 연결"
            description="비교 대시보드는 아직 시연용 정적 점수이지만, 최종적으로는 마이페이지 프로필과 추천 진단 결과를 기준으로 동적으로 계산할 수 있습니다."
            actions={
              <>
                <LinkButton href="/resources/countries" variant="secondary">국가정보</LinkButton>
                <LinkButton href="/resources/visas" variant="subtle">비자정보</LinkButton>
                <LinkButton href="/settlement" variant="subtle">정착지원</LinkButton>
              </>
            }
          />
        </Card>
      </View>
    </PageShell>
  );
}
