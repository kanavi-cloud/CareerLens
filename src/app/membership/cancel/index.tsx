import { View, Text, Pressable } from 'react-native';
import { SiteHeader } from "@/components/site-header";
import { Card, LinkButton, PageHeader, PageShell } from "@/components/ui";

export default function MembershipCancelPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader kicker="PAYMENT CANCELED" title="결제가 취소되었습니다" />
      <View>
        <Card className="mx-auto max-w-2xl rounded-2xl border-slate-200 p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <Text className="text-2xl font-extrabold text-night">Pro 멤버십 결제가 완료되지 않았습니다.</Text>
          <Text className="mt-3 text-sm leading-6 text-slate-600">필요하면 멤버십 화면에서 다시 결제를 시작할 수 있습니다.</Text>
          <View className="mt-6 flex-row justify-center gap-3">
            <LinkButton href="/membership">다시 시도</LinkButton>
            <LinkButton href="/planner" variant="secondary">로드맵으로</LinkButton>
          </View>
        </Card>
      </View>
    </PageShell>
  );
}
