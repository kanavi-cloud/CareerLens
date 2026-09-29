import { apiFetch, authHeaders, readApiError } from "@/lib/auth";

export type ApplicationStatus = "INTERESTED" | "PREPARING_DOCUMENTS" | "APPLIED" | "INTERVIEW" | "CLOSED";

export type ApplicationRecord = {
  application_id: number;
  user_id: number;
  job_id: number;
  roadmap_id: number | null;
  company_name: string;
  country: string;
  job_title: string;
  job_family: string;
  external_ref: string | null;
  application_url: string | null;
  salary_range: string;
  work_type: string;
  status: ApplicationStatus;
  next_action: string;
  candidate_notes: string | null;
  required_documents: string[];
  company_brief: string;
  workspace_focus_items: string[];
  risk_notes: string[];
  application_deadline: string | null;
  days_until_deadline: number | null;
  deadline_status: "ONGOING" | "EXPIRED" | "URGENT" | "SOON" | "OPEN";
  readiness_score: number;
  roadmap_completion_rate: number;
  completed_task_count: number;
  total_task_count: number;
  verified_task_count: number;
  document_checklist: Array<{
    key: string;
    label: string;
    status: "TODO" | "DONE" | "VERIFIED" | string;
    helper_text: string;
  }>;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function fetchUserApplications(userId: number): Promise<ApplicationRecord[]> {
  const response = await apiFetch(`${baseUrl}/api/applications/users/${userId}`, {
    headers: authHeaders(),
    cache: "no-store"
  }, "지원 관리 목록 조회");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Application records request failed."));
  }

  return response.json();
}

export async function createApplicationFromRoadmap(roadmapId: number): Promise<ApplicationRecord> {
  const response = await apiFetch(`${baseUrl}/api/applications/from-roadmap/${roadmapId}`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store"
  }, "지원 워크스페이스 생성");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Application record creation failed."));
  }

  return response.json();
}

export async function createApplicationFromJob(userId: number, jobId: number): Promise<ApplicationRecord> {
  const response = await apiFetch(`${baseUrl}/api/applications/users/${userId}/jobs/${jobId}`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store"
  }, "지원 워크스페이스 생성");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Application workspace creation failed."));
  }

  return response.json();
}

export async function fetchApplication(applicationId: number): Promise<ApplicationRecord> {
  const response = await apiFetch(`${baseUrl}/api/applications/${applicationId}`, {
    headers: authHeaders(),
    cache: "no-store"
  }, "지원 워크스페이스 조회");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Application workspace request failed."));
  }

  return response.json();
}

export async function updateApplicationStatus(applicationId: number, status: ApplicationStatus): Promise<ApplicationRecord> {
  const response = await apiFetch(`${baseUrl}/api/applications/${applicationId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify({ status }),
    cache: "no-store"
  }, "지원 상태 변경");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Application status update failed."));
  }

  return response.json();
}

export async function updateApplicationWorkspace(
  applicationId: number,
  input: { candidate_notes?: string; next_action?: string }
): Promise<ApplicationRecord> {
  const response = await apiFetch(`${baseUrl}/api/applications/${applicationId}/workspace`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify(input),
    cache: "no-store"
  }, "지원 워크스페이스 저장");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Application workspace update failed."));
  }

  return response.json();
}
