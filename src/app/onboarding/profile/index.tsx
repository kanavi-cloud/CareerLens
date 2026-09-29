import { View, Text, Pressable } from 'react-native';
"use client";

import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, MetricCard, PageShell, SelectInput, TextInput } from "@/components/ui";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { storeUser, type AuthUser } from "@/lib/auth";
import { countryLabel, languageLevelLabel, preferenceLabel, startDateLabel, workTypeLabel } from "@/lib/display-labels";
import { domainSuggestionsFor, jobFamilies, projectSuggestionsFor, skillSuggestionsFor } from "@/lib/job-families";
import { demoProfile, fetchUserProfile, saveUserProfile, type UserProfileRequest } from "@/lib/recommendation";

const countries = [
  "United States",
  "Japan",
  "South Korea",
  "United Kingdom",
  "Singapore",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
  "Ireland",
  "Italy",
  "Brazil",
  "India",
  "China",
  "Not specified"
];
const citiesByCountry: Record<string, string[]> = {
  "United States": ["San Francisco", "Seattle", "New York", "Austin", "Los Angeles", "Remote", "Not specified"],
  Japan: ["Tokyo", "Osaka", "Fukuoka", "Nagoya", "Remote", "Not specified"],
  "South Korea": ["Seoul", "Pangyo", "Remote", "Not specified"],
  "United Kingdom": ["London", "Manchester", "Remote", "Not specified"],
  Singapore: ["Singapore", "Remote", "Not specified"],
  Canada: ["Toronto", "Vancouver", "Montreal", "Remote", "Not specified"],
  Australia: ["Sydney", "Melbourne", "Remote", "Not specified"],
  Germany: ["Berlin", "Munich", "Hamburg", "Remote", "Not specified"],
  France: ["Paris", "Remote", "Not specified"],
  Netherlands: ["Amsterdam", "Remote", "Not specified"],
  Ireland: ["Dublin", "Remote", "Not specified"],
  Italy: ["Milan", "Rome", "Remote", "Not specified"],
  Brazil: ["Sao Paulo", "Remote", "Not specified"],
  India: ["Bengaluru", "Hyderabad", "Gurugram", "Remote", "Not specified"],
  China: ["Shanghai", "Beijing", "Shenzhen", "Remote", "Not specified"],
  "Not specified": ["Not specified"]
};
const languageLevels = ["BASIC", "CONVERSATIONAL", "BUSINESS", "FLUENT", "NATIVE"];
const workTypes = ["Onsite", "Hybrid", "Remote", "Not specified"];
const startDates = ["Immediately", "Within 1 month", "Within 3 months", "After 6 months"];
const certSuggestions = ["AWS Cloud Practitioner", "AWS SAA", "TOEIC", "JLPT N2", "JLPT N1", "정보처리기사", "PMP"];
const preferenceSuggestions = ["Visa support", "Hybrid", "Remote", "Relocation support", "Global team", "High salary"];
export default function ProfileOnboardingPage() {
  const router = useRouter();
  const auth = useRequiredAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfileRequest>(demoProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (auth.isChecking) {
      return;
    }
    if (!auth.user) {
      return;
    }

    const storedUser = auth.user;
    setUser(storedUser);
    const baseProfile = {
      ...demoProfile,
      user_id: storedUser.user_id,
      display_name: storedUser.display_name,
      email: storedUser.email
    };
    setProfile(baseProfile);

    fetchUserProfile(storedUser.user_id)
      .then((storedProfile) => {
        if (cancelled) return;
        setProfile({
          ...baseProfile,
          ...storedProfile,
          email: storedUser.email,
          tech_stack: cleanTags(storedProfile.tech_stack),
          certifications: cleanTags(storedProfile.certifications),
          preferences: cleanTags(storedProfile.preferences)
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [auth.isChecking, auth.user]);

  async function submit() {
    if (!user) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await saveUserProfile(user.user_id, {
        ...profile,
        user_id: user.user_id,
        email: user.email,
        tech_stack: cleanTags(profile.tech_stack),
        certifications: cleanTags(profile.certifications),
        preferences: cleanTags(profile.preferences),
        project_experience_summary: normalizeText(profile.project_experience_summary),
        domain_experience: normalizeText(profile.domain_experience)
      });
      storeUser({ ...user, profile_completed: true });
      router.push("/jobs/recommendation");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  const completion = profileCompletion(profile);
  const priorities = priorityLabels(profile);
  const availableCities = cityOptionsFor(profile.target_country);

  function handleTargetCountryChange(value: string) {
    const nextCities = cityOptionsFor(value);
    setProfile((current) => ({
      ...current,
      target_country: value,
      target_city: nextCities.includes(current.target_city ?? "") ? current.target_city : nextCities[0]
    }));
  }

  if (auth.isChecking) {
    return <AuthCheckingScreen title="프로필 설정 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="해외 취업 프로필은 로그인 후 설정할 수 있습니다." />;
  }

  return (
    <PageShell>
      <SiteHeader />

      <View>
        <View>
          <View className="lens-container flex flex-col gap-5 py-8 md:flex-row md:items-end md:justify-between">
            <View>
              <Text className="text-sm font-black tracking-[0.14em] text-brand">CAREERLENS PROFILE</Text>
              <Text className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-night md:text-4xl">
                내 프로필
              </Text>
              <Text className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                맞춤 공고 추천과 적합도 진단에 사용할 정보를 관리합니다.
              </Text>
            </View>
            <Button  className="w-fit shadow-[0_10px_24px_rgba(10,31,36,0.14)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(10,31,36,0.18)]" onPress={submit} disabled={isLoading}>
              {isLoading ? "저장 중" : "저장하고 추천 보기"}
            </Button>
          </View>
        </View>

        <View>
          <View>
            <Card className="rounded-[22px] p-5">
              <View className="flex-row items-start justify-between gap-4">
                <View>
                  <Text className="text-xs font-black tracking-[0.14em] text-brand">작성 현황</Text>
                  <Text className="mt-3 text-lg font-black tracking-[-0.03em] text-night">{profile.display_name}</Text>
                  <Text className="mt-1 text-sm text-slate-600">{profile.email}</Text>
                </View>
                <Text className="text-xl font-black text-night">{completion}%</Text>
              </View>
              <View className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8ece8]">
                <View className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${completion}%` }} />
              </View>
              <View className="mt-4 flex-row gap-2 gap-2">
                <MetricCard label="경력" value={`${profile.experience_years ?? 0}년`} />
                <MetricCard label="직무" value={profile.target_job_family} />
              </View>
            </Card>

            <Card className="rounded-[22px] p-5">
              <Text className="text-sm font-black text-night">추천 기준 설정</Text>
              <View className="mt-3 space-y-2">
                <PriorityToggle label="연봉" checked={Boolean(profile.prioritize_salary)} onChange={(value) => setProfile({ ...profile, prioritize_salary: value })} />
                <PriorityToggle label="합격 가능성" checked={Boolean(profile.prioritize_acceptance_probability)} onChange={(value) => setProfile({ ...profile, prioritize_acceptance_probability: value })} />
                <PriorityToggle label="워라밸" checked={Boolean(profile.prioritize_work_life_balance)} onChange={(value) => setProfile({ ...profile, prioritize_work_life_balance: value })} />
                <PriorityToggle label="기업 가치" checked={Boolean(profile.prioritize_company_value)} onChange={(value) => setProfile({ ...profile, prioritize_company_value: value })} />
                <PriorityToggle label="직무 적합도" checked={Boolean(profile.prioritize_job_fit)} onChange={(value) => setProfile({ ...profile, prioritize_job_fit: value })} />
              </View>
              <View className="mt-4 flex-row flex-wrap gap-2">
                {priorities.map((priority) => <Badge key={priority} tone="brand">{priority}</Badge>)}
                {priorities.length === 0 && <Badge tone="muted">우선순위 미선택</Badge>}
              </View>
            </Card>
          </View>

          <View className="space-y-5">
            {errorMessage && (
              <View role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </View>
            )}

            <Section step="01" title="기본 정보" description="희망 국가와 직무 기준을 입력합니다.">
              <ProfileTextInput label="이름" value={profile.display_name} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} />
              <ProfileTextInput label="이메일" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} />
              <SelectField label="희망 국가" value={profile.target_country} options={countries} optionLabel={countryLabel} onChange={handleTargetCountryChange} />
              <SelectField label="희망 도시" value={profile.target_city ?? ""} options={availableCities} onChange={(value) => setProfile({ ...profile, target_city: value })} />
              <SelectField label="희망 직무군" value={profile.target_job_family} options={jobFamilies} onChange={(value) => setProfile({ ...profile, target_job_family: value })} />
              <ProfileTextInput label="희망 직무명" value={profile.desired_job_title ?? ""} onChange={(event) => setProfile({ ...profile, desired_job_title: event.target.value })} />
              <SelectField label="선호 근무형태" value={profile.preferred_work_type ?? "Hybrid"} options={workTypes} optionLabel={workTypeLabel} onChange={(value) => setProfile({ ...profile, preferred_work_type: value })} />
              <SelectField label="입사 가능 시점" value={profile.available_start_date ?? "Within 3 months"} options={startDates} optionLabel={startDateLabel} onChange={(value) => setProfile({ ...profile, available_start_date: value })} />
            </Section>

            <Section step="02" title="경력과 역량" description="경력, 프로젝트, 기술 정보를 추천 기준에 반영합니다.">
              <NumberField label="총 경력 연차" value={profile.experience_years ?? 0} onChange={(value) => setProfile({ ...profile, experience_years: value })} />
              <NumberField label="직무 관련 경력 연차" value={profile.related_experience_years ?? 0} onChange={(value) => setProfile({ ...profile, related_experience_years: value })} />
              <TextTagInput label="대표 프로젝트 경험" value={profile.project_experience_summary ?? ""} suggestions={projectSuggestionsFor(profile.target_job_family)} onChange={(value) => setProfile({ ...profile, project_experience_summary: value })} />
              <TextTagInput label="산업/도메인 경험" value={profile.domain_experience ?? ""} suggestions={domainSuggestionsFor(profile.target_job_family)} onChange={(value) => setProfile({ ...profile, domain_experience: value })} />
              <TagInput label="기술 스택" tags={profile.tech_stack} suggestions={skillSuggestionsFor(profile.target_job_family)} onChange={(tags) => setProfile({ ...profile, tech_stack: tags })} />
              <TagInput label="자격증/시험" tags={profile.certifications} suggestions={certSuggestions} onChange={(tags) => setProfile({ ...profile, certifications: tags })} />
            </Section>

            <Section step="03" title="언어와 학력" description="언어 수준과 학력 정보는 국가별 공고 조건 비교에 사용됩니다.">
              <SelectField label="대표 언어 수준" value={profile.language_level} options={languageLevels} optionLabel={languageLevelLabel} onChange={(value) => setProfile({ ...profile, language_level: value })} />
              <SelectField label="영어 수준" value={profile.english_level ?? "BUSINESS"} options={languageLevels} optionLabel={languageLevelLabel} onChange={(value) => setProfile({ ...profile, english_level: value })} />
              <SelectField label="일본어 수준" value={profile.japanese_level ?? "BASIC"} options={languageLevels} optionLabel={languageLevelLabel} onChange={(value) => setProfile({ ...profile, japanese_level: value })} />
              <ProfileTextInput label="어학 점수" value={profile.language_test_scores ?? ""} onChange={(event) => setProfile({ ...profile, language_test_scores: event.target.value })} placeholder="예: TOEIC 860, JLPT N2" />
              <ProfileTextInput label="최종 학력" value={profile.education} onChange={(event) => setProfile({ ...profile, education: event.target.value })} />
              <ProfileTextInput label="전공" value={profile.major ?? ""} onChange={(event) => setProfile({ ...profile, major: event.target.value })} />
            </Section>

            <Section step="04" title="지원 조건과 증빙" description="연봉, 비자, GitHub, 포트폴리오 정보를 입력합니다.">
              <View className="flex-row gap-4 md:col-span-2 lg:flex-cols-2">
                <View className="space-y-4 rounded-2xl border border-line bg-panel/50 p-4">
                  <View>
                    <Text className="text-sm font-black text-night">지원 조건</Text>
                    <Text className="mt-1 text-xs leading-5 text-slate-500">연봉, 비자, 근무 선호 조건을 정리합니다.</Text>
                  </View>
                  <ProfileTextInput label="희망 연봉" value={profile.expected_salary_range ?? ""} onChange={(event) => setProfile({ ...profile, expected_salary_range: event.target.value })} placeholder="예: USD 100k-130k / Not specified" />
                  <Toggle label="비자 스폰서십 필요 또는 확인 필요" checked={Boolean(profile.visa_sponsorship_needed)} onChange={(value) => setProfile({ ...profile, visa_sponsorship_needed: value })} />
                  <TagInput label="선호 조건" tags={profile.preferences} suggestions={preferenceSuggestions} tagLabel={preferenceLabel} onChange={(tags) => setProfile({ ...profile, preferences: tags })} />
                </View>

                <View className="space-y-4 rounded-2xl border border-line bg-panel/50 p-4">
                  <View>
                    <Text className="text-sm font-black text-night">증빙 자료</Text>
                    <Text className="mt-1 text-xs leading-5 text-slate-500">GitHub와 포트폴리오 보유 여부 및 링크를 입력합니다.</Text>
                  </View>
                  <View className="flex-row gap-3 sm:flex-cols-2">
                    <Toggle label="GitHub 보유" checked={profile.github_present} onChange={(value) => setProfile({ ...profile, github_present: value })} />
                    <Toggle label="포트폴리오 보유" checked={profile.portfolio_present} onChange={(value) => setProfile({ ...profile, portfolio_present: value })} />
                  </View>
                  <ProfileTextInput label="GitHub URL" value={profile.github_url ?? ""} onChange={(event) => setProfile({ ...profile, github_url: event.target.value })} />
                  <ProfileTextInput label="포트폴리오 URL" value={profile.portfolio_url ?? ""} onChange={(event) => setProfile({ ...profile, portfolio_url: event.target.value })} />
                </View>
              </View>
            </Section>

            <View className="sticky bottom-0 z-10 -mx-5 border-t border-line bg-[#f6f8f4]/90 px-5 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0">
              <View className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-panel sm:flex-row sm:items-center sm:justify-between">
                <Text className="text-sm font-semibold text-slate-600">저장 후 맞춤추천 화면으로 이동합니다.</Text>
                <Button  className="hover:-translate-y-0.5 hover:shadow-lg" onPress={submit} disabled={isLoading}>{isLoading ? "저장 중" : "프로필 저장 후 추천 보기"}</Button>
              </View>
            </View>
          </View>
        </View>
      </View>
    </PageShell>
  );
}

function Section({ step, title, description, children }: { step: string; title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="rounded-[22px] p-5 shadow-sm">
      <View className="mb-5 flex-row gap-3 border-b border-line pb-4">
        <Text className="mt-0.5 h-fit rounded-full border border-line bg-panel px-2.5 py-1 text-xs font-black text-brand">{step}</Text>
        <View>
          <Text className="text-lg font-black tracking-[-0.03em] text-night">{title}</Text>
          {description && <Text className="mt-1 text-sm leading-6 text-slate-600">{description}</Text>}
        </View>
      </View>
      <View className="flex-row gap-4 md:flex-cols-2">{children}</View>
    </Card>
  );
}

function SelectField({
  label,
  helper,
  value,
  options,
  optionLabel,
  onChange
}: {
  label: string;
  helper?: string;
  value: string;
  options: string[];
  optionLabel?: (value: string) => string;
  onChange: (value: string) => void;
}) {
  return (
    <ProfileSelect label={label} helper={helper} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option} value={option}>{optionLabel ? optionLabel(option) : option}</option>)}
    </ProfileSelect>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <ProfileTextInput label={label} type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  );
}

function ProfileTextInput({ label, helper, className = "", ...props }: Parameters<typeof TextInput>[0]) {
  return (
    <View className={` ${className}`}>
      <FieldLabel label={label} helper={helper} />
      <input
        className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink shadow-[0_1px_0_rgba(15,23,42,0.03)] outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:bg-slate-100"
        {...props}
      />
    </View>
  );
}

function ProfileSelect({ label, helper, children, className = "", ...props }: Parameters<typeof SelectInput>[0]) {
  return (
    <View className={` ${className}`}>
      <FieldLabel label={label} helper={helper} />
      <select
        className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink shadow-[0_1px_0_rgba(15,23,42,0.03)] outline-none transition duration-200 hover:border-slate-300 focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:bg-slate-100"
        {...props}
      >
        {children}
      </select>
    </View>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <Pressable
      
      onPress={() => onChange(!checked)}
      className={`flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition duration-200 hover:border-slate-300 ${
        checked ? "border-brand/30 bg-[#e8f2f1] text-brand" : "border-line bg-white text-slate-600 hover:border-slate-300"
      }`}
    >
      <Text>{label}</Text>
      <Text className={`rounded-full px-2.5 py-1 text-xs font-black ${checked ? "bg-white text-brand" : "bg-panel text-slate-500"}`}>
        {checked ? "ON" : "OFF"}
      </Text>
    </Pressable>
  );
}

function PriorityToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <Pressable
      
      onPress={() => onChange(!checked)}
      className={`group flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition duration-200 ${
        checked ? "border-brand/30 bg-[#e8f2f1] text-brand" : "border-line bg-white text-slate-600 hover:border-slate-300"
      }`}
    >
      <Text className=" text-sm font-semibold">{label}</Text>
      <Text className={`h-2.5 w-2.5 rounded-full transition ${checked ? "bg-brand" : "bg-slate-300 group-hover:bg-slate-400"}`} />
    </Pressable>
  );
}

function TagInput({
  label,
  helper,
  tags,
  suggestions,
  tagLabel,
  onChange
}: {
  label: string;
  helper?: string;
  tags: string[];
  suggestions: string[];
  tagLabel?: (value: string) => string;
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addTag(value: string) {
    const next = value.trim();
    if (!next || tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, next]);
    setDraft("");
  }

  return (
    <View className="md:col-span-2">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-sm font-medium text-slate-700">{label}</Text>
        {helper && <Text className="text-xs text-slate-400">{helper}</Text>}
      </View>
      <View className="mt-1 rounded-2xl border border-line bg-white p-2 transition duration-200 focus-within:border-brand focus-within:shadow-sm">
        <View className="flex-row flex-wrap gap-2">
          {tags.map((tag) => (
            <Pressable key={tag}  onPress={() => onChange(tags.filter((item) => item !== tag))} className="rounded-xl bg-[#e8f2f1] px-3 py-1 text-sm font-semibold text-brand transition hover:bg-[#dcebea]">
              {tagLabel ? tagLabel(tag) : tag} x
            </Pressable>
          ))}
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag(draft);
              }
            }}
            onBlur={() => addTag(draft)}
            placeholder="입력 후 Enter"
            className="h-8 min-w-36 flex-1 border-0 bg-transparent px-1 text-sm outline-none"
          />
        </View>
      </View>
      {suggestions.length > 0 && (
        <details className="mt-2 rounded-2xl border border-line bg-panel/70 transition duration-200 open:border-brand/30 open:bg-[#f4faf9]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-bold text-slate-700 transition duration-200 hover:text-brand [&::-webkit-details-marker]:hidden">
            <Text>추천 항목</Text>
            <Text className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-black text-brand">
              {suggestions.length}개 보기
            </Text>
          </summary>
          <View className="flex-row flex-wrap gap-2 border-t border-line px-3 py-3">
            {suggestions.map((suggestion) => (
              <Pressable key={suggestion}  onPress={() => addTag(suggestion)} className="rounded-xl border border-line bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition duration-200 hover:border-brand hover:text-brand">
                + {tagLabel ? tagLabel(suggestion) : suggestion}
              </Pressable>
            ))}
          </View>
        </details>
      )}
    </View>
  );
}

function TextTagInput({
  label,
  helper,
  value,
  suggestions,
  tagLabel,
  onChange
}: {
  label: string;
  helper?: string;
  value: string;
  suggestions: string[];
  tagLabel?: (value: string) => string;
  onChange: (value: string) => void;
}) {
  return <TagInput label={label} helper={helper} tags={tagsFromText(value)} suggestions={suggestions} tagLabel={tagLabel} onChange={(tags) => onChange(tags.join(", "))} />;
}

function cityOptionsFor(country: string) {
  return citiesByCountry[country] ?? ["Remote", "Not specified"];
}

function tagsFromText(value: string) {
  return cleanTags(value.split(","));
}

function cleanTags(values: string[] | undefined) {
  if (!values) return [];
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, array) => array.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);
}

function normalizeText(value: string | undefined) {
  return tagsFromText(value ?? "").join(", ");
}

function profileCompletion(profile: UserProfileRequest) {
  const checks = [
    profile.target_country,
    profile.target_job_family,
    profile.experience_years !== undefined,
    profile.language_level,
    profile.education,
    profile.tech_stack.length > 0,
    profile.certifications.length > 0,
    profile.github_present,
    profile.portfolio_present,
    priorityLabels(profile).length > 0
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function priorityLabels(profile: UserProfileRequest) {
  const labels = [];
  if (profile.prioritize_salary) labels.push("연봉");
  if (profile.prioritize_acceptance_probability) labels.push("합격 가능성");
  if (profile.prioritize_work_life_balance) labels.push("워라밸");
  if (profile.prioritize_company_value) labels.push("기업 가치");
  if (profile.prioritize_job_fit) labels.push("직무 적합도");
  return labels;
}
