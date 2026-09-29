import { apiFetch, authHeaders, readApiError } from "@/lib/auth";

export type MembershipSummary = {
  user_id: number;
  plan: "FREE" | "PRO";
  pro_active: boolean;
  pro_expires_at: string | null;
  period_month: string;
  roadmap_limit: number;
  roadmap_used: number;
  roadmap_remaining: number;
  ai_document_analysis_limit: number;
  ai_document_analysis_used: number;
  ai_document_analysis_remaining: number;
  price_label: string;
};

export type KakaoPayReadyResponse = {
  order_id: string;
  status: string;
  redirect_url: string;
  expires_at: string;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function fetchMembershipSummary(): Promise<MembershipSummary> {
  const response = await apiFetch(`${baseUrl}/api/memberships/me`, {
    headers: authHeaders(),
    cache: "no-store"
  }, "멤버십 정보 조회");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Membership summary request failed."));
  }

  return response.json();
}

export async function startKakaoPayProPass(): Promise<KakaoPayReadyResponse> {
  const response = await apiFetch(`${baseUrl}/api/payments/kakao/ready`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store"
  }, "카카오페이 결제 준비");

  if (!response.ok) {
    throw new Error(await readApiError(response, "KakaoPay ready request failed."));
  }

  return response.json();
}

export function isMembershipLimitMessage(message: string) {
  return message.includes("무료 플랜") || message.includes("Pro 멤버십");
}
