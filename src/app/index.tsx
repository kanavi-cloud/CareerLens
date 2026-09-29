import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageShell, ScoreBar } from "@/components/ui";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

const heroStats = [
  { label: "추천 후보", value: "Top 5", helper: "프로필 기준 선별" },
  { label: "진단 항목", value: "5개", helper: "기술, 경력, 언어, 증빙" },
  { label: "실행 연결", value: "8주", helper: "준비 로드맵으로 전환" },
];

const processSteps = [
  {
    step: "01",
    title: "프로필 입력",
    description: "희망 국가, 직무, 경력, 기술스택을 정리합니다.",
    href: "/onboarding/profile",
  },
  {
    step: "02",
    title: "공고 매칭",
    description: "내 조건에 맞는 해외 공고를 빠르게 좁힙니다.",
    href: "/jobs",
  },
  {
    step: "03",
    title: "적합도 진단",
    description: "공고별 가능성과 부족 요소를 확인합니다.",
    href: "/jobs/recommendation",
  },
  {
    step: "04",
    title: "준비 로드맵",
    description: "보완 항목을 실행 가능한 과제로 바꿉니다.",
    href: "/planner",
  },
  {
    step: "05",
    title: "지원 관리",
    description: "관심 공고와 지원 상태를 이어서 관리합니다.",
    href: "/applications",
  },
];

const serviceCards = [
  {
    label: "JOBS",
    title: "채용공고",
    description: "국가, 직무군, 기술스택 조건으로 공고를 검색합니다.",
    href: "/jobs",
    tone: "blue",
    tags: ["전체 공고", "필터", "인기 공고"],
  },
  {
    label: "MATCH",
    title: "맞춤추천",
    description: "프로필과 공고 패턴을 기준으로 추천 후보를 정렬합니다.",
    href: "/jobs/recommendation",
    tone: "coral",
    tags: ["추천 후보", "패턴 비교", "근거"],
  },
  {
    label: "FIT",
    title: "적합도 진단",
    description: "합격 가능성, 직무 적합도, 리스크를 수치로 확인합니다.",
    href: "/jobs/recommendation",
    tone: "slate",
    tags: ["점수", "부족 요소", "다음 액션"],
  },
  {
    label: "PLAN",
    title: "준비 로드맵",
    description: "부족한 역량을 주차별 준비 과제로 전환합니다.",
    href: "/planner",
    tone: "mint",
    tags: ["8주 계획", "과제", "체크리스트"],
  },
  {
    label: "DATA",
    title: "자료실",
    description: "국가, 비자, 공지, Q&A 정보를 한 곳에서 확인합니다.",
    href: "/resources",
    tone: "violet",
    tags: ["국가정보", "비자", "Q&A"],
  },
];

const evidenceItems = [
  ["공고 데이터", "직무, 경력, 기술스택, 비자 조건을 구조화합니다.", "72%"],
  ["합격자 패턴", "직원 표본과 합격자 기준으로 비교 기준을 만듭니다.", "84%"],
  ["준비 로드맵", "부족 요소를 주차별 과제와 체크리스트로 변환합니다.", "68%"],
];

const previewActions = [
  {
    title: "공고 저장",
    helper: "관심 목록에 보관",
    href: "/mypage/saved-jobs",
  },
  {
    title: "비교하기",
    helper: "추천 후보와 나란히 보기",
    href: "/recommendations/compare",
  },
  { title: "로드맵 생성", helper: "부족 요소를 과제로 전환", href: "/planner" },
];

export default function Home() {
  return (
    <PageShell>
      <SiteHeader />

      <View className="w-full px-4 py-6">
        {/* Hero Section */}
        <View className="relative mb-12">
          <View className="w-full flex-col gap-8">
            <View className="w-full">
              <View className="self-start rounded-full border border-slate-200 bg-white px-3 py-1">
                <Text className="text-xs font-bold text-teal-700">
                  OVERSEAS JOB INTELLIGENCE
                </Text>
              </View>

              <Text className="mt-6 text-3xl font-black leading-tight tracking-tight text-slate-900">
                해외 채용공고 탐색부터 지원 준비까지
              </Text>

              <Text className="mt-4 text-base leading-7 text-slate-700">
                공고 조건, 프로필, 적합도 진단 결과를 연결해 추천 공고와 부족
                요소, 준비 로드맵을 한 화면에서 확인합니다.
              </Text>

              <View className="mt-8 flex-row flex-wrap gap-3">
                <LinkButton
                  href="/jobs/recommendation"
                  className="rounded-full px-6 shadow-sm"
                >
                  적합도 진단 시작
                </LinkButton>
                <LinkButton
                  href="/jobs"
                  variant="secondary"
                  className="rounded-full border border-slate-200 bg-white px-6"
                >
                  전체 공고 보기
                </LinkButton>
              </View>

              <View className="mt-8 w-full flex-col gap-3">
                {heroStats.map((stat) => (
                  <View
                    key={stat.label}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <Text className="text-xs font-semibold text-slate-500">
                      {stat.label}
                    </Text>
                    <Text className="mt-1 text-2xl font-black text-slate-900">
                      {stat.value}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-500">
                      {stat.helper}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <HeroPreview />
          </View>
        </View>

        {/* Service Flow Section */}
        <View className="mb-12">
          <View className="mb-6 w-full flex-col gap-2">
            <View>
              <View className="self-start rounded-full border border-slate-200 bg-white px-3 py-1">
                <Text className="text-xs font-bold text-teal-700">
                  SERVICE FLOW
                </Text>
              </View>
              <Text className="mt-3 text-2xl font-black text-slate-900">
                추천에서 지원까지
              </Text>
            </View>
            <Text className="text-sm text-slate-600">
              공고를 보는 순간부터 실제 지원 준비까지 이어지는 CareerLens의 기본
              흐름입니다.
            </Text>
          </View>

          <View className="w-full flex-col gap-3">
            {processSteps.map((item) => (
              <Link key={item.step} href={item.href as any} asChild>
                <Pressable className="w-full">
                  <Card className="w-full rounded-2xl border border-slate-200 bg-white p-5">
                    <View className="self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                      <Text className="text-xs font-black text-teal-700">
                        {item.step}
                      </Text>
                    </View>
                    <Text className="mt-4 text-lg font-black text-slate-900">
                      {item.title}
                    </Text>
                    <Text className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </Text>
                  </Card>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        {/* Menu Section */}
        <View className="mb-12">
          <View className="mb-6 w-full flex-col gap-2">
            <View>
              <View className="self-start rounded-full border border-slate-200 bg-white px-3 py-1">
                <Text className="text-xs font-bold text-teal-700">MENU</Text>
              </View>
              <Text className="mt-3 text-2xl font-black text-slate-900">
                CareerLens 주요 서비스
              </Text>
            </View>
            <Text className="text-sm text-slate-600">
              탐색, 추천, 진단, 로드맵, 자료 확인을 메인에서 바로 시작할 수
              있습니다.
            </Text>
          </View>

          <View className="w-full flex-col gap-4">
            {serviceCards.map((service) => (
              <ServiceCard key={service.title} service={service} />
            ))}
          </View>
        </View>

        {/* Data Evidence Section */}
        <View className="mb-8">
          <View className="w-full flex-col gap-6">
            <View className="w-full">
              <View className="self-start rounded-full border border-slate-200 bg-white px-3 py-1">
                <Text className="text-xs font-bold text-teal-700">
                  DATA EVIDENCE
                </Text>
              </View>
              <Text className="mt-3 text-2xl font-black text-slate-900">
                추천 근거 데이터
              </Text>
              <Text className="mt-3 text-sm leading-6 text-slate-600">
                CareerLens는 단순 공고 목록이 아니라, 공고 조건과 프로필 기준을
                연결해 다음 준비를 판단할 수 있게 돕습니다.
              </Text>
            </View>

            <View className="w-full flex-col gap-4">
              {evidenceItems.map(([name, detail, progress]) => (
                <EvidenceCard
                  key={name}
                  name={name}
                  detail={detail}
                  progress={progress}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </PageShell>
  );
}

function HeroPreview() {
  return (
    <View className="flex-1 w-full">
      <Card className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-lg">
        <View className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <View className="flex flex-row items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <View className="flex flex-row gap-1.5">
              <View className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <View className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <View className="h-2.5 w-2.5 rounded-full bg-teal-500" />
            </View>
            <Text className="text-xs font-black text-slate-500">
              DIAGNOSIS REPORT
            </Text>
          </View>

          <View className="flex flex-col gap-4">
            <View className="flex flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
              <View className="flex-1">
                <Text className="text-xs font-black text-teal-700">
                  RECOMMENDED JOB
                </Text>
                <Text className="mt-1 text-lg font-black text-slate-900">
                  Northstar Security
                </Text>
                <Text className="mt-1 text-xs text-slate-600">
                  Cloud Backend Engineer · 미국 · 하이브리드
                </Text>
              </View>
              <View className="rounded-xl bg-slate-900 px-4 py-2 items-center">
                <Text className="text-[10px] font-bold text-slate-400">
                  TOTAL
                </Text>
                <Text className="text-2xl font-black text-white">82</Text>
              </View>
            </View>

            <View className="flex flex-col gap-3">
              <ScoreBar label="합격 가능성" value={82} tone="brand" />
              <ScoreBar label="직무 적합도" value={88} tone="success" />
              <ScoreBar label="역량 매력도" value={78} tone="warning" />
              <ScoreBar label="위험도" value={36} tone="risk" />
            </View>

            <View className="flex flex-col gap-3 sm:flex-row">
              <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
                <Text className="text-xs font-bold text-teal-700">
                  부족 요소
                </Text>
                <View className="mt-2 flex flex-row flex-wrap gap-1.5">
                  <Badge tone="warning">Distributed Systems</Badge>
                  <Badge tone="warning">GitHub 증빙</Badge>
                  <Badge tone="warning">포트폴리오 사례</Badge>
                </View>
              </View>

              <Link href="/planner" asChild>
                <Pressable className="rounded-2xl border border-slate-200 bg-white p-4 justify-center">
                  <Text className="text-xs font-bold text-teal-700">
                    다음 액션
                  </Text>
                  <Text className="mt-1 text-base font-black text-slate-900">
                    8주 로드맵
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    보완 과제로 연결
                  </Text>
                </Pressable>
              </Link>
            </View>

            <View className="rounded-2xl border border-slate-200 bg-white p-4">
              <View className="flex flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-teal-700">
                  추가 액션
                </Text>
                <View className="rounded-full bg-teal-50 px-2 py-0.5">
                  <Text className="text-[10px] font-black text-teal-700">
                    3개
                  </Text>
                </View>
              </View>
              <View className="flex flex-col gap-2 sm:flex-row">
                {previewActions.map((action) => (
                  <Link key={action.title} href={action.href as any} asChild>
                    <Pressable className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <Text className="text-xs font-black text-slate-900">
                        {action.title}
                      </Text>
                      <Text className="mt-1 text-[11px] text-slate-500">
                        {action.helper}
                      </Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
}

function ServiceCard({ service }: { service: (typeof serviceCards)[number] }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    coral: "bg-orange-50 text-orange-700",
    mint: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-700",
  }[service.tone];

  return (
    <Link href={service.href as any} asChild>
      <Pressable className="w-full">
        <Card className="w-full rounded-2xl border border-slate-200 bg-white p-5">
          <View>
            <View className={`self-start rounded-full px-3 py-1 ${toneClass}`}>
              <Text className={`text-xs font-black ${toneClass}`}>
                {service.label}
              </Text>
            </View>
            <Text className="mt-4 text-lg font-black text-slate-900">
              {service.title}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-slate-600">
              {service.description}
            </Text>
          </View>
          <View className="mt-4 flex-row flex-wrap gap-1.5">
            {service.tags.map((tag) => (
              <View key={tag} className="rounded-full bg-slate-100 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-slate-600">
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

function EvidenceCard({
  name,
  detail,
  progress,
}: {
  name: string;
  detail: string;
  progress: string;
}) {
  return (
    <Card className="flex-1 rounded-2xl bg-white p-5 border border-slate-200">
      <Text className="text-xs font-black text-teal-700">SOURCE</Text>
      <Text className="mt-2 text-lg font-black text-slate-900">{name}</Text>
      <Text className="mt-2 text-xs leading-5 text-slate-600">{detail}</Text>
      <View className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <View
          className="h-full rounded-full bg-teal-600"
          style={{ width: progress }}
        />
      </View>
      <Text className="mt-2 text-[10px] font-bold text-slate-500">
        활용 기준 {progress}
      </Text>
    </Card>
  );
}
