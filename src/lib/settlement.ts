import { apiFetch, authHeaders, readApiError } from "@/lib/auth";

export type SettlementStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

export type SettlementChecklistItem = {
  item_id: number;
  user_id: number;
  country: string;
  category: string;
  checklist_title: string;
  description: string;
  status: SettlementStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SettlementGuidance = {
  guidance_id?: number | null;
  overall_status: "ON_TRACK" | "NEEDS_ATTENTION" | "EARLY_STAGE" | string;
  completion_rate: number;
  summary: string;
  priority_actions: string[];
  country_summaries: Array<{
    country: string;
    completion_rate: number;
    risk_level: "LOW" | "MEDIUM" | "HIGH" | string;
    next_actions: string[];
  }>;
  generation_mode: string;
  disclaimer: string;
  created_at?: string | null;
  updated_at?: string | null;
  refreshed_at?: string | null;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function fetchSettlementChecklists(userId: number): Promise<SettlementChecklistItem[]> {
  const response = await apiFetch(`${baseUrl}/api/settlement/users/${userId}/checklists`, {
    headers: authHeaders(),
    cache: "no-store"
  }, "정착 체크리스트 조회");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Settlement checklist request failed."));
  }

  return response.json();
}

export async function updateSettlementChecklistStatus(itemId: number, status: SettlementStatus): Promise<SettlementChecklistItem> {
  const response = await apiFetch(`${baseUrl}/api/settlement/checklists/${itemId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify({ status }),
    cache: "no-store"
  }, "정착 체크리스트 상태 변경");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Settlement checklist status update failed."));
  }

  return response.json();
}

export async function generateSettlementGuidance(userId: number): Promise<SettlementGuidance> {
  const response = await apiFetch(`${baseUrl}/api/settlement/users/${userId}/guidance`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store"
  }, "행정 로드맵 안내 생성");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Settlement guidance request failed."));
  }

  return response.json();
}

export async function generateSettlementGuidanceFromRoadmap(roadmapId: number): Promise<SettlementGuidance> {
  const response = await apiFetch(`${baseUrl}/api/settlement/roadmaps/${roadmapId}/guidance`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store"
  }, "행정 로드맵 안내 생성");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Settlement guidance request failed."));
  }

  return response.json();
}

export async function fetchSettlementGuidanceFromRoadmap(roadmapId: number): Promise<SettlementGuidance> {
  const response = await apiFetch(`${baseUrl}/api/settlement/roadmaps/${roadmapId}/guidance`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store"
  }, "행정 로드맵 조회");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Settlement guidance request failed."));
  }

  return response.json();
}

export async function refreshSettlementGuidanceFromRoadmap(roadmapId: number): Promise<SettlementGuidance> {
  const response = await apiFetch(`${baseUrl}/api/settlement/roadmaps/${roadmapId}/guidance/refresh`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store"
  }, "행정 로드맵 갱신");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Settlement guidance refresh failed."));
  }

  return response.json();
}
