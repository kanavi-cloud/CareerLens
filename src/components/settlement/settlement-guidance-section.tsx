import { View, Text, Pressable } from 'react-native';
import { Badge, Button, Card, ScoreBar } from "@/components/ui";
import type { SettlementChecklistItem, SettlementGuidance } from "@/lib/settlement";
import {
  countryFallbackSummaries,
  guidanceStatusLabel,
  guidanceStatusTone,
  riskLabel,
  riskTone
} from "./display";

export function SettlementGuidanceSection({
  guidance,
  guidanceError,
  isGuidanceLoading,
  isUserReady,
  onRefreshGuidance
}: {
  guidance: SettlementGuidance | null;
  guidanceError: string | null;
  isGuidanceLoading: boolean;
  isUserReady: boolean;
  onRefreshGuidance: () => void;
}) {
  return (
    <View>
      <SettlementBriefCard
        guidance={guidance}
        guidanceError={guidanceError}
        isGuidanceLoading={isGuidanceLoading}
        isUserReady={isUserReady}
        onRefreshGuidance={onRefreshGuidance}
      />
    </View>
  );
}

function SettlementBriefCard({
  guidance,
  guidanceError,
  isGuidanceLoading,
  isUserReady,
  onRefreshGuidance
}: {
  guidance: SettlementGuidance | null;
  guidanceError: string | null;
  isGuidanceLoading: boolean;
  isUserReady: boolean;
  onRefreshGuidance: () => void;
}) {
  return (
    <Card className="p-5">
      <View className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <View>
          <Text className="lens-kicker">SETTLEMENT BRIEF</Text>
          <Text className="mt-3 text-2xl font-semibold text-night">정착 준비 요약</Text>
          <Text className="mt-2 text-sm leading-6 text-slate-600">
            저장된 체크리스트와 마이페이지 프로필을 바탕으로 비자, 출국 전 준비, 초기 정착의 우선순위를 정리합니다.
          </Text>
        </View>
        <Button  variant="secondary" disabled={!isUserReady || isGuidanceLoading} onPress={onRefreshGuidance}>
          {isGuidanceLoading ? "요약 생성 중" : guidance ? "요약 새로고침" : "요약 생성"}
        </Button>
      </View>

      {guidance ? (
        <View className="mt-5 space-y-4">
          <View className="flex-row flex-wrap gap-2">
            <Badge tone={guidance.generation_mode.includes("AI") ? "brand" : "muted"}>
              {guidance.generation_mode.includes("AI") ? "AI 보조" : "규칙 기반"}
            </Badge>
            <Badge tone={guidanceStatusTone(guidance.overall_status)}>{guidanceStatusLabel(guidance.overall_status)}</Badge>
          </View>
          <ScoreBar label="전체 정착 준비율" value={guidance.completion_rate} tone={guidance.completion_rate >= 70 ? "success" : "warning"} />
          <Text className="text-sm leading-6 text-slate-700">{guidance.summary}</Text>
          <View className="rounded-xl border border-line bg-panel p-4">
            <Text className="text-xs font-bold text-slate-500">우선 액션</Text>
            <ol className="mt-3 space-y-2">
              {guidance.priority_actions.map((action, index) => (
                <li key={`${action}-${index}`} className="flex-row gap-3 text-sm leading-6 text-slate-700">
                  <Text className="font-semibold text-brand">{index + 1}</Text>
                  <Text>{action}</Text>
                </li>
              ))}
            </ol>
          </View>
          <Text className="text-xs leading-5 text-slate-500">{guidance.disclaimer}</Text>
        </View>
      ) : (
        <View className="mt-5 rounded-xl border border-dashed border-line bg-panel p-5 text-sm leading-6 text-slate-600">
          {isGuidanceLoading ? "정착 준비 요약을 생성하고 있습니다." : "요약을 생성하면 현재 체크리스트 기준의 다음 액션이 표시됩니다."}
        </View>
      )}

      {guidanceError && <Text className="mt-3 text-sm text-coral">{guidanceError}</Text>}
    </Card>
  );
}

function CountryRiskCard({
  groupedByCountry,
  guidance
}: {
  groupedByCountry: Record<string, SettlementChecklistItem[]>;
  guidance: SettlementGuidance | null;
}) {
  return (
    <Card className="p-5">
      <Text className="lens-kicker">COUNTRY RISK</Text>
      <Text className="mt-3 text-2xl font-semibold text-night">국가별 준비 상태</Text>
      <View className="mt-5 space-y-3">
        {(guidance?.country_summaries ?? countryFallbackSummaries(groupedByCountry)).map((country, countryIndex) => (
          <View key={`${country.country}-${countryIndex}`} className="rounded-xl border border-line bg-panel p-4">
            <View className="flex-row items-center justify-between gap-3">
              <View>
                <Text className="text-base font-semibold text-night">{country.country}</Text>
                <Text className="mt-1 text-xs text-slate-500">완료율 {country.completion_rate}%</Text>
              </View>
              <Badge tone={riskTone(country.risk_level)}>{riskLabel(country.risk_level)}</Badge>
            </View>
            <ul className="mt-3 space-y-1">
              {country.next_actions.slice(0, 3).map((action, actionIndex) => (
                <li key={`${country.country}-${action}-${actionIndex}`} className="text-sm leading-6 text-slate-600">- {action}</li>
              ))}
            </ul>
          </View>
        ))}
      </View>
    </Card>
  );
}
