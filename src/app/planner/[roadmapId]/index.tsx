"use client";

import {
  AuthCheckingScreen,
  AuthRequiredScreen,
  useRequiredAuth,
} from "@/components/auth/RequireAuth";
import {
  EmploymentFlowGuide,
  EmploymentFlowStrip,
} from "@/components/roadmap/employment-flow-guide";
import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  MetricCard,
  PageHeader,
  PageShell,
  ScoreBar,
} from "@/components/ui";
import { createApplicationFromRoadmap } from "@/lib/applications";
import {
  fetchPlannerRoadmap,
  updatePlannerTaskStatus,
  type PlannerRoadmap,
  type PlannerTask,
  type PlannerTaskStatus,
} from "@/lib/planner";
import { useParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type WeekFilter = number | "ALL";

export default function PlannerRoadmapPage() {
  const params = useParams<{ roadmapId: string }>();
  const router = useRouter();
  const auth = useRequiredAuth();
  const roadmapId = Number(params.roadmapId);
  const [roadmap, setRoadmap] = useState<PlannerRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [creatingApplication, setCreatingApplication] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekFilter>("ALL");

  useEffect(() => {
    if (auth.isChecking || !auth.user || !roadmapId) return;
    setIsLoading(true);
    setErrorMessage(null);
    fetchPlannerRoadmap(roadmapId)
      .then(setRoadmap)
      .catch((error) =>
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "로드맵을 불러오지 못했습니다."
        )
      )
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user, roadmapId]);

  const groupedTasks = useMemo(() => {
    const groups = new Map<number, PlannerTask[]>();
    roadmap?.tasks.forEach((task) => {
      const week = task.week_number ?? 1;
      groups.set(week, [...(groups.get(week) ?? []), task]);
    });
    return Array.from(groups.entries())
      .map(([week, tasks]) => ({
        week,
        tasks: tasks
          .slice()
          .sort(
            (left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0)
          ),
      }))
      .sort((left, right) => left.week - right.week);
  }, [roadmap]);

  const visibleGroups = useMemo(() => {
    if (selectedWeek === "ALL") return groupedTasks;
    return groupedTasks.filter((group) => group.week === selectedWeek);
  }, [groupedTasks, selectedWeek]);

  const completedCount =
    roadmap?.completed_task_count ??
    roadmap?.tasks.filter((task) => task.status === "DONE").length ??
    0;
  const totalTasks = roadmap?.total_task_count ?? roadmap?.tasks.length ?? 0;
  const inProgressCount =
    roadmap?.in_progress_task_count ??
    roadmap?.tasks.filter((task) => task.status === "IN_PROGRESS").length ??
    0;
  const completionRate =
    roadmap?.completion_rate ??
    (totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100));
  const remainingCount = Math.max(0, totalTasks - completedCount);
  const nextTask = useMemo(() => {
    return (
      roadmap?.tasks
        .slice()
        .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
        .find((task) => task.status !== "DONE") ?? null
    );
  }, [roadmap]);

  async function changeTaskStatus(taskId: number, status: PlannerTaskStatus) {
    setUpdatingTaskId(taskId);
    setErrorMessage(null);
    try {
      const updatedRoadmap = await updatePlannerTaskStatus(taskId, status);
      setRoadmap(updatedRoadmap);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "과제 상태를 변경하지 못했습니다."
      );
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function moveToApplicationPipeline() {
    if (!roadmap) return;
    setCreatingApplication(true);
    setErrorMessage(null);
    try {
      await createApplicationFromRoadmap(roadmap.roadmap_id);
      router.push("/applications");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "지원관리 기록을 생성하지 못했습니다."
      );
    } finally {
      setCreatingApplication(false);
    }
  }

  if (auth.isChecking) {
    return (
      <AuthCheckingScreen title="커리어 플래너 접근 권한을 확인하는 중입니다." />
    );
  }

  if (!auth.user) {
    return (
      <AuthRequiredScreen title="커리어 플래너 상세는 로그인 후 이용할 수 있습니다." />
    );
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="준비 로드맵"
        title="커리어 플래너 상세"
        actions={
          <>
            <LinkButton href="/planner" variant="secondary">
              목록
            </LinkButton>
            <LinkButton
              href={
                nextTask
                  ? `/roadmap/employment/documents?taskId=${nextTask.task_id}`
                  : "/roadmap/employment/documents"
              }
              variant="secondary"
            >
              문서 검증
            </LinkButton>
            <Button
              variant="secondary"
              disabled={!roadmap || creatingApplication}
              onPress={moveToApplicationPipeline}
            >
              {creatingApplication ? "연결 중" : "지원관리로 넘기기"}
            </Button>
          </>
        }
      />

      <View>
        {isLoading && (
          <EmptyState
            title="로드맵을 불러오는 중입니다."
            description="저장된 준비 과제와 진행 상태를 확인하고 있습니다."
          />
        )}
        {errorMessage && (
          <View className="mb-5 rounded-2xl border border-coral/30 bg-red-50 px-4 py-3">
            <Text className="text-sm font-semibold text-coral">
              {errorMessage}
            </Text>
          </View>
        )}

        {roadmap && (
          <View className="space-y-5">
            <RoadmapTopPanel
              roadmap={roadmap}
              completionRate={completionRate}
              completedCount={completedCount}
              totalTasks={totalTasks}
              remainingCount={remainingCount}
              inProgressCount={inProgressCount}
              nextTask={nextTask}
            />

            <EmploymentFlowStrip
              currentStep="planner"
              roadmapId={roadmap.roadmap_id}
              className="xl:hidden"
            />

            <View className="flex flex-col gap-4 xl:grid xl:grid-cols-[280px_minmax(0,1fr)_260px]">
              <RoadmapSummaryCard
                roadmap={roadmap}
                completionRate={completionRate}
                completedCount={completedCount}
                totalTasks={totalTasks}
                inProgressCount={inProgressCount}
              />

              <View>
                <WeekSelector
                  groupedTasks={groupedTasks}
                  selectedWeek={selectedWeek}
                  onSelect={setSelectedWeek}
                />

                <View className="mt-5 space-y-5">
                  {visibleGroups.map((group) => {
                    const doneCount = group.tasks.filter(
                      (task) => task.status === "DONE"
                    ).length;
                    const weekRate =
                      group.tasks.length === 0
                        ? 0
                        : Math.round((doneCount / group.tasks.length) * 100);
                    const weekHours = group.tasks.reduce(
                      (sum, task) => sum + (task.estimated_hours ?? 0),
                      0
                    );

                    return (
                      <WeekTaskSection
                        key={group.week}
                        week={group.week}
                        doneCount={doneCount}
                        totalCount={group.tasks.length}
                        weekHours={weekHours}
                        weekRate={weekRate}
                      >
                        <View className="flex-row gap-4">
                          {group.tasks.map((task) => (
                            <TaskCard
                              key={task.task_id}
                              task={task}
                              isNextTask={nextTask?.task_id === task.task_id}
                              isUpdating={updatingTaskId === task.task_id}
                              onStatusChange={(status) =>
                                changeTaskStatus(task.task_id, status)
                              }
                            />
                          ))}
                        </View>
                      </WeekTaskSection>
                    );
                  })}
                </View>
              </View>

              <View>
                <EmploymentFlowGuide
                  currentStep="planner"
                  roadmapId={roadmap.roadmap_id}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </PageShell>
  );
}

function RoadmapTopPanel({
  roadmap,
  completionRate,
  completedCount,
  totalTasks,
  remainingCount,
  inProgressCount,
  nextTask,
}: {
  roadmap: PlannerRoadmap;
  completionRate: number;
  completedCount: number;
  totalTasks: number;
  remainingCount: number;
  inProgressCount: number;
  nextTask: PlannerTask | null;
}) {
  return (
    <Card className="rounded-3xl border-slate-200 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-5">
      <View className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <View>
          <Text className="text-xs font-black uppercase tracking-[0.16em] text-brand">
            Progress Overview
          </Text>
          <Text className="mt-2 text-2xl font-black leading-tight text-night">
            이어갈 준비 과제
          </Text>
          <View className="mt-4 rounded-2xl border-l-4 border-brand bg-[#f8fbfa] p-4">
            <Text className="text-xs font-bold text-slate-500">다음 추천</Text>
            <Text className="mt-1 text-lg font-black leading-7 text-night">
              {nextTask?.title ?? "모든 과제를 완료했습니다."}
            </Text>
            <Text className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {roadmap.target_company} · {roadmap.target_job_title}
            </Text>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2 sm:gap-3">
          <MetricCard
            label="전체 완료율"
            value={`${completionRate}%`}
            helper={`${completedCount}/${totalTasks}개 완료`}
          />
          <MetricCard
            label="진행 중"
            value={`${inProgressCount}개`}
            helper="현재 작업 중인 과제"
          />
          <MetricCard
            label="남은 과제"
            value={`${remainingCount}개`}
            helper="다음 준비 대상"
          />
          <MetricCard
            label="기간"
            value={`${roadmap.duration_weeks}주`}
            helper="준비 로드맵"
          />
        </View>
      </View>
    </Card>
  );
}

function RoadmapSummaryCard({
  roadmap,
  completionRate,
  completedCount,
  totalTasks,
  inProgressCount,
}: {
  roadmap: PlannerRoadmap;
  completionRate: number;
  completedCount: number;
  totalTasks: number;
  inProgressCount: number;
}) {
  return (
    <View>
      <Card className="rounded-3xl border-slate-200 p-5 shadow-sm">
        <Text className="text-xs font-black uppercase tracking-[0.16em] text-brand">
          Roadmap Summary
        </Text>
        <Text className="mt-3 text-xl font-black leading-8 text-night">
          {roadmap.title}
        </Text>
        <View className="mt-5 space-y-3">
          <SummaryRow label="기업" value={roadmap.target_company} />
          <SummaryRow label="목표 직무" value={roadmap.target_job_title} />
          <SummaryRow
            label="준비 판단"
            value={readinessLabel(roadmap.readiness_status)}
          />
        </View>
        <View className="mt-5 flex-row flex-wrap gap-2 sm:gap-3">
          <MetricCard label="종합 점수" value={`${roadmap.total_score}점`} />
          <MetricCard
            label="완료 과제"
            value={`${completedCount}/${totalTasks}`}
          />
          <MetricCard label="진행 중" value={`${inProgressCount}개`} />
          <MetricCard label="생성일" value={formatDate(roadmap.created_at)} />
        </View>
        <View className="mt-5">
          <ScoreBar
            label="완료율"
            value={completionRate}
            tone={completionRate >= 80 ? "success" : "brand"}
          />
        </View>
      </Card>
    </View>
  );
}

function WeekSelector({
  groupedTasks,
  selectedWeek,
  onSelect,
}: {
  groupedTasks: Array<{ week: number; tasks: PlannerTask[] }>;
  selectedWeek: WeekFilter;
  onSelect: (week: WeekFilter) => void;
}) {
  const total = groupedTasks.reduce(
    (sum, group) => sum + group.tasks.length,
    0
  );
  const done = groupedTasks.reduce(
    (sum, group) =>
      sum + group.tasks.filter((task) => task.status === "DONE").length,
    0
  );

  return (
    <Card className="rounded-3xl border-slate-200 p-4 shadow-sm">
      <View className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <View>
          <Text className="text-xs font-black uppercase tracking-[0.16em] text-brand">
            Week Board
          </Text>
          <Text className="mt-1 text-lg font-black text-night">주차 선택</Text>
        </View>
        <View className="flex-row gap-2 overflow-x-auto pb-1">
          <WeekButton
            active={selectedWeek === "ALL"}
            label="전체"
            meta={`${done}/${total}`}
            onPress={() => onSelect("ALL")}
          />
          {groupedTasks.map((group) => {
            const doneCount = group.tasks.filter(
              (task) => task.status === "DONE"
            ).length;
            return (
              <WeekButton
                key={group.week}
                active={selectedWeek === group.week}
                label={`${group.week}주차`}
                meta={`${doneCount}/${group.tasks.length}`}
                onPress={() => onSelect(group.week)}
              />
            );
          })}
        </View>
      </View>
    </Card>
  );
}

function WeekTaskSection({
  week,
  doneCount,
  totalCount,
  weekHours,
  weekRate,
  children,
}: {
  week: number;
  doneCount: number;
  totalCount: number;
  weekHours: number;
  weekRate: number;
  children: ReactNode;
}) {
  return (
    <View>
      <View className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <View>
          <Text className="text-xs font-black uppercase tracking-[0.16em] text-brand">
            Week {week}
          </Text>
          <Text className="mt-1 text-2xl font-black text-night">
            {week}주차 과제
          </Text>
        </View>
        <View className="flex-row gap-2 text-center sm:min-w-[360px]">
          <MiniMetric label="과제" value={`${totalCount}개`} />
          <MiniMetric label="완료" value={`${doneCount}개`} />
          <MiniMetric label="예상" value={`${weekHours}시간`} />
        </View>
      </View>
      <View className="mt-4">
        <ScoreBar
          label="주차 진행률"
          value={weekRate}
          tone={weekRate >= 80 ? "success" : "brand"}
        />
      </View>
      <View className="mt-5">{children}</View>
    </View>
  );
}

function TaskCard({
  task,
  isNextTask,
  isUpdating,
  onStatusChange,
}: {
  task: PlannerTask;
  isNextTask: boolean;
  isUpdating: boolean;
  onStatusChange: (status: PlannerTaskStatus) => void;
}) {
  const [isOpenDetails, setIsOpenDetails] = useState(false);

  return (
    <Card className="p-4 sm:p-5 rounded-2xl border border-slate-200">
      <View className="flex-row flex-wrap gap-2">
        {isNextTask && <Badge tone="brand">다음 추천</Badge>}
        <Badge tone="muted">{categoryLabel(task.category)}</Badge>
        <Badge tone={statusTone(task.status)}>{statusLabel(task.status)}</Badge>
        <Badge tone="muted">{task.estimated_hours ?? 0}시간</Badge>
      </View>

      <View className="mt-4 flex-1">
        <Text className="text-lg font-black leading-7 text-night">
          {task.title}
        </Text>
        <Text className="mt-3 text-sm font-semibold leading-6 text-slate-700">
          {task.description}
        </Text>
      </View>

      <View className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <Pressable onPress={() => setIsOpenDetails((prev) => !prev)}>
          <Text className="font-black text-brand text-sm">
            {isOpenDetails
              ? "▲ 산출물과 검증 기준 접기"
              : "▼ 산출물과 검증 기준 보기"}
          </Text>
        </Pressable>
        {isOpenDetails && (
          <View className="mt-3 flex-row gap-3">
            <DetailBlock title="산출물" value={task.expected_outputs} />
            <DetailBlock title="검증 기준" value={task.verification_criteria} />
          </View>
        )}
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <StatusButton
          active={task.status === "TODO"}
          disabled={isUpdating}
          onPress={() => onStatusChange("TODO")}
        >
          대기
        </StatusButton>
        <StatusButton
          active={task.status === "IN_PROGRESS"}
          disabled={isUpdating}
          onPress={() => onStatusChange("IN_PROGRESS")}
        >
          진행 중
        </StatusButton>
        <StatusButton
          active={task.status === "DONE"}
          disabled={isUpdating}
          onPress={() => onStatusChange("DONE")}
        >
          완료
        </StatusButton>
        <LinkButton
          href={`/roadmap/employment/documents?taskId=${task.task_id}`}
          variant="secondary"
          className="min-h-9 min-w-[92px] whitespace-nowrap rounded-xl px-3 text-xs"
        >
          문서 검증
        </LinkButton>
      </View>
    </Card>
  );
}

function WeekButton({
  active,
  label,
  meta,
  onPress,
}: {
  active: boolean;
  label: string;
  meta: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityState={{ selected: active }}
      className={`min-w-[92px] rounded-2xl border px-4 py-3 text-left transition ${
        active
          ? "border-night bg-night shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-sm font-black ${
          active ? "text-white" : "text-slate-700"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`mt-1 text-xs font-semibold ${
          active ? "text-white/70" : "text-slate-500"
        }`}
      >
        {meta} 완료
      </Text>
    </Pressable>
  );
}

function StatusButton({
  active,
  disabled,
  children,
  onPress,
}: {
  active: boolean;
  disabled: boolean;
  children: ReactNode;
  onPress: () => void;
}) {
  return (
    <Button
      variant={active ? "primary" : "secondary"}
      className="min-h-9 min-w-[72px] whitespace-nowrap rounded-xl px-3 text-xs"
      disabled={disabled}
      onPress={onPress}
    >
      {children}
    </Button>
  );
}

function DetailBlock({ title, value }: { title: string; value?: string }) {
  return (
    <View className="rounded-lg bg-slate-50 p-3">
      <Text className="text-xs font-black text-slate-500">{title}</Text>
      <Text className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-night">
        {value || "미기재"}
      </Text>
    </View>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl border border-slate-200 bg-panel px-3 py-2 flex-1">
      <Text className="text-xs font-bold text-slate-500">{label}</Text>
      <Text className="mt-1 text-base font-black text-night">{value}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <Text className="text-xs font-bold text-slate-500">{label}</Text>
      <Text className="mt-1 text-sm font-black leading-6 text-night">
        {value}
      </Text>
    </View>
  );
}

function statusLabel(status: PlannerTaskStatus) {
  if (status === "DONE") return "완료";
  if (status === "IN_PROGRESS") return "진행 중";
  return "대기";
}

function statusTone(status: PlannerTaskStatus) {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "brand";
  return "warning";
}

function categoryLabel(category?: string) {
  if (!category) return "과제";
  const map: Record<string, string> = {
    TECH: "기술",
    PORTFOLIO: "포트폴리오",
    DOCUMENT: "문서",
    LANGUAGE: "언어",
    APPLICATION: "지원",
    PROJECT: "프로젝트",
  };
  return map[category] ?? category;
}

function readinessLabel(value?: string) {
  if (value === "APPLY_NOW") return "바로 지원 가능";
  if (value === "PREPARE_THEN_APPLY") return "준비 후 지원";
  if (value === "LONG_TERM_PREPARE") return "장기 준비";
  return value ?? "미정";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR");
}
