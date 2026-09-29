import { apiFetch, authHeaders, readApiError } from "@/lib/auth";

export type VerificationBadge = {
  badge_id: number;
  task_id: number;
  verification_id: number;
  badge_type: string;
  label: string;
  description: string;
  score_at_issue: number;
  issued_at: string;
};

export type VerificationResult = {
  verification_id: number;
  task_id: number;
  user_id: number;
  request_type: string;
  status: string;
  verification_score: number;
  analysis_summary: string;
  strengths: string;
  improvement_items: string;
  reviewer_mode: string;
  requested_at: string;
  completed_at: string;
  issued_badges: VerificationBadge[];
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function verifyTaskText(input: {
  taskId: number;
  documentType: string;
  submittedText: string;
}): Promise<VerificationResult> {
  const response = await apiFetch(
    `${baseUrl}/api/verifications/tasks/${input.taskId}/text`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders()
      },
      body: JSON.stringify({
        document_type: input.documentType,
        submitted_text: input.submittedText
      }),
      cache: "no-store"
    },
    "문서 텍스트 검증 요청"
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, "Document verification request failed."));
  }

  return response.json();
}

export async function fetchTaskVerifications(taskId: number): Promise<VerificationResult[]> {
  const response = await apiFetch(
    `${baseUrl}/api/verifications/tasks/${taskId}`,
    {
      headers: authHeaders(),
      cache: "no-store"
    },
    "문서 검증 이력 조회"
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, "Verification history request failed."));
  }

  return response.json();
}

export async function verifyTaskGithub(input: {
  taskId: number;
  githubUrl: string;
  note?: string;
}): Promise<VerificationResult> {
  const response = await apiFetch(
    `${baseUrl}/api/verifications/tasks/${input.taskId}/github`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders()
      },
      body: JSON.stringify({
        github_url: input.githubUrl,
        note: input.note ?? ""
      }),
      cache: "no-store"
    },
    "GitHub 검증 요청"
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, "GitHub verification request failed."));
  }

  return response.json();
}

export async function verifyTaskFile(input: {
  taskId: number;
  documentType: string;
  file: File;
}): Promise<VerificationResult> {
  const body = new FormData();
  body.append("document_type", input.documentType);
  body.append("file", input.file);

  const response = await apiFetch(
    `${baseUrl}/api/verifications/tasks/${input.taskId}/file`,
    {
      method: "POST",
      headers: authHeaders(),
      body,
      cache: "no-store"
    },
    "파일 검증 요청"
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, "File verification request failed."));
  }

  return response.json();
}

export async function fetchUserBadges(userId: number): Promise<VerificationBadge[]> {
  const response = await apiFetch(
    `${baseUrl}/api/verifications/users/${userId}/badges`,
    {
      headers: authHeaders(),
      cache: "no-store"
    },
    "검증 배지 조회"
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, "Verification badge request failed."));
  }

  return response.json();
}
