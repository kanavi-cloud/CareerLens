import { View, Text, Pressable } from 'react-native';
import { SiteHeader } from "@/components/site-header";
import { Card, LinkButton, PageHeader, PageShell } from "@/components/ui";

export default function MembershipSuccessPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader kicker="PAYMENT COMPLETE" title="Pro 멤버십이 활성화되었습니다" />
      <View>
        <Card className="mx-auto max-w-2xl rounded-2xl border-slate-200 p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <Text className="text-2xl font-extrabold text-night">결제가 완료되었습니다.</Text>
          <Text className="mt-3 text-sm leading-6 text-slate-600">
            커리어 플래너 생성과 AI 문서 분석 한도가 Pro 기준으로 적용됩니다.
          </Text>
          <View className="mt-6 flex-row justify-center gap-3">
            <LinkButton href="/membership">멤버십 확인</LinkButton>
            <LinkButton href="/planner" variant="secondary">로드맵으로</LinkButton>
          </View>
        </Card>
      </View>
    </PageShell>
  );
}
