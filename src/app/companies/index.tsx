import { View, Text, Pressable } from 'react-native';
import { RoadmapPlaceholderPage } from "@/components/roadmap-placeholder";

export default function CompaniesPage() {
  return (
    <RoadmapPlaceholderPage
      kicker="COMPANY DOSSIER"
      title="기업 상세"
      description="기업별 공고, 직원 표본, 직무 패턴, 추천 근거를 하나의 dossier로 묶는 확장 화면입니다."
      primaryHref="/jobs"
      primaryLabel="공고 조회로"
      items={[
        { title: "기업 공고", description: "해당 기업의 수동 조사 공고를 모아 보여줍니다." },
        { title: "직원 표본", description: "익명화한 실제 직원 표본과 주요 경험 키워드를 정리합니다." },
        { title: "직무 패턴", description: "공고와 직원 표본 기반 PatternProfile을 기업 단위로 요약합니다." }
      ]}
    />
  );
}
