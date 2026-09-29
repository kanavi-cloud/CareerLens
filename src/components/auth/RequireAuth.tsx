import { View, Text, Pressable } from 'react-native';
"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, LinkButton, PageHeader, PageShell } from "@/components/ui";
import { getStoredUser, type AuthUser } from "@/lib/auth";

export function useRequiredAuth() {
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    setIsChecking(false);
  }, []);

  return {
    isChecking,
    isAuthenticated: Boolean(user),
    user
  };
}

export function AuthCheckingScreen({ title = "로그인 상태를 확인하는 중입니다." }: { title?: string }) {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader kicker="SECURE ACCESS" title={title} />
    </PageShell>
  );
}

export function AuthRequiredScreen({
  title = "로그인 후 이용할 수 있습니다.",
  description = "CareerLens 계정으로 로그인하면 프로필, 적합도 진단, 로드맵과 지원관리 데이터를 이어서 사용할 수 있습니다."
}: {
  title?: string;
  description?: string;
}) {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader kicker="SECURE ACCESS" title={title} />
      <View>
        <EmptyState
          title="계정 연결이 필요합니다."
          description={description}
          action={
            <View className="flex-row flex-wrap justify-center gap-2">
              <LinkButton href="/login">로그인</LinkButton>
              <LinkButton href="/signup" variant="secondary">
                회원가입
              </LinkButton>
            </View>
          }
        />
      </View>
    </PageShell>
  );
}
