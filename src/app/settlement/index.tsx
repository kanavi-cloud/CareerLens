import {
  AuthCheckingScreen,
  AuthRequiredScreen,
  useRequiredAuth,
} from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import {
  EmptyState,
  LinkButton,
  PageHeader,
  PageShell,
  SectionHeader,
  StepCard,
} from "@/components/ui";
import {
  fetchSettlementChecklists,
  generateSettlementGuidance,
  updateSettlementChecklistStatus,
  type SettlementChecklistItem,
  type SettlementGuidance,
  type SettlementStatus,
} from "@/lib/settlement";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

// ⭕ 옮겨진 components 경로로 대치 완료
import { timeline } from "@/components/settlement/constants";
import { CountryPanel } from "@/components/settlement/country-panel";
import { SettlementGuidanceSection } from "@/components/settlement/settlement-guidance-section";
import { SettlementMetrics } from "@/components/settlement/settlement-metrics";

export default function SettlementPage() {
  const auth = useRequiredAuth();
  const [items, setItems] = useState<SettlementChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<SettlementGuidance | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (auth.isChecking) {
      return;
    }
    if (!auth.user) {
      setIsLoading(false);
      return;
    }

    fetchSettlementChecklists(auth.user.user_id)
      .then((loadedItems) => {
        setItems(loadedItems);
        return refreshGuidance(auth.user?.user_id);
      })
      .catch((error) =>
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "정착 체크리스트를 불러오지 못했습니다."
        )
      )
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  const groupedByCountry = useMemo(() => {
    return items.reduce<Record<string, SettlementChecklistItem[]>>(
      (acc, item) => {
        acc[item.country] = [...(acc[item.country] ?? []), item];
        return acc;
      },
      {}
    );
  }, [items]);

  const doneCount = items.filter((item) => item.status === "DONE").length;
  const inProgressCount = items.filter(
    (item) => item.status === "IN_PROGRESS"
  ).length;

  async function changeStatus(
    item: SettlementChecklistItem,
    status: SettlementStatus
  ) {
    setUpdatingId(item.item_id);
    setErrorMessage(null);
    try {
      const updated = await updateSettlementChecklistStatus(
        item.item_id,
        status
      );
      setItems((current) =>
        current.map((candidate) =>
          candidate.item_id === updated.item_id ? updated : candidate
        )
      );
      setGuidance(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "정착 체크리스트 상태를 변경하지 못했습니다."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function refreshGuidance(userId = auth.user?.user_id) {
    if (!userId) {
      return;
    }
    setIsGuidanceLoading(true);
    setGuidanceError(null);
    try {
      const result = await generateSettlementGuidance(userId);
      setGuidance(result);
    } catch (error) {
      setGuidanceError(
        error instanceof Error
          ? error.message
          : "정착 준비 요약을 생성하지 못했습니다."
      );
    } finally {
      setIsGuidanceLoading(false);
    }
  }

  if (auth.isChecking) {
    return (
      <AuthCheckingScreen title="정착 지원 접근 권한을 확인하는 중입니다." />
    );
  }

  if (!auth.user) {
    return (
      <AuthRequiredScreen title="정착 지원은 로그인 후 이용할 수 있습니다." />
    );
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="SETTLEMENT SUPPORT"
        title="정착 지원"
        description="해외취업 준비가 지원에서 끝나지 않도록 비자, 출국 행정, 초기 생활 준비 항목을 사용자별 체크리스트로 관리합니다."
        actions={<LinkButton href="/applications">지원 관리로</LinkButton>}
      />

      <View>
        <View className="flex-row gap-3 md:flex-cols-3">
          {timeline.map((step, index) => (
            <StepCard
              key={step.title}
              index={index + 1}
              title={step.title}
              description={step.description}
            />
          ))}
        </View>

        <SettlementMetrics
          totalCount={items.length}
          inProgressCount={inProgressCount}
          doneCount={doneCount}
        />

        <SettlementGuidanceSection
          guidance={guidance}
          guidanceError={guidanceError}
          isGuidanceLoading={isGuidanceLoading}
          isUserReady={Boolean(auth.user)}
          onRefreshGuidance={() => refreshGuidance()}
        />

        <View className="mt-8">
          <SectionHeader
            kicker="COUNTRY CHECKLIST"
            title="국가별 정착 준비 체크리스트"
            description="처음 조회할 때 사용자별 기본 체크리스트가 DB에 생성됩니다. 상태 변경은 저장되므로 다시 접속해도 이어서 확인할 수 있습니다."
          />
        </View>

        {isLoading && (
          <View className="mt-6">
            <EmptyState
              title="정착 체크리스트를 불러오는 중입니다."
              description="로그인 사용자 기준으로 국가별 준비 항목을 확인하고 있습니다."
            />
          </View>
        )}

        {errorMessage && (
          <View className="mt-6">
            <EmptyState
              title="정착 지원 데이터를 처리하지 못했습니다."
              description={errorMessage}
            />
          </View>
        )}

        {items.length > 0 && (
          <View className="mt-6 flex-row gap-5 lg:flex-cols-2">
            {Object.entries(groupedByCountry).map(([country, countryItems]) => (
              <CountryPanel
                key={country}
                country={country}
                items={countryItems}
                updatingId={updatingId}
                onStatusChange={changeStatus}
              />
            ))}
          </View>
        )}
      </View>
    </PageShell>
  );
}
