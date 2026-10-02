"use client";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, Text, TextInput as NativeTextInput, View } from "react-native";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { EmploymentFlowGuide } from "@/components/roadmap/employment-flow-guide";
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
  TextInput,
  type Tone
} from "@/components/ui";
import { isMembershipLimitMessage } from "@/lib/membership";
import { fetchUserRoadmaps, type PlannerTask } from "@/lib/planner";
import {
  fetchTaskVerifications,
  verifyTaskFile,
  verifyTaskGithub,
  verifyTaskText,
  type VerificationBadge,
  type VerificationResult
} from "@/lib/verifications";

type SubmitMode = "TEXT" | "GITHUB" | "FILE";

type TaskOption = PlannerTask & {
  roadmapId: number;
  roadmapTitle: string;
  company: string;
  jobTitle: string;
};

const documentTypeOptions = [
  { value: "RESUME", label: "이력서" },
  { value: "COVER_LETTER", label: "자기소개서" },
  { value: "PORTFOLIO", label: "포트폴리오" },
  { value: "GITHUB_README", label: "GitHub README" },
  { value: "TASK_OUTPUT", label: "과제 산출물" }
];

const submitModes: Array<{ mode: SubmitMode; label: string; helper: string }> = [
  { mode: "TEXT", label: "직접 입력", helper: "이력서 bullet, 자기소개서 문단, README 요약을 붙여넣습니다." },
  { mode: "GITHUB", label: "GitHub", helper: "실제 repository URL과 보완 메모를 검토합니다." },
  { mode: "FILE", label: "파일 업로드", helper: "모바일 파일 선택 연동 전까지는 웹 전용 기능으로 안내합니다." }
];

export default function EmploymentDocumentsPage() {
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const router = useRouter();
  const auth = useRequiredAuth();
  const requestedTaskIdValue = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;
  const requestedTaskId = Number(requestedTaskIdValue ?? 0);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [submitMode, setSubmitMode] = useState<SubmitMode>("TEXT");
  const [documentType, setDocumentType] = useState("RESUME");
  const [submittedText, setSubmittedText] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [githubNote, setGithubNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<VerificationResult[]>([]);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (auth.isChecking) return;
    if (!auth.user) {
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    setErrorMessage("");
    setNoticeMessage("");

    fetchUserRoadmaps(auth.user.user_id)
      .then((roadmaps) => {
        const taskOptions = roadmaps
          .flatMap((roadmap) =>
            roadmap.tasks.map((task) => ({
              ...task,
              roadmapId: roadmap.roadmap_id,
              roadmapTitle: roadmap.title,
              company: roadmap.target_company,
              jobTitle: roadmap.target_job_title
            }))
          )
          .sort((a, b) => a.week_number - b.week_number || a.sort_order - b.sort_order || a.task_id - b.task_id);

        const requestedTask = requestedTaskId
          ? taskOptions.find((task) => task.task_id === requestedTaskId)
          : null;
        const nextTask = taskOptions.find((task) => task.status !== "DONE") ?? taskOptions[0] ?? null;

        setTasks(taskOptions);
        setSelectedTaskId((requestedTask ?? nextTask)?.task_id ?? null);

        if (requestedTaskId && !requestedTask && taskOptions.length > 0) {
          setNoticeMessage("선택한 과제를 찾지 못해 가장 가까운 진행 과제를 표시했습니다.");
        }
      })
      .catch((error: Error) => setErrorMessage(error.message))
      .finally(() => setIsLoadingTasks(false));
  }, [auth.isChecking, auth.user, requestedTaskId]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.task_id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const selectedRoadmapTasks = useMemo(() => {
    if (!selectedTask) return [];
    return tasks.filter((task) => task.roadmapId === selectedTask.roadmapId);
  }, [selectedTask, tasks]);

  const completedInRoadmap = selectedRoadmapTasks.filter((task) => task.status === "DONE").length;
  const selectedTaskIndex = selectedRoadmapTasks.findIndex((task) => task.task_id === selectedTaskId) + 1;
  const latestResult = useMemo(() => result ?? verificationHistory[0] ?? null, [result, verificationHistory]);

  useEffect(() => {
    if (!selectedTaskId || !auth.user) return;

    setIsLoadingHistory(true);
    fetchTaskVerifications(selectedTaskId)
      .then((items) => {
        const sorted = [...items].sort(
          (a, b) =>
            new Date(b.completed_at || b.requested_at).getTime() -
            new Date(a.completed_at || a.requested_at).getTime()
        );
        setVerificationHistory(sorted);
      })
      .catch(() => setVerificationHistory([]))
      .finally(() => setIsLoadingHistory(false));
  }, [selectedTaskId, auth.user]);

  function selectTask(taskId: number) {
    setSelectedTaskId(taskId);
    setResult(null);
    setErrorMessage("");
    setNoticeMessage("");
    router.replace(`/roadmap/employment/documents?taskId=${taskId}` as any);
  }

  function changeSubmitMode(mode: SubmitMode) {
    setSubmitMode(mode);
    setResult(null);
    if (mode === "GITHUB") {
      setDocumentType("GITHUB_README");
    }
    if (mode === "FILE" && documentType === "GITHUB_README") {
      setDocumentType("RESUME");
    }
  }

  async function handleAnalyze() {
    if (!selectedTask) {
      setErrorMessage("검증할 과제를 먼저 선택해주세요.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");
    setNoticeMessage("");
    setResult(null);

    try {
      if (submitMode === "TEXT") {
        if (submittedText.trim().length < 80) {
          throw new Error("검토할 내용을 80자 이상 입력해주세요.");
        }
        setResult(await verifyTaskText({ taskId: selectedTask.task_id, documentType, submittedText }));
      }

      if (submitMode === "GITHUB") {
        if (!isRepositoryUrl(githubUrl)) {
          throw new Error("실제 GitHub repository URL을 입력해주세요. 예: https://github.com/owner/repository");
        }
        setResult(await verifyTaskGithub({ taskId: selectedTask.task_id, githubUrl, note: githubNote }));
      }

      if (submitMode === "FILE") {
        if (!selectedFile) {
          throw new Error("분석할 PDF 또는 DOCX 파일을 선택해주세요.");
        }
        setResult(await verifyTaskFile({ taskId: selectedTask.task_id, documentType, file: selectedFile }));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "문서 분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (auth.isChecking) {
    return <AuthCheckingScreen title="AI 문서분석 접근 권한을 확인하고 있습니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="AI 문서분석은 로그인 후 이용할 수 있습니다." />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="AI DOCUMENT REVIEW"
        title="AI 문서 분석"
        description="커리어 플래너 과제 산출물을 텍스트 또는 GitHub 기준으로 검증하고 보완점을 확인합니다."
        actions={<LinkButton href="/roadmap/employment">취업로드맵으로</LinkButton>}
      />

      <View className="lens-container gap-5 pb-10">
        {isLoadingTasks ? (
          <EmptyState title="로드맵 과제를 불러오고 있습니다." description="생성된 커리어 플래너 과제를 기준으로 검증 대상을 준비하고 있습니다." />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="분석할 로드맵 과제가 없습니다."
            description="적합도 진단 또는 전체 공고에서 로드맵을 먼저 생성하면 문서 분석을 사용할 수 있습니다."
            action={<LinkButton href="/jobs/recommendation">적합도 진단 시작</LinkButton>}
          />
        ) : (
          <View className="gap-5 xl:flex-row">
            <View className="gap-5 xl:w-[360px]">
              <TaskContextCard
                tasks={tasks}
                selectedTask={selectedTask}
                selectedTaskId={selectedTaskId}
                selectedTaskIndex={selectedTaskIndex}
                roadmapTaskCount={selectedRoadmapTasks.length}
                completedInRoadmap={completedInRoadmap}
                latestResult={latestResult}
                isLoadingHistory={isLoadingHistory}
                onSelectTask={selectTask}
              />
              <ReviewStandardCard selectedTask={selectedTask} />
              <EmploymentFlowGuide currentStep="documents" roadmapId={selectedTask?.roadmapId} />
            </View>

            <View className="flex-1 gap-5">
              {noticeMessage && (
                <Card className="border-brand/25 bg-cyan-50 p-4">
                  <Text className="text-sm font-semibold text-brand">{noticeMessage}</Text>
                </Card>
              )}

              {errorMessage && (
                <Card className="border-coral/30 bg-red-50 p-4">
                  <View className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Text className="flex-1 text-sm font-semibold text-coral">{errorMessage}</Text>
                    {isMembershipLimitMessage(errorMessage) && <LinkButton href="/membership">Pro 멤버십 보기</LinkButton>}
                  </View>
                </Card>
              )}

              <SubmissionCard
                submitMode={submitMode}
                documentType={documentType}
                submittedText={submittedText}
                githubUrl={githubUrl}
                githubNote={githubNote}
                selectedFile={selectedFile}
                isAnalyzing={isAnalyzing}
                onSubmitModeChange={changeSubmitMode}
                onDocumentTypeChange={setDocumentType}
                onTextChange={setSubmittedText}
                onGithubUrlChange={setGithubUrl}
                onGithubNoteChange={setGithubNote}
                onFileChange={setSelectedFile}
                onUnsupportedFilePicker={() => setErrorMessage("모바일 앱에서는 파일 선택 모듈 연결 후 사용할 수 있습니다. 현재는 웹에서 파일 업로드를 사용할 수 있습니다.")}
                onAnalyze={handleAnalyze}
              />

              {latestResult ? (
                <AnalysisResult result={latestResult} isFresh={Boolean(result)} />
              ) : (
                <EmptyResultPreview submitMode={submitMode} />
              )}
            </View>
          </View>
        )}
      </View>
    </PageShell>
  );
}

function TaskContextCard({
  tasks,
  selectedTask,
  selectedTaskId,
  selectedTaskIndex,
  roadmapTaskCount,
  completedInRoadmap,
  latestResult,
  isLoadingHistory,
  onSelectTask
}: {
  tasks: TaskOption[];
  selectedTask: TaskOption | null;
  selectedTaskId: number | null;
  selectedTaskIndex: number;
  roadmapTaskCount: number;
  completedInRoadmap: number;
  latestResult: VerificationResult | null;
  isLoadingHistory: boolean;
  onSelectTask: (taskId: number) => void;
}) {
  return (
    <Card className="p-5">
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View>
          <Text className="lens-kicker">Review Target</Text>
          <Text className="mt-2 text-xl font-semibold text-night">검증 대상</Text>
        </View>
        {selectedTask && <Badge tone={getTaskStatusTone(selectedTask.status)}>{getTaskStatusLabel(selectedTask.status)}</Badge>}
      </View>

      <View className="gap-2">
        {tasks.slice(0, 8).map((task) => {
          const active = task.task_id === selectedTaskId;
          return (
            <Pressable
              key={task.task_id}
              onPress={() => onSelectTask(task.task_id)}
              className={`rounded-xl border p-3 ${active ? "border-night bg-night" : "border-line bg-white"}`}
            >
              <Text className={`text-sm font-semibold ${active ? "text-white" : "text-night"}`}>
                {task.company} · {task.week_number}주차
              </Text>
              <Text className={`mt-1 text-xs leading-5 ${active ? "text-white" : "text-slate-500"}`}>{task.title}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedTask && (
        <View className="mt-4 gap-4">
          <View className="rounded-xl border border-line bg-paper p-4">
            <Text className="text-sm font-semibold text-brand">{selectedTask.company}</Text>
            <Text className="mt-1 text-lg font-semibold leading-7 text-night">{selectedTask.title}</Text>
            <Text className="mt-2 text-sm text-slate-600">{selectedTask.jobTitle}</Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <MiniMetric label="주차" value={`${selectedTask.week_number}주차`} />
            <MiniMetric label="순서" value={`${selectedTaskIndex || 1}/${roadmapTaskCount || 1}`} />
            <MiniMetric label="예상 시간" value={`${selectedTask.estimated_hours || 0}시간`} />
            <MiniMetric label="완료 과제" value={`${completedInRoadmap}/${roadmapTaskCount}`} />
          </View>

          {latestResult ? (
            <View className="rounded-xl border border-line bg-white p-4">
              <View className="mb-3 flex-row items-center justify-between gap-3">
                <Text className="text-sm font-semibold text-night">최근 검증 점수</Text>
                <Badge tone="brand">{latestResult.verification_score}점</Badge>
              </View>
              <ScoreBar label="제출물 적합도" value={latestResult.verification_score} tone={getScoreTone(latestResult.verification_score)} />
            </View>
          ) : (
            <View className="rounded-xl border border-dashed border-line bg-white p-4">
              <Text className="text-sm text-slate-600">
                {isLoadingHistory ? "이전 검증 결과를 확인하고 있습니다." : "아직 검증된 제출물이 없습니다."}
              </Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

function ReviewStandardCard({ selectedTask }: { selectedTask: TaskOption | null }) {
  return (
    <Card className="p-5">
      <Text className="lens-kicker">Task Standard</Text>
      <Text className="mt-2 text-xl font-semibold text-night">검토 기준</Text>

      {selectedTask ? (
        <View className="mt-4 gap-3">
          <StandardBlock title="기대 산출물" body={selectedTask.expected_outputs || "이 과제의 산출물 기준이 아직 등록되지 않았습니다."} />
          <StandardBlock title="검증 기준" body={selectedTask.verification_criteria || "이 과제의 검증 기준이 아직 등록되지 않았습니다."} />
          <View className="flex-row flex-wrap gap-2">
            <Badge tone={getDifficultyTone(selectedTask.difficulty)}>{getDifficultyLabel(selectedTask.difficulty)}</Badge>
            <Badge tone="muted">{selectedTask.category}</Badge>
          </View>
        </View>
      ) : (
        <Text className="mt-4 text-sm text-slate-600">과제를 선택하면 기준이 표시됩니다.</Text>
      )}
    </Card>
  );
}

function SubmissionCard({
  submitMode,
  documentType,
  submittedText,
  githubUrl,
  githubNote,
  selectedFile,
  isAnalyzing,
  onSubmitModeChange,
  onDocumentTypeChange,
  onTextChange,
  onGithubUrlChange,
  onGithubNoteChange,
  onFileChange,
  onUnsupportedFilePicker,
  onAnalyze
}: {
  submitMode: SubmitMode;
  documentType: string;
  submittedText: string;
  githubUrl: string;
  githubNote: string;
  selectedFile: File | null;
  isAnalyzing: boolean;
  onSubmitModeChange: (mode: SubmitMode) => void;
  onDocumentTypeChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onGithubUrlChange: (value: string) => void;
  onGithubNoteChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onUnsupportedFilePicker: () => void;
  onAnalyze: () => void;
}) {
  const activeMode = submitModes.find((item) => item.mode === submitMode);

  function chooseFile() {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      onUnsupportedFilePicker();
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    input.onchange = () => onFileChange(input.files?.[0] ?? null);
    input.click();
  }

  return (
    <Card className="overflow-hidden p-0">
      <View className="border-b border-line p-5">
        <View className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <View>
            <Text className="lens-kicker">Submission</Text>
            <Text className="mt-2 text-2xl font-semibold text-night">제출물 분석</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {documentTypeOptions.map((option) => {
              const active = documentType === option.value;
              const disabled = submitMode === "GITHUB" && option.value !== "GITHUB_README";
              return (
                <Pressable
                  key={option.value}
                  disabled={disabled}
                  onPress={() => onDocumentTypeChange(option.value)}
                  className={`rounded-lg border px-3 py-2 ${active ? "border-night bg-night" : "border-line bg-white"} ${disabled ? "opacity-50" : ""}`}
                >
                  <Text className={`text-xs font-semibold ${active ? "text-white" : "text-night"}`}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-5 gap-2 md:flex-row">
          {submitModes.map((item) => {
            const active = submitMode === item.mode;
            return (
              <Pressable
                key={item.mode}
                onPress={() => onSubmitModeChange(item.mode)}
                className={`flex-1 rounded-xl border px-4 py-3 ${active ? "border-night bg-night" : "border-line bg-white"}`}
              >
                <Text className={`text-sm font-semibold ${active ? "text-white" : "text-night"}`}>{item.label}</Text>
                <Text className={`mt-1 text-xs leading-5 ${active ? "text-white" : "text-slate-500"}`}>{item.helper}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="p-5">
        {submitMode === "TEXT" && (
          <View>
            <Text className="text-sm font-semibold text-night">검토할 내용</Text>
            <NativeTextInput
              value={submittedText}
              onChangeText={onTextChange}
              multiline
              textAlignVertical="top"
              placeholder="이력서 bullet, 자기소개서 문단, 포트폴리오 설명, README 주요 내용을 붙여넣으세요."
              placeholderTextColor="#94a3b8"
              className="mt-2 min-h-[280px] rounded-xl border border-line bg-white p-4 text-sm leading-7 text-ink"
            />
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-xs text-slate-500">최소 80자 이상 입력</Text>
              <Text className="text-xs text-slate-500">{submittedText.trim().length}자</Text>
            </View>
          </View>
        )}

        {submitMode === "GITHUB" && (
          <View className="gap-4">
            <TextInput
              label="GitHub repository URL"
              value={githubUrl}
              onChangeText={onGithubUrlChange}
              placeholder="https://github.com/owner/repository"
              autoCapitalize="none"
            />
            <View>
              <Text className="text-sm font-semibold text-night">보완 메모</Text>
              <NativeTextInput
                value={githubNote}
                onChangeText={onGithubNoteChange}
                multiline
                textAlignVertical="top"
                placeholder="검증받고 싶은 구현 범위, README 위치, 아직 미완성인 부분을 적어주세요."
                placeholderTextColor="#94a3b8"
                className="mt-2 min-h-[160px] rounded-xl border border-line bg-white p-4 text-sm leading-7 text-ink"
              />
            </View>
          </View>
        )}

        {submitMode === "FILE" && (
          <View className="rounded-xl border border-dashed border-line bg-paper p-6">
            <Text className="text-lg font-semibold text-night">PDF 또는 DOCX 파일 선택</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-600">
              웹에서는 파일 선택 후 바로 분석할 수 있고, 모바일 앱에서는 파일 선택 모듈을 연결하면 같은 API로 확장됩니다.
            </Text>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <Button variant="outline" onPress={chooseFile}>파일 찾기</Button>
              {selectedFile && <Badge tone="brand">{selectedFile.name}</Badge>}
            </View>
            {selectedFile && (
              <Text className="mt-3 text-xs text-slate-500">{formatFileSize(selectedFile.size)}</Text>
            )}
          </View>
        )}

        <View className="mt-5 gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Text className="flex-1 text-sm leading-6 text-slate-600">{activeMode?.helper}</Text>
          <Button onPress={onAnalyze} disabled={isAnalyzing} loading={isAnalyzing}>
            AI 분석 실행
          </Button>
        </View>
      </View>
    </Card>
  );
}

function AnalysisResult({ result, isFresh }: { result: VerificationResult; isFresh: boolean }) {
  const strengths = splitSummary(result.strengths);
  const improvements = splitSummary(result.improvement_items);

  return (
    <Card className="overflow-hidden p-0">
      <View className="border-b border-line bg-white p-5">
        <View className="gap-4 md:flex-row md:items-start md:justify-between">
          <View>
            <Text className="lens-kicker">{isFresh ? "Analysis Result" : "Latest Result"}</Text>
            <Text className="mt-2 text-2xl font-semibold text-night">검증 결과</Text>
          </View>
          <View className="rounded-xl bg-night px-5 py-4">
            <Text className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Score</Text>
            <Text className="text-3xl font-semibold text-white">{result.verification_score}</Text>
          </View>
        </View>
        <View className="mt-5">
          <ScoreBar label="제출물 적합도" value={result.verification_score} tone={getScoreTone(result.verification_score)} />
        </View>
      </View>

      <View className="gap-4 p-5 lg:flex-row">
        <View className="flex-1 rounded-xl border border-line bg-paper p-5">
          <Text className="text-lg font-semibold text-night">요약</Text>
          <Text className="mt-3 text-sm leading-7 text-slate-700">{result.analysis_summary}</Text>
        </View>

        <View className="flex-1 gap-4">
          <ResultList title="강점" items={strengths} tone="success" emptyText="강점 항목이 아직 분리되지 않았습니다." />
          <ResultList title="보완점" items={improvements} tone="warning" emptyText="보완 항목이 아직 분리되지 않았습니다." />
        </View>
      </View>

      {result.issued_badges.length > 0 && (
        <View className="border-t border-line p-5">
          <Text className="text-lg font-semibold text-night">발급 배지</Text>
          <View className="mt-3 gap-3 md:flex-row md:flex-wrap">
            {result.issued_badges.map((badge) => (
              <BadgeCard key={badge.badge_id} badge={badge} />
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

function EmptyResultPreview({ submitMode }: { submitMode: SubmitMode }) {
  const description =
    submitMode === "GITHUB"
      ? "실제 프로젝트 저장소를 연결하면 README, 구현 메모, 과제 기준을 함께 검토합니다."
      : submitMode === "FILE"
        ? "파일 업로드 모드는 앱 파일 선택 연동 후 사용할 수 있습니다."
        : "문장을 입력하면 선택한 과제와 공고 기준에 맞춰 강점과 보완점을 정리합니다.";

  return (
    <Card className="p-6">
      <View className="rounded-xl border border-dashed border-line bg-paper p-8">
        <Text className="text-lg font-semibold text-night">아직 분석 결과가 없습니다.</Text>
        <Text className="mt-3 text-sm leading-6 text-slate-600">{description}</Text>
      </View>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl border border-line bg-white p-3">
      <Text className="text-xs font-semibold text-slate-500">{label}</Text>
      <Text className="mt-1 text-lg font-semibold text-night">{value}</Text>
    </View>
  );
}

function StandardBlock({ title, body }: { title: string; body: string }) {
  return (
    <View className="rounded-xl border border-line bg-paper p-4">
      <Text className="text-sm font-semibold text-night">{title}</Text>
      <Text className="mt-2 text-sm leading-6 text-slate-700">{body}</Text>
    </View>
  );
}

function ResultList({ title, items, tone, emptyText }: { title: string; items: string[]; tone: Tone; emptyText: string }) {
  return (
    <View className="rounded-xl border border-line bg-white p-5">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-night">{title}</Text>
        <Badge tone={tone}>{items.length}개</Badge>
      </View>
      {items.length > 0 ? (
        <View className="gap-2">
          {items.map((item, index) => (
            <Text key={`${title}-${index}`} className="rounded-xl bg-paper px-3 py-2 text-sm leading-6 text-slate-700">
              {item}
            </Text>
          ))}
        </View>
      ) : (
        <Text className="text-sm text-slate-500">{emptyText}</Text>
      )}
    </View>
  );
}

function BadgeCard({ badge }: { badge: VerificationBadge }) {
  return (
    <View className="rounded-xl border border-line bg-paper p-4 md:w-[48%]">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-brand">{badge.label}</Text>
          <Text className="mt-2 text-sm leading-6 text-slate-700">{badge.description}</Text>
        </View>
        <Badge tone="success">{badge.score_at_issue}점</Badge>
      </View>
    </View>
  );
}

function splitSummary(value: string) {
  return value
    .split(/\n|;|ㆍ|•|-/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function isRepositoryUrl(value: string) {
  return /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/.test(value.trim());
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function getTaskStatusLabel(status: string) {
  if (status === "DONE") return "완료";
  if (status === "IN_PROGRESS") return "진행 중";
  return "대기";
}

function getTaskStatusTone(status: string): Tone {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "brand";
  return "muted";
}

function getDifficultyLabel(difficulty: string) {
  if (difficulty === "EASY") return "난이도 낮음";
  if (difficulty === "HARD") return "난이도 높음";
  return "난이도 보통";
}

function getDifficultyTone(difficulty: string): Tone {
  if (difficulty === "EASY") return "success";
  if (difficulty === "HARD") return "warning";
  return "brand";
}

function getScoreTone(score: number): Tone {
  if (score >= 80) return "success";
  if (score >= 60) return "brand";
  if (score >= 40) return "warning";
  return "risk";
}
