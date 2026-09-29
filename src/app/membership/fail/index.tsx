import { View, Text, Pressable } from 'react-native';
import { SiteHeader } from "@/components/site-header";
import { Card, LinkButton, PageHeader, PageShell } from "@/components/ui";

export default function MembershipFailPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader kicker="PAYMENT FAILED" title="결제 승인에 실패했습니다" />
      <View>
        <Card className="mx-auto max-w-2xl rounded-2xl border-slate-200 p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <Text className="text-2xl font-extrabold text-night">결제 상태를 확인하지 못했습니다.</Text>
          <Text className="mt-3 text-sm leading-6 text-slate-600">잠시 후 다시 시도하거나, 멤버십 화면에서 현재 플랜을 확인해주세요.</Text>
          <View className="mt-6 flex-row justify-center gap-3">
            <LinkButton href="/membership">멤버십 확인</LinkButton>
            <LinkButton href="/" variant="secondary">홈으로</LinkButton>
          </View>
        </Card>
      </View>
    </PageShell>
  );
}
