"use client";

import { SiteHeader } from "@/components/site-header";
import { Button, Card, PageShell, TextInput } from "@/components/ui";
import { login, storeUser } from "@/lib/auth";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";

const heroFeatures = [
  "저장한 프로필 이어보기",
  "추천 진단 결과 확인",
  "로드맵과 지원 관리 연결",
];

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    if (!loginId.trim() || !password) {
      setErrorMessage("아이디 또는 이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await login({
        login_id: loginId.trim().toLowerCase(),
        password,
      });
      storeUser(user);
      router.push("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <View className="w-full px-4 py-4">
        <Card className="mb-4 rounded-3xl border border-slate-200 bg-white p-5">
          <View className="mb-4 flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-blue-600">
              <Text className="text-sm font-black text-white">CL</Text>
            </View>
            <Text className="text-xl font-black text-night">CareerLens</Text>
          </View>
          <Text className="text-2xl font-black leading-tight text-night">
            준비 현황으로 돌아가기
          </Text>
          <View className="mt-4 flex-col gap-3">
            {heroFeatures.map((feature, index) => (
              <View key={feature} className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-white">
                  <Text className="text-xs font-black text-blue-600">
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                </View>
                <Text className="flex-1 text-sm font-bold text-night">
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Card className="rounded-3xl border border-slate-200 bg-white p-5">
          <View className="mb-6 flex-row items-center justify-between gap-2">
            <Text className="text-2xl font-black text-night">로그인</Text>
            <Link href="/signup" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-brand">회원가입</Text>
              </Pressable>
            </Link>
          </View>

          <View className="flex-col gap-4">
            <TextInput
              label="아이디 또는 이메일"
              value={loginId}
              onChangeText={setLoginId}
              autoComplete="username"
              autoCapitalize="none"
            />
            <TextInput
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              onSubmitEditing={submit}
            />
          </View>

          <View className="mt-3 flex-row items-center gap-2">
            <Switch value={showPassword} onValueChange={setShowPassword} />
            <Text className="text-sm text-slate-600">비밀번호 표시</Text>
          </View>

          {errorMessage ? (
            <Text className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </Text>
          ) : null}

          <Button
            onPress={submit}
            disabled={isLoading || !loginId.trim() || !password}
            className="mt-6 w-full rounded-2xl"
          >
            {isLoading ? "로그인 중" : "로그인"}
          </Button>
        </Card>
      </View>
    </PageShell>
  );
}
