import { apiFetch, authHeaders, readApiError } from "@/lib/auth";

export type PlannerTask = {
  task_id: number;
  week_number: number;
  category: string;
  title: string;
  description: string;
  expected_outputs: string;
  verification_criteria: string;
  estimated_hours: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: PlannerTaskStatus;
  sort_order: number;
};

export type PlannerTaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type PlannerRoadmap = {
  roadmap_id: number;
  user_id: number;
  diagnosis_id: number;
  title: string;
  summary: string;
  target_company: string;
  target_job_title: string;
  readiness_status: string;
  total_score: number;
  duration_weeks: number;
  generation_mode: string;
  created_at: string;
  total_task_count: number;
  completed_task_count: number;
  in_progress_task_count: number;
  completion_rate: number;
  next_action: string;
  tasks: PlannerTask[];
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function createPlannerRoadmap(diagnosisId: number): Promise<PlannerRoadmap> {
  const response = await apiFetch(`${baseUrl}/api/planner/roadmaps/from-diagnosis/${diagnosisId}`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store"
  }, "커리어 플래너 생성");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Planner roadmap creation failed."));
  }

  return response.json();
}

export async function fetchPlannerRoadmap(roadmapId: number): Promise<PlannerRoadmap> {
  const response = await apiFetch(`${baseUrl}/api/planner/roadmaps/${roadmapId}`, {
    headers: authHeaders(),
    cache: "no-store"
  }, "커리어 플래너 조회");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Planner roadmap request failed."));
  }

  return response.json();
}

export async function fetchUserRoadmaps(userId: number): Promise<PlannerRoadmap[]> {
  const response = await apiFetch(`${baseUrl}/api/planner/users/${userId}/roadmaps`, {
    headers: authHeaders(),
    cache: "no-store"
  }, "커리어 플래너 목록 조회");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Planner roadmap list request failed."));
  }

  return response.json();
}

export async function deletePlannerRoadmap(roadmapId: number): Promise<void> {
  const response = await apiFetch(`${baseUrl}/api/planner/roadmaps/${roadmapId}`, {
    method: "DELETE",
    headers: authHeaders(),
    cache: "no-store"
  }, "커리어 플래너 삭제");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Planner roadmap delete request failed."));
  }
}

export async function updatePlannerTaskStatus(taskId: number, status: PlannerTaskStatus): Promise<PlannerRoadmap> {
  const response = await apiFetch(`${baseUrl}/api/planner/tasks/${taskId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify({ status }),
    cache: "no-store"
  }, "커리어 플래너 과제 상태 변경");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Planner task status update failed."));
  }

  return response.json();
}
