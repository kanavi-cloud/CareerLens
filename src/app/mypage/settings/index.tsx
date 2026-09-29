import { View, Text, Pressable } from 'react-native';
"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, LinkButton, PageHeader, PageShell } from "@/components/ui";
import { changePassword, logout, updateCurrentUser, type AuthUser } from "@/lib/auth";
import { useRouter } from "expo-router";

type AccountForm = {
  displayName: string;
  email: string;
  countryDialCode: string;
  phoneNumber: string;
  marketingOptIn: boolean;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

const initialPasswordForm: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  newPasswordConfirm: ""
};

const inputClass = "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

export default function AccountSettingsPage() {
  const auth = useRequiredAuth();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [accountForm, setAccountForm] = useState<AccountForm | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(initialPasswordForm);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!auth.user || currentUser) {
      return;
    }
    setCurrentUser(auth.user);
    setAccountForm(toAccountForm(auth.user));
  }, [auth.user, currentUser]);

  if (auth.isChecking) {
    return <AuthCheckingScreen title="계정 설정 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="계정 설정은 로그인 후 이용할 수 있습니다." />;
  }

  if (!accountForm || !currentUser) {
    return <AuthCheckingScreen title="계정 정보를 준비하는 중입니다." />;
  }

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accountForm) {
      return;
    }
    setSavingAccount(true);
    setAccountError(null);
    setAccountMessage(null);

    try {
      const updatedUser = await updateCurrentUser({
        display_name: accountForm.displayName,
        email: accountForm.email,
        country_dial_code: accountForm.countryDialCode,
        phone_number: accountForm.phoneNumber,
        marketing_opt_in: accountForm.marketingOptIn
      });
      setCurrentUser(updatedUser);
      setAccountForm(toAccountForm(updatedUser));
      setAccountMessage("계정 정보가 저장되었습니다.");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "계정 정보 저장에 실패했습니다.");
    } finally {
      setSavingAccount(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordMessage(null);

    try {
      const updatedUser = await changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        new_password_confirm: passwordForm.newPasswordConfirm
      });
      setCurrentUser(updatedUser);
      setPasswordForm(initialPasswordForm);
      setPasswordMessage("비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setSavingPassword(false);
    }
  }

  const passwordReady = passwordForm.currentPassword && passwordForm.newPassword && passwordForm.newPasswordConfirm;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="ACCOUNT SETTINGS"
        title="계정 설정"
        actions={<LinkButton href="/mypage" variant="secondary">마이페이지로</LinkButton>}
      />

      <View>
        <View className="flex-row gap-5 lg:flex-cols-[minmax(0,1fr)_300px]">
          <View className="space-y-5">
            <Card className="rounded-3xl p-6">
              <View className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
                <View>
                  <Text className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Profile Account</Text>
                  <Text className="mt-2 text-2xl font-semibold text-ink">기본 계정 정보</Text>
                </View>
                <Badge tone={currentUser.email_verified ? "success" : "warning"}>
                  {currentUser.email_verified ? "이메일 확인됨" : "이메일 확인 필요"}
                </Badge>
              </View>

              <form className="mt-6 space-y-5" onSubmit={handleAccountSubmit}>
                <View className="flex-row gap-4 md:flex-cols-2">
                  <Field label="이름">
                    <input
                      className={inputClass}
                      value={accountForm.displayName}
                      onChange={(event) => setAccountForm({ ...accountForm, displayName: event.target.value })}
                    />
                  </Field>
                  <Field label="이메일">
                    <input
                      className={inputClass}
                      type="email"
                      value={accountForm.email}
                      onChange={(event) => setAccountForm({ ...accountForm, email: event.target.value })}
                    />
                  </Field>
                  <Field label="국가번호">
                    <select
                      className={inputClass}
                      value={accountForm.countryDialCode}
                      onChange={(event) => setAccountForm({ ...accountForm, countryDialCode: event.target.value })}
                    >
                      <option value="+82">대한민국 +82</option>
                      <option value="+1">미국/캐나다 +1</option>
                      <option value="+81">일본 +81</option>
                      <option value="+44">영국 +44</option>
                      <option value="+49">독일 +49</option>
                      <option value="">선택 안 함</option>
                    </select>
                  </Field>
                  <Field label="휴대폰">
                    <input
                      className={inputClass}
                      value={accountForm.phoneNumber}
                      placeholder="01012345678"
                      onChange={(event) => setAccountForm({ ...accountForm, phoneNumber: event.target.value })}
                    />
                  </Field>
                </View>

                <View className="flex-row items-start gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={accountForm.marketingOptIn}
                    onChange={(event) => setAccountForm({ ...accountForm, marketingOptIn: event.target.checked })}
                  />
                  <Text>서비스 개선 안내와 발표용 피드백 수신에 동의합니다.</Text>
                </View>

                <StatusMessage message={accountMessage} error={accountError} />

                <View className="flex-row justify-end">
                  <Button type="submit" disabled={savingAccount}>
                    {savingAccount ? "저장 중" : "계정 정보 저장"}
                  </Button>
                </View>
              </form>
            </Card>

            <Card className="rounded-3xl p-6">
              <View className="border-b border-line pb-5">
                <Text className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Password</Text>
                <Text className="mt-2 text-2xl font-semibold text-ink">비밀번호 변경</Text>
              </View>

              <form className="mt-6 space-y-5" onSubmit={handlePasswordSubmit}>
                <View className="flex-row gap-4 md:flex-cols-3">
                  <Field label="현재 비밀번호">
                    <input
                      className={inputClass}
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                    />
                  </Field>
                  <Field label="새 비밀번호">
                    <input
                      className={inputClass}
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                    />
                  </Field>
                  <Field label="새 비밀번호 확인">
                    <input
                      className={inputClass}
                      type="password"
                      value={passwordForm.newPasswordConfirm}
                      onChange={(event) => setPasswordForm({ ...passwordForm, newPasswordConfirm: event.target.value })}
                    />
                  </Field>
                </View>

                <View className="flex-row gap-2 rounded-2xl border border-line bg-paper p-4 text-xs text-slate-600 sm:flex-cols-3">
                  <Text>8자 이상</Text>
                  <Text>영문 포함</Text>
                  <Text>숫자와 특수문자 포함</Text>
                </View>

                <StatusMessage message={passwordMessage} error={passwordError} />

                <View className="flex-row justify-end">
                  <Button type="submit" disabled={savingPassword || !passwordReady}>
                    {savingPassword ? "변경 중" : "비밀번호 변경"}
                  </Button>
                </View>
              </form>
            </Card>
          </View>

          <View className="space-y-5">
            <Card className="rounded-3xl p-6">
              <Text className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Account</Text>
              <Text className="mt-2 text-xl font-semibold text-ink">계정 상태</Text>
              <View className="mt-5 flex-row gap-3">
                <SummaryRow label="이름" value={currentUser.display_name} />
                <SummaryRow label="아이디" value={currentUser.login_id} />
                <SummaryRow label="권한" value={currentUser.admin ? "관리자" : "일반 사용자"} />
                <SummaryRow label="프로필" value={currentUser.profile_completed ? "저장 완료" : "입력 필요"} />
                <SummaryRow label="계정 상태" value={currentUser.account_status ?? "ACTIVE"} />
              </View>
            </Card>

            <Card className="rounded-3xl border-2 border-red-100 bg-red-50/30 p-6">
              <View className="border-b border-red-100 pb-5">
                <Text className="text-xs font-semibold uppercase tracking-[0.22em] text-red-600">Danger Zone</Text>
                <Text className="mt-2 text-xl font-semibold text-ink">로그아웃</Text>
                <Text className="mt-2 text-sm text-slate-600">
                  현재 기기에서 로그아웃합니다. 저장된 프로필 정보는 서버에 남아있습니다.
                </Text>
              </View>
              <View className="mt-5 flex-row justify-end">
                <Button
                  variant="outline"
                  onPress={handleLogout}
                  disabled={loggingOut}
                  className="border-red-300 bg-white text-red-600 hover:bg-red-50"
                >
                  {loggingOut ? "로그아웃 중" : "로그아웃"}
                </Button>
              </View>
            </Card>
          </View>
        </View>
      </View>
    </PageShell>
  );
}

function toAccountForm(user: AuthUser): AccountForm {
  return {
    displayName: user.display_name ?? "",
    email: user.email ?? "",
    countryDialCode: user.country_dial_code ?? "+82",
    phoneNumber: user.phone_number ?? "",
    marketingOptIn: Boolean(user.marketing_opt_in)
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="">
      <Text className="mb-2  text-sm font-semibold text-ink">{label}</Text>
      {children}
    </View>
  );
}

function StatusMessage({ message, error }: { message: string | null; error: string | null }) {
  if (!message && !error) {
    return null;
  }
  return (
    <View className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`} role="alert">
      {error ?? message}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
      <Text className="text-xs font-semibold text-slate-500">{label}</Text>
      <Text className="text-sm font-semibold text-ink">{value}</Text>
    </View>
  );
}
