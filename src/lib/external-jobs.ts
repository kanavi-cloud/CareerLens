import type { JobPosting } from "@/lib/jobs";
import { authHeaders } from "@/lib/auth";

export type ExternalJobPreview = {
  provider: string;
  board_token: string;
  external_ref: string;
  company_name: string;
  country: string;
  job_title: string;
  job_family: string;
  location: string;
  source_url: string;
  required_skills: string[];
  preferred_skills: string[];
  required_languages: string[];
  min_experience_years: number | null;
  degree_requirement: string;
  portfolio_required: boolean;
  visa_requirement: string;
  salary_range: string;
  work_type: string;
  content_summary: string;
  already_imported: boolean;
};

export type ExternalJobImportRequest = {
  board_token: string;
  default_country?: string;
  default_job_family?: string;
  limit?: number;
  default_deadline?: string;
  create_pattern_profile?: boolean;
  selected_external_refs?: string[];
  import_new?: boolean;
};

export type ExternalJobImportResponse = {
  provider: string;
  board_token: string;
  fetched_count: number;
  imported_count: number;
  updated_count: number;
  jobs: JobPosting[];
};

export type ExternalJobSyncStatus = {
  enabled: boolean;
  board_tokens: string[];
  fixed_delay_minutes: number;
  last_started_at: string | null;
  last_finished_at: string | null;
  last_status: string;
  last_fetched_count: number;
  last_imported_count: number;
  last_updated_count: number;
  last_message: string;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function previewGreenhouseJobs(params: ExternalJobImportRequest): Promise<ExternalJobPreview[]> {
  const query = new URLSearchParams();
  query.set("boardToken", params.board_token);
  if (params.default_country) query.set("defaultCountry", params.default_country);
  if (params.default_job_family) query.set("defaultJobFamily", params.default_job_family);
  if (params.limit) query.set("limit", String(params.limit));

  const response = await fetch(`${baseUrl}/api/jobs/external/greenhouse/preview?${query.toString()}`, {
    headers: adminHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Greenhouse preview request failed."));
  }

  return response.json();
}

export async function importGreenhouseJobs(request: ExternalJobImportRequest): Promise<ExternalJobImportResponse> {
  const response = await fetch(`${baseUrl}/api/jobs/external/greenhouse/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Greenhouse import request failed."));
  }

  return response.json();
}

export async function fetchGreenhouseSyncStatus(): Promise<ExternalJobSyncStatus> {
  const response = await fetch(`${baseUrl}/api/jobs/external/greenhouse/sync/status`, {
    headers: adminHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Greenhouse sync status request failed."));
  }

  return response.json();
}

export async function runGreenhouseSync(): Promise<ExternalJobSyncStatus> {
  const response = await fetch(`${baseUrl}/api/jobs/external/greenhouse/sync/run`, {
    method: "POST",
    headers: adminHeaders()
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Greenhouse sync request failed."));
  }

  return response.json();
}

function adminHeaders() {
  return authHeaders();
}

async function readApiError(response: Response, fallback: string) {
  const text = await response.text();
  if (response.status === 404) {
    return "Greenhouse 공개 Job Board API에서 해당 board token을 찾을 수 없습니다. 회사 채용 페이지가 Greenhouse여도 공개 API를 닫았거나 새 job-boards 도메인만 쓰는 경우가 있습니다.";
  }
  if (!text) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(text) as { message?: string; error?: string };
    return parsed.message || parsed.error || fallback;
  } catch {
    return text;
  }
}
