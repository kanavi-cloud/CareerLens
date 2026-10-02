"use client";

import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, Text, TextInput as NativeTextInput, View } from "react-native";
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
  SectionHeader,
  type Tone
} from "@/components/ui";
import {
  fetchApplication,
  updateApplicationStatus,
  updateApplicationWorkspace,
  type ApplicationRecord,
  type ApplicationStatus
} from "@/lib/applications";
import { countryLabel, workTypeLabel } from "@/lib/display-labels";

type AssistantStatus = "READY" | "CHECK" | "AI_DRAFT" | "EXTERNAL" | "SENSITIVE";

type AssistantField = {
  label: string;
  description: string;
  status: AssistantStatus;
  source: string;
};

type AssistantSection = {
  title: string;
  description: string;
  fields: AssistantField[];
};

const statusOptions: Array<{ value: ApplicationStatus; label: string; description: string }> = [
  { value: "INTERESTED", label: "관심 공고", description: "지원 후보로 저장" },
  { value: "PREPARING_DOCUMENTS", label: "서류 준비", description: "제출 패키지 보완" },
  { value: "APPLIED", label: "지원 완료", description: "공식 Apply 제출 완료" },
  { value: "INTERVIEW", label: "면접 진행", description: "면접과 과제 대응" },
  { value: "CLOSED", label: "종료", description: "결과 회고 또는 마감" }
];

export default function ApplicationWorkspacePage() {
  const params = useLocalSearchParams<{ applicationId?: string | string[] }>();
  const auth = useRequiredAuth();
  const applicationIdValue = Array.isArray(params.applicationId) ? params.applicationId[0] : params.applicationId;
  const applicationId = Number(applicationIdValue ?? 0);
  const [record, setRecord] = useState<ApplicationRecord | null>(null);
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (auth.isChecking) return;
    if (!auth.user || !applicationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    fetchApplication(applicationId)
      .then((data) => {
        setRecord(data);
        setNotes(data.candidate_notes ?? "");
        setNextAction(data.next_action ?? "");
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "지원 워크스페이스를 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [applicationId, auth.isChecking, auth.user]);

  const completedDocuments = useMemo(() => {
    return record?.document_checklist.filter((item) => item.status === "DONE" || item.status === "VERIFIED").length ?? 0;
  }, [record]);

  const assistantSections = useMemo(() => record ? buildApplyAssistant(record) : [], [record]);

  const assistantSummary = useMemo(() => {
    const fields = assistantSections.flatMap((section) => section.fields);
    const ready = fields.filter((field) => field.status === "READY").length;
    const aiDraft = fields.filter((field) => field.status === "AI_DRAFT").length;
    const check = fields.filter((field) => field.status === "CHECK").length;
    const sensitive = fields.filter((field) => field.status === "SENSITIVE").length;
    const external = Math.max(0, fields.length - ready - aiDraft - check - sensitive);
    return { total: fields.length, ready, aiDraft, check, sensitive, external };
  }, [assistantSections]);

  async function changeStatus(status: ApplicationStatus) {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await updateApplicationStatus(record.application_id, status);
      setRecord(updated);
      setNextAction(updated.next_action ?? "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "지원 상태를 변경하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveWorkspace() {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await updateApplicationWorkspace(record.application_id, {
        candidate_notes: notes,
        next_action: nextAction
      });
      setRecord(updated);
      setNotes(updated.candidate_notes ?? "");
      setNextAction(updated.next_action ?? "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "지원 메모를 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  if (auth.isChecking) {
    return <AuthCheckingScreen title="지원 워크스페이스 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="지원 워크스페이스는 로그인 후 이용할 수 있습니다." />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="APPLICATION WORKSPACE"
        title="지원 워크스페이스"
        description="공식 Apply 페이지에 제출하기 전, 공고 근거와 제출 자료, 비자 질문, 회사별 답변 준비 상태를 정리합니다."
        actions={
          <>
            <LinkButton href="/applications" variant="secondary">지원관리 목록</LinkButton>
            <LinkButton href="/roadmap/employment/documents" variant="secondary">문서 점검</LinkButton>
            {record?.application_url && (
              <Button onPress={() => openExternalUrl(record.application_url)}>공식 Apply 열기</Button>
            )}
          </>
        }
      />

      <View className="lens-container gap-5 pb-10">
        {isLoading && <EmptyState title="지원 워크스페이스를 불러오는 중입니다." description="공고와 지원 준비 데이터를 확인하고 있습니다." />}

        {errorMessage && <EmptyState title="요청을 처리하지 못했습니다." description={errorMessage} />}

        {!isLoading && !record && !errorMessage && (
          <EmptyState title="지원 워크스페이스를 찾지 못했습니다." description="지원관리 목록에서 다시 선택해 주세요." action={<LinkButton href="/applications">지원관리 목록</LinkButton>} />
        )}

        {record && (
          <View className="gap-5 xl:flex-row">
            <View className="gap-5 xl:w-[360px]">
              <Card className="p-5">
                <View className="flex-row flex-wrap gap-2">
                  <Badge tone={deadlineTone(record.deadline_status)}>{deadlineLabel(record)}</Badge>
                  <Badge tone={statusTone(record.status)}>{statusLabel(record.status)}</Badge>
                  <Badge tone="muted">{record.job_family}</Badge>
                </View>
                <Text className="mt-4 text-sm font-semibold text-brand">{record.company_name}</Text>
                <Text className="mt-1 text-2xl font-semibold leading-8 text-night">{record.job_title}</Text>
                <Text className="mt-2 text-sm leading-6 text-slate-600">
                  {countryLabel(record.country)} · {workTypeLabel(record.work_type)} · {record.salary_range || "연봉 미기재"}
                </Text>

                <View className="mt-5 flex-row flex-wrap gap-3">
                  <MetricCard label="준비도" value={`${record.readiness_score}점`} />
                  <MetricCard label="로드맵" value={`${record.roadmap_completion_rate}%`} />
                  <MetricCard label="완료 과제" value={`${record.completed_task_count}/${record.total_task_count}`} />
                  <MetricCard label="검증 과제" value={`${record.verified_task_count}개`} />
                </View>

                <View className="mt-5 gap-3">
                  <ScoreBar label="지원 준비도" value={record.readiness_score} tone={scoreTone(record.readiness_score)} />
                  <ScoreBar label="로드맵 완료율" value={record.roadmap_completion_rate} tone="brand" />
                </View>
              </Card>

              <Card className="p-5">
                <Text className="lens-kicker">STATUS</Text>
                <View className="mt-4 gap-2">
                  {statusOptions.map((option) => {
                    const active = record.status === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        disabled={isSaving}
                        onPress={() => changeStatus(option.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active, disabled: isSaving }}
                        className={`rounded-xl border px-3 py-3 ${active ? "border-night bg-night" : "border-line bg-white"}`}
                      >
                        <Text className={`text-sm font-semibold ${active ? "text-white" : "text-night"}`}>{option.label}</Text>
                        <Text className={`mt-1 text-xs ${active ? "text-white" : "text-slate-500"}`}>{option.description}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              <Card className="p-5">
                <Text className="lens-kicker">APPLY FORM</Text>
                <View className="mt-4 flex-row flex-wrap gap-3">
                  <MetricCard label="확인 항목" value={`${assistantSummary.total}개`} />
                  <MetricCard label="AI 초안" value={`${assistantSummary.aiDraft}개`} />
                  <MetricCard label="직접 확인" value={`${assistantSummary.check}개`} />
                  <MetricCard label="민감정보" value={`${assistantSummary.sensitive}개`} />
                </View>
              </Card>

              <EmploymentFlowGuide currentStep="applications" roadmapId={record.roadmap_id} />
            </View>

            <View className="flex-1 gap-5">
              <Card className="p-5">
                <SectionHeader
                  kicker="JOB EVIDENCE"
                  title="공고 근거 요약"
                  description="지원 준비의 기준이 되는 회사, 직무, 근무 조건, 원문 링크를 먼저 확인합니다."
                  actions={record.application_url ? (
                    <Button variant="outline" onPress={() => openExternalUrl(record.application_url)}>원문 공고 확인</Button>
                  ) : undefined}
                />
                <Text className="mt-5 rounded-xl border border-line bg-panel p-4 text-sm leading-6 text-slate-700">{record.company_brief}</Text>
                <View className="mt-4 flex-row flex-wrap gap-3">
                  <InfoBox label="비자 조건" value={record.risk_notes.some((item) => item.includes("비자")) ? "원문 확인 필요" : "공고 기준 확인"} />
                  <InfoBox label="마감 상태" value={deadlineLabel(record)} />
                  <InfoBox label="공고 출처" value={record.external_ref?.startsWith("greenhouse:") ? "Greenhouse 공개 공고" : "수동 등록 공고"} />
                  <InfoBox label="지원 링크" value={record.application_url ? "공식 Apply 연결" : "링크 미기재"} />
                </View>
              </Card>

              <Card className="p-5">
                <SectionHeader
                  kicker="APPLICATION PACKAGE"
                  title="제출 패키지 체크리스트"
                  description="커리어 플래너와 문서 점검 결과를 제출 준비 항목으로 연결합니다."
                  actions={<Badge tone="brand">{completedDocuments}/{record.document_checklist.length} 준비됨</Badge>}
                />
                <View className="mt-5 gap-3 md:flex-row md:flex-wrap">
                  {record.document_checklist.map((item) => (
                    <View key={item.key} className="rounded-xl border border-line bg-panel p-4 md:w-[48%]">
                      <View className="flex-row items-start justify-between gap-3">
                        <Text className="flex-1 text-base font-semibold text-night">{item.label}</Text>
                        <Badge tone={documentTone(item.status)}>{documentLabel(item.status)}</Badge>
                      </View>
                      <Text className="mt-2 text-sm leading-6 text-slate-600">{item.helper_text}</Text>
                    </View>
                  ))}
                </View>
              </Card>

              <Card className="p-5">
                <SectionHeader
                  kicker="APPLY FORM ASSISTANT"
                  title="지원서 입력 항목 준비표"
                  description="실제 Apply 페이지에서 반복적으로 등장하는 입력 항목을 준비 상태별로 정리합니다."
                  actions={<LinkButton href="/roadmap/employment/documents" variant="secondary">문서 점검으로 이동</LinkButton>}
                />
                <View className="mt-5 flex-row flex-wrap gap-3">
                  <MetricCard label="준비 가능" value={`${assistantSummary.ready}개`} helper="프로필/자료 기반" />
                  <MetricCard label="확인 필요" value={`${assistantSummary.check}개`} helper="사용자 직접 판단" />
                  <MetricCard label="AI 초안" value={`${assistantSummary.aiDraft}개`} helper="답변 초안 대상" />
                  <MetricCard label="외부 입력" value={`${assistantSummary.external}개`} helper="ATS에서 직접 입력" />
                  <MetricCard label="민감정보" value={`${assistantSummary.sensitive}개`} helper="추천 제외" />
                </View>

                <View className="mt-5 gap-5">
                  {assistantSections.map((section) => (
                    <ApplyAssistantSection key={section.title} section={section} />
                  ))}
                </View>

                <View className="mt-5 rounded-xl border border-amber/30 bg-amber-50 p-4">
                  <Text className="text-sm leading-6 text-amber">
                    EEO, 장애, 군복무, 성별, 인종, 민족, 성적 지향 등 선택형 인구통계 항목은 민감정보입니다. CareerLens는 해당 항목을 자동 작성하거나 추천하지 않고, 사용자가 공식 Apply 페이지에서 직접 판단하도록 안내합니다.
                  </Text>
                </View>
              </Card>

              <Card className="p-5">
                <SectionHeader
                  kicker="WORK NOTES"
                  title="지원 메모와 다음 액션"
                  description="공식 Apply 페이지에서 확인한 추가 질문, 제출한 파일명, 채용 담당자 응답, 보완점을 기록합니다."
                />
                <View className="mt-5 gap-4">
                  <View>
                    <Text className="mb-2 text-sm font-semibold text-slate-700">다음 액션</Text>
                    <NativeTextInput
                      value={nextAction}
                      onChangeText={setNextAction}
                      multiline
                      textAlignVertical="top"
                      className="min-h-24 rounded-xl border border-line bg-white p-3 text-sm leading-6 text-ink"
                    />
                  </View>
                  <View>
                    <Text className="mb-2 text-sm font-semibold text-slate-700">지원 메모</Text>
                    <NativeTextInput
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="예: Apply 페이지에서 확인한 추가 질문, 제출한 파일명, 담당자 응답, 면접 일정"
                      placeholderTextColor="#94a3b8"
                      multiline
                      textAlignVertical="top"
                      className="min-h-32 rounded-xl border border-line bg-white p-3 text-sm leading-6 text-ink"
                    />
                  </View>
                </View>
                <View className="mt-4 flex-row flex-wrap gap-2">
                  <Button disabled={isSaving} loading={isSaving} onPress={saveWorkspace}>
                    워크스페이스 저장
                  </Button>
                  <LinkButton href="/roadmap/employment/documents" variant="secondary">문서 점검</LinkButton>
                  {record.roadmap_id && <LinkButton href={`/planner/${record.roadmap_id}`} variant="subtle">커리어 플래너</LinkButton>}
                </View>
              </Card>
            </View>
          </View>
        )}
      </View>
    </PageShell>
  );
}

function ApplyAssistantSection({ section }: { section: AssistantSection }) {
  return (
    <View>
      <View className="gap-2 md:flex-row md:items-start md:justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-night">{section.title}</Text>
          <Text className="mt-1 text-sm leading-6 text-slate-600">{section.description}</Text>
        </View>
        <Badge tone="muted">{section.fields.length}개 항목</Badge>
      </View>
      <View className="mt-4 gap-3 md:flex-row md:flex-wrap">
        {section.fields.map((field) => (
          <View key={`${section.title}-${field.label}`} className="rounded-xl border border-line bg-white p-3 md:w-[48%]">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-night">{field.label}</Text>
                <Text className="mt-1 text-xs leading-5 text-slate-500">{field.source}</Text>
              </View>
              <Badge tone={assistantTone(field.status)}>{assistantLabel(field.status)}</Badge>
            </View>
            <Text className="mt-3 text-sm leading-6 text-slate-700">{field.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl border border-line bg-white p-3">
      <Text className="text-xs font-semibold text-slate-500">{label}</Text>
      <Text className="mt-2 text-sm font-semibold text-night">{value}</Text>
    </View>
  );
}

function buildApplyAssistant(record: ApplicationRecord): AssistantSection[] {
  const company = record.company_name || "지원 기업";
  const jobTitle = record.job_title || "지원 직무";
  const hasPortfolio = record.document_checklist.some((item) => item.key === "portfolio" && (item.status === "DONE" || item.status === "VERIFIED"));
  const hasGithub = record.document_checklist.some((item) => item.key === "github" && item.status === "VERIFIED");
  const hasResume = record.document_checklist.some((item) => item.key === "resume" && (item.status === "DONE" || item.status === "VERIFIED"));
  const visaUnclear = record.risk_notes.some((note) => note.includes("비자") || note.toLowerCase().includes("visa"));

  return [
    {
      title: "기본 정보",
      description: "대부분의 ATS에서 반복되는 이름, 이메일, 연락처, 현재 위치 항목입니다.",
      fields: [
        {
          label: "이름 / 이메일 / 연락처",
          description: "마이페이지의 기본 정보를 기준으로 준비하되, 공식 Apply 페이지에서 국가번호와 표기명을 최종 확인합니다.",
          status: "READY",
          source: "대부분의 Apply Form 공통"
        },
        {
          label: "현재 거주 국가 / 도시",
          description: "근무 가능 지역, 원격 가능 여부, 재배치 의사와 연결되는 항목입니다. 공고 국가와 다르면 답변을 신중하게 정리해야 합니다.",
          status: "CHECK",
          source: "Webflow, Discord, Asana, Figma 등"
        }
      ]
    },
    {
      title: "제출 자료",
      description: "이력서, 커버레터, LinkedIn, GitHub, 포트폴리오 준비 상태입니다.",
      fields: [
        {
          label: "Resume / CV",
          description: hasResume ? "이력서 준비 기록이 있습니다. 공식 Apply에서는 파일 업로드 또는 직접 입력 방식으로 제출합니다." : "영문 이력서 준비가 필요합니다. 문서 점검에서 공고 키워드 반영 여부를 먼저 확인하세요.",
          status: hasResume ? "READY" : "CHECK",
          source: "모든 Apply Form 공통"
        },
        {
          label: "Cover Letter / Additional Information",
          description: `${company} ${jobTitle}에 맞춘 지원 동기와 보완 설명은 AI 초안 생성 대상으로 분리하는 것이 좋습니다.`,
          status: "AI_DRAFT",
          source: "Webflow, Mixpanel, GitLab, Discord 등"
        },
        {
          label: "LinkedIn / Website",
          description: "프로필 URL과 이력서 내용의 일관성을 확인하세요. 공개 링크는 접근 가능 상태여야 합니다.",
          status: "CHECK",
          source: "GitLab, DoorDash, Figma, Reddit 등"
        },
        {
          label: "GitHub / Portfolio",
          description: hasGithub || hasPortfolio ? "프로젝트 링크 준비 기록이 있습니다. README와 핵심 성과가 공고 요구 기술과 연결되는지 확인하세요." : "포트폴리오 또는 GitHub 검증 기록이 부족합니다. 문서 점검/GitHub 검증으로 보강하세요.",
          status: hasGithub || hasPortfolio ? "READY" : "CHECK",
          source: "Figma, Asana, Databricks 등"
        }
      ]
    },
    {
      title: "근무 조건과 비자",
      description: "해외취업 지원에서 반복적으로 확인되는 근무 자격, 비자 스폰서십, 입사 가능 시점입니다.",
      fields: [
        {
          label: "Work Authorization",
          description: "지원 국가에서 합법적으로 근무 가능한지 묻는 항목입니다. 사용자가 직접 사실관계를 확인해야 합니다.",
          status: "CHECK",
          source: "Webflow, GitLab, DoorDash, Figma 등"
        },
        {
          label: "Visa Sponsorship",
          description: visaUnclear ? "공고의 비자 조건이 명확하지 않습니다. 공식 Apply의 스폰서십 질문을 직접 확인하세요." : "비자 조건 메모를 기준으로 답변 방향을 정리하되, 최종 선택은 사용자가 직접 해야 합니다.",
          status: "CHECK",
          source: "Anthropic, GitLab, DoorDash 등"
        },
        {
          label: "Start Date / Relocation",
          description: "입사 가능 시점, 현지 오피스 근무, 재배치 가능 여부를 묻는 항목입니다. 마이페이지의 입사 가능 시점과 비교하세요.",
          status: "CHECK",
          source: "Anthropic, Discord, Figma 등"
        }
      ]
    },
    {
      title: "공통 지원 질문",
      description: "여러 기업의 Apply Form에서 반복되는 질문을 현재 공고 기준으로 답변 준비표에 연결합니다.",
      fields: [
        {
          label: `Why ${company}?`,
          description: `${company}의 제품/시장/기술 방향과 본인의 프로젝트 경험을 연결하는 답변 초안을 준비합니다.`,
          status: "AI_DRAFT",
          source: "글로벌 채용 지원서 공통 질문"
        },
        {
          label: `Why ${jobTitle}?`,
          description: "공고 요구 기술과 본인 경험을 연결하는 답변입니다. 적합도 진단의 강점과 부족 요소를 근거로 사용할 수 있습니다.",
          status: "AI_DRAFT",
          source: "직무 적합성 질문"
        },
        {
          label: "How did you hear about this job?",
          description: "Greenhouse 공개 공고, 회사 채용 페이지, LinkedIn 등 실제 유입 경로를 사용자가 직접 선택합니다.",
          status: "EXTERNAL",
          source: "Greenhouse 계열 Apply Form에서 반복"
        },
        {
          label: "인구통계 선택 항목",
          description: "성별, 인종, 장애, 군복무 등 선택형 인구통계 항목은 추천이나 자동 작성 대상에서 제외합니다.",
          status: "SENSITIVE",
          source: "EEO/자발적 자기식별 항목"
        }
      ]
    }
  ];
}

function openExternalUrl(url: string | null) {
  if (!url) return;
  Linking.openURL(url).catch(() => undefined);
}

function statusLabel(status: ApplicationStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function statusTone(status: ApplicationStatus): Tone {
  if (status === "APPLIED" || status === "INTERVIEW") return "brand";
  if (status === "CLOSED") return "muted";
  if (status === "PREPARING_DOCUMENTS") return "warning";
  return "default";
}

function deadlineLabel(record: ApplicationRecord) {
  if (record.deadline_status === "ONGOING") return "상시/미기재";
  if (record.deadline_status === "EXPIRED") return "마감";
  if (record.days_until_deadline === 0) return "오늘 마감";
  if (record.days_until_deadline == null) return "D-?";
  return `D-${record.days_until_deadline}`;
}

function deadlineTone(status: ApplicationRecord["deadline_status"]): Tone {
  if (status === "URGENT" || status === "EXPIRED") return "risk";
  if (status === "SOON") return "warning";
  return "muted";
}

function documentLabel(status: string) {
  if (status === "VERIFIED") return "검증";
  if (status === "DONE") return "완료";
  return "대기";
}

function documentTone(status: string): Tone {
  if (status === "VERIFIED") return "brand";
  if (status === "DONE") return "success";
  return "muted";
}

function assistantLabel(status: AssistantStatus) {
  if (status === "READY") return "준비 가능";
  if (status === "CHECK") return "확인 필요";
  if (status === "AI_DRAFT") return "AI 초안";
  if (status === "SENSITIVE") return "추천 제외";
  return "외부 입력";
}

function assistantTone(status: AssistantStatus): Tone {
  if (status === "READY") return "success";
  if (status === "AI_DRAFT") return "brand";
  if (status === "CHECK") return "warning";
  if (status === "SENSITIVE") return "risk";
  return "muted";
}

function scoreTone(score: number): Tone {
  if (score >= 80) return "success";
  if (score >= 65) return "brand";
  if (score >= 50) return "warning";
  return "risk";
}
