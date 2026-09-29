"use client";

import { SiteHeader } from "@/components/site-header";
import {
  Button,
  Card,
  PageShell,
  StatusPill,
  TextInput,
} from "@/components/ui";
import {
  checkEmailAvailability,
  checkLoginIdAvailability,
  signup,
} from "@/lib/auth";
import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";

type AvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "unavailable"
  | "error";

export default function SignupPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [securityNoticeAccepted, setSecurityNoticeAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loginIdStatus, setLoginIdStatus] =
    useState<AvailabilityStatus>("idle");
  const [loginIdError, setLoginIdError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const normalizedLoginId = loginId.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  const passwordChecks = useMemo(
    () => [
      { label: "8자 이상", passed: password.length >= 8 },
      { label: "영문 포함", passed: /[a-zA-Z]/.test(password) },
      { label: "숫자 포함", passed: /\d/.test(password) },
      { label: "특수문자 포함", passed: /[^A-Za-z0-9]/.test(password) },
      {
        label: "비밀번호 확인 일치",
        passed: password.length > 0 && password === passwordConfirm,
      },
    ],
    [password, passwordConfirm]
  );

  const loginIdValid = /^[a-zA-Z0-9._-]{4,30}$/.test(normalizedLoginId);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const displayNameValid = displayName.trim().length > 0;
  const passwordValid = passwordChecks.every((check) => check.passed);
  const requiredConsentsAccepted =
    termsAccepted && privacyAccepted && securityNoticeAccepted;
  const canSubmit =
    loginIdValid &&
    loginIdStatus === "available" &&
    displayNameValid &&
    emailValid &&
    emailStatus === "available" &&
    passwordValid &&
    requiredConsentsAccepted;

  async function checkLoginId() {
    if (!loginIdValid) {
      setLoginIdStatus("error");
      setLoginIdError("아이디 형식을 확인해주세요. (4~30자, 영문/숫자/._-)");
      return;
    }

    setLoginIdStatus("checking");
    setLoginIdError(null);
    try {
      const result = await checkLoginIdAvailability(normalizedLoginId);
      setLoginIdStatus(result.available ? "available" : "unavailable");
    } catch (error) {
      setLoginIdStatus("error");
      setLoginIdError(
        error instanceof Error
          ? error.message
          : "서버 연결을 확인하거나 나중에 다시 시도해주세요."
      );
    }
  }

  async function checkEmail() {
    if (!emailValid) {
      setEmailStatus("error");
      setEmailError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setEmailStatus("checking");
    setEmailError(null);
    try {
      const result = await checkEmailAvailability(normalizedEmail);
      setEmailStatus(result.available ? "available" : "unavailable");
    } catch (error) {
      setEmailStatus("error");
      setEmailError(
        error instanceof Error
          ? error.message
          : "서버 연결을 확인하거나 나중에 다시 시도해주세요."
      );
    }
  }

  async function submit() {
    if (!canSubmit) {
      setErrorMessage(
        "아이디와 이메일 중복 확인, 비밀번호 조건, 필수 동의 항목을 확인해주세요."
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signup({
        login_id: normalizedLoginId,
        display_name: displayName.trim(),
        email: normalizedEmail,
        password,
        password_confirm: passwordConfirm,
        terms_accepted: termsAccepted,
        privacy_accepted: privacyAccepted,
        security_notice_accepted: securityNoticeAccepted,
        marketing_opt_in: marketingOptIn,
      });
      router.push("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "회원가입 중 오류가 발생했습니다."
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
          <Text className="text-2xl font-black text-night">
            CareerLens 회원가입
          </Text>
          <Text className="mt-2 text-sm text-slate-600">
            아이디·이메일 중복 확인 후 계정을 만들 수 있습니다.
          </Text>
          <Link href="/login" asChild>
            <Pressable className="mt-3 self-start">
              <Text className="text-sm font-semibold text-brand">
                이미 계정이 있나요? 로그인
              </Text>
            </Pressable>
          </Link>
        </Card>

        <Card className="rounded-3xl border border-slate-200 bg-white p-5">
          <View className="flex-col gap-4">
            <CheckedInput
              label="아이디"
              helper="4~30자, 영문/숫자/._-"
              value={loginId}
              onChangeText={(value) => {
                setLoginId(value);
                setLoginIdStatus("idle");
                setLoginIdError(null);
              }}
              onCheck={checkLoginId}
              status={loginIdStatus}
              errorMessage={loginIdError}
              autoCapitalize="none"
              autoComplete="username"
            />

            <TextInput
              label="이름"
              value={displayName}
              onChangeText={setDisplayName}
              autoComplete="name"
            />

            <CheckedInput
              label="이메일"
              helper="로그인 및 계정 확인에 사용"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setEmailStatus("idle");
                setEmailError(null);
              }}
              onCheck={checkEmail}
              status={emailStatus}
              errorMessage={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
            />

            <TextInput
              label="비밀번호 확인"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              onSubmitEditing={submit}
            />
          </View>

          <View className="mt-3 flex-row items-center gap-2">
            <Switch value={showPassword} onValueChange={setShowPassword} />
            <Text className="text-sm text-slate-600">비밀번호 표시</Text>
          </View>

          <View className="mt-4 rounded-2xl border border-line bg-panel p-4">
            <View className="mb-3 flex-row items-center justify-between gap-2">
              <Text className="text-sm font-semibold text-night">
                비밀번호 조건
              </Text>
              <StatusPill tone={passwordValid ? "success" : "warning"}>
                {passwordValid ? "조건 충족" : "확인 필요"}
              </StatusPill>
            </View>
            <View className="flex-col gap-2">
              {passwordChecks.map((check) => (
                <Text
                  key={check.label}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                    check.passed
                      ? "border-mint/20 bg-emerald-50 text-mint"
                      : "border-line bg-white text-slate-500"
                  }`}
                >
                  {check.passed ? "완료" : "필요"} - {check.label}
                </Text>
              ))}
            </View>
          </View>

          <View className="mt-4 flex-col gap-2">
            <ConsentRow
              checked={termsAccepted}
              onChange={setTermsAccepted}
              required
              label="서비스 이용약관 동의"
            />
            <ConsentRow
              checked={privacyAccepted}
              onChange={setPrivacyAccepted}
              required
              label="개인정보 수집 및 이용 동의"
            />
            <ConsentRow
              checked={securityNoticeAccepted}
              onChange={setSecurityNoticeAccepted}
              required
              label="실제 직원 개인정보와 민감정보를 입력하지 않는다는 보안 안내 확인"
            />
            <ConsentRow
              checked={marketingOptIn}
              onChange={setMarketingOptIn}
              label="서비스 개선 안내 및 발표용 피드백 수신 동의"
            />
          </View>

          {errorMessage ? (
            <Text className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </Text>
          ) : null}

          <Button
            onPress={submit}
            disabled={isLoading || !canSubmit}
            className="mt-6 w-full rounded-2xl"
          >
            {isLoading ? "계정 생성 중" : "회원가입"}
          </Button>
        </Card>
      </View>
    </PageShell>
  );
}

function CheckedInput({
  label,
  helper,
  value,
  onChangeText,
  onCheck,
  status,
  errorMessage,
  ...inputProps
}: {
  label: string;
  helper: string;
  value: string;
  onChangeText: (value: string) => void;
  onCheck: () => void;
  status: AvailabilityStatus;
  errorMessage?: string | null;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: string;
  keyboardType?: "default" | "email-address";
}) {
  return (
    <View className="w-full">
      <View className="mb-1 flex-row items-center justify-between gap-2">
        <Text className="text-sm font-semibold text-brand">{label}</Text>
        <Text className="flex-1 text-right text-xs font-medium text-slate-400">
          {helper}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="min-w-0 flex-1">
          <TextInput
            value={value}
            onChangeText={onChangeText}
            className="mb-0"
            {...inputProps}
          />
        </View>
        <Pressable
          onPress={onCheck}
          disabled={status === "checking"}
          className="h-11 items-center justify-center rounded-xl border border-line bg-white px-3"
        >
          <Text className="text-sm font-semibold text-night">
            {status === "checking" ? "확인 중" : "중복 확인"}
          </Text>
        </Pressable>
      </View>
      {status !== "idle" ? (
        <Text
          className={`mt-2 text-xs font-semibold ${
            status === "available" ? "text-mint" : "text-coral"
          }`}
        >
          {availabilityMessage(status, errorMessage)}
        </Text>
      ) : null}
    </View>
  );
}

function availabilityMessage(status: AvailabilityStatus, customError?: string | null) {
  if (status === "checking") return "중복 여부를 확인하고 있습니다.";
  if (status === "available") return "사용 가능합니다.";
  if (status === "unavailable") return "이미 사용 중입니다.";
  if (status === "error")
    return customError || "형식을 확인하거나 서버 연결 후 다시 시도해주세요.";
  return "";
}

function ConsentRow({
  checked,
  onChange,
  label,
  required = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  required?: boolean;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      className="flex-row items-start gap-3 rounded-2xl border border-line bg-white p-3"
    >
      <Switch value={checked} onValueChange={onChange} />
      <Text className="flex-1 text-sm leading-5 text-slate-700">
        <Text
          className={`font-semibold ${
            required ? "text-coral" : "text-slate-500"
          }`}
        >
          {required ? "[필수] " : "[선택] "}
        </Text>
        {label}
      </Text>
    </Pressable>
  );
}
