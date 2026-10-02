"use client";

import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export type EmploymentFlowStep = "diagnosis" | "planner" | "documents" | "applications" | "departure";

type EmploymentFlowGuideProps = {
  currentStep: EmploymentFlowStep;
  roadmapId?: number | null;
  className?: string;
};

const steps: Array<{
  key: EmploymentFlowStep;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    key: "diagnosis",
    label: "적합도 진단",
    shortLabel: "진단",
    description: "내 프로필에 맞는 목표 공고를 고릅니다."
  },
  {
    key: "planner",
    label: "커리어 플래너",
    shortLabel: "플래너",
    description: "부족 요소를 주차별 준비 과제로 바꿉니다."
  },
  {
    key: "documents",
    label: "문서 검증",
    shortLabel: "문서",
    description: "이력서, 포트폴리오, GitHub를 점검합니다."
  },
  {
    key: "applications",
    label: "지원 관리",
    shortLabel: "지원",
    description: "제출 자료와 지원 상태를 정리합니다."
  },
  {
    key: "departure",
    label: "출국·행정",
    shortLabel: "출국",
    description: "합격 이후 이동과 정착 준비를 확인합니다."
  }
];

export function EmploymentFlowGuide({ currentStep, roadmapId, className = "" }: EmploymentFlowGuideProps) {
  const currentIndex = steps.findIndex((step) => step.key === currentStep);

  return (
    <View className={className}>
      <View className="flex-row items-center justify-between gap-3">
        <View>
          <Text className="text-[11px] font-black uppercase tracking-[0.16em] text-brand">Career Flow</Text>
          <Text className="mt-1 text-lg font-black text-night">준비 흐름</Text>
        </View>
        <Text className="rounded-full bg-[#e9f7f4] px-3 py-1 text-xs font-black text-[#147062]">
          {currentIndex + 1}/{steps.length}
        </Text>
      </View>

      <View className="mt-4 gap-2">
        {steps.map((step, index) => {
          const isCurrent = step.key === currentStep;
          const isDone = index < currentIndex;
          const href = getStepHref(step.key, roadmapId);

          return (
            <Link key={step.key} href={href as any} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityState={{ selected: isCurrent }}
                className={`group flex flex-cols-[28px_minmax(0,1fr)] gap-2.5 rounded-2xl border p-2.5 transition ${
                  isCurrent
                    ? "border-night bg-night text-white shadow-sm"
                    : isDone
                      ? "border-emerald-100 bg-emerald-50 text-night hover:border-emerald-200"
                      : "border-slate-200 bg-[#fbfcfd] text-night hover:border-brand/40"
                }`}
              >
                <View
                  className={`h-7 w-7 items-center justify-center rounded-full ${
                    isCurrent
                      ? "bg-white"
                      : isDone
                        ? "bg-emerald-600"
                        : "bg-white text-slate-500 ring-1 ring-slate-200"
                  }`}
                >
                  <Text className={`text-xs font-black ${isCurrent ? "text-night" : isDone ? "text-white" : "text-slate-500"}`}>
                    {isDone ? "✓" : index + 1}
                  </Text>
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className={`truncate text-sm font-black ${isCurrent ? "text-white" : "text-night"}`}>{step.label}</Text>
                    {isCurrent && <Text className="shrink-0 text-[10px] font-black text-white/70">현재</Text>}
                  </View>
                  <Text className={`mt-1  text-xs leading-4 ${isCurrent ? "text-white/75" : "text-slate-500"}`}>
                    {step.description}
                  </Text>
                </View>
              </Pressable>
            </Link>
          );
        })}
      </View>

      <View className="mt-4 rounded-2xl border border-slate-200 bg-[#f8faf9] p-3">
        <Text className="text-xs font-black text-slate-500">다음 행동</Text>
        <Text className="mt-1 text-sm font-black leading-6 text-night">{getCurrentAction(currentStep)}</Text>
      </View>
    </View>
  );
}

export function EmploymentFlowStrip({ currentStep, roadmapId, className = "" }: EmploymentFlowGuideProps) {
  const currentIndex = steps.findIndex((step) => step.key === currentStep);

  return (
    <View className={className}>
      <View className="flex-row gap-2">
        {steps.map((step, index) => {
          const isCurrent = step.key === currentStep;
          const isDone = index < currentIndex;

          return (
            <Link key={step.key} href={getStepHref(step.key, roadmapId) as any} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityState={{ selected: isCurrent }}
                className={`min-h-11 flex-row items-center gap-2 rounded-2xl border px-4 transition ${
                  isCurrent
                    ? "border-night bg-night text-white"
                    : isDone
                      ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-[#fbfcfd] text-slate-600 hover:border-brand/40"
                }`}
              >
                <Text className={`text-sm font-black ${isCurrent ? "text-white" : isDone ? "text-emerald-800" : "text-slate-600"}`}>
                  {isDone ? "✓" : index + 1}
                </Text>
                <Text className={`text-sm font-black ${isCurrent ? "text-white" : isDone ? "text-emerald-800" : "text-slate-600"}`}>
                  {step.shortLabel}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

function getStepHref(step: EmploymentFlowStep, roadmapId?: number | null) {
  if (step === "diagnosis") return "/jobs/recommendation";
  if (step === "planner") return roadmapId ? `/planner/${roadmapId}` : "/planner";
  if (step === "documents") return "/roadmap/employment/documents";
  if (step === "applications") return "/applications";
  if (step === "departure") return roadmapId ? `/roadmap/departure?roadmapId=${roadmapId}` : "/roadmap/departure";
  return "/planner";
}

function getCurrentAction(step: EmploymentFlowStep) {
  if (step === "diagnosis") return "목표 공고를 고르고 플래너를 생성하세요.";
  if (step === "planner") return "이번 주 과제를 진행하고 제출물을 준비하세요.";
  if (step === "documents") return "과제 기준에 맞게 문서와 프로젝트를 점검하세요.";
  if (step === "applications") return "지원 패키지를 확인하고 공식 Apply로 제출하세요.";
  return "출국 일정과 행정 체크리스트를 순서대로 확인하세요.";
}
