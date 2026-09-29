import { apiFetch, authHeaders, getStoredUser, readApiError } from "@/lib/auth";

export type ReadinessStatus = "IMMEDIATE_APPLY" | "PREPARE_THEN_APPLY" | "LONG_TERM_PREPARE";

export type UserProfileRequest = {
  user_id?: number;
  display_name: string;
  email: string;
  target_country: string;
  target_city?: string;
  target_job_family: string;
  desired_job_title?: string;
  current_country?: string;
  nationality?: string;
  experience_years: number;
  related_experience_years?: number;
  language_level: string;
  english_level?: string;
  japanese_level?: string;
  education: string;
  major?: string;
  graduation_status?: string;
  preferred_work_type?: string;
  expected_salary_range?: string;
  available_start_date?: string;
  visa_sponsorship_needed?: boolean;
  tech_stack: string[];
  certifications: string[];
  github_present: boolean;
  portfolio_present: boolean;
  github_url?: string;
  portfolio_url?: string;
  prioritize_salary?: boolean;
  prioritize_acceptance_probability?: boolean;
  prioritize_work_life_balance?: boolean;
  prioritize_company_value?: boolean;
  prioritize_job_fit?: boolean;
  project_experience_summary?: string;
  domain_experience?: string;
  cloud_experience?: string;
  database_experience?: string;
  deployment_experience?: string;
  language_test_scores?: string;
  preferences: string[];
};

export type UserProfileSummary = UserProfileRequest & {
  user_id: number;
};

export type ScoreBreakdown = {
  total_score: number;
  skill_score: number;
  experience_score: number;
  language_score: number;
  education_score: number;
  portfolio_score: number;
};

export type JobRecommendation = {
  diagnosis_id: number;
  job_id: number;
  company_name: string;
  country: string;
  job_title: string;
  job_family: string;
  salary_range: string;
  work_type: string;
  visa_requirement: string;
  pattern_ref: string;
  pattern_title: string;
  pattern_evidence_summary: string;
  recommendation_grade: string;
  primary_recommendation_category: string;
  readiness_status: ReadinessStatus;
  readiness_label: string;
  recommendation_summary: string;
  next_action_summary: string;
  missing_items: string[];
  score_breakdown: ScoreBreakdown;
  acceptance_probability_score: number;
  salary_score: number;
  work_life_balance_score: number;
  company_value_score: number;
  job_fit_score: number;
  probability_weight: number;
  salary_weight: number;
  work_life_balance_weight: number;
  company_value_weight: number;
  job_fit_weight: number;
  evaluation_rationale: string;
};

export type RecommendationResponse = {
  user_id: number;
  profile: UserProfileSummary;
  criteria_summary: string;
  total_candidate_count: number;
  returned_recommendation_count: number;
  overall_readiness_status: ReadinessStatus;
  overall_readiness_label: string;
  recommendations: JobRecommendation[];
  diagnosed_at: string;
};

export const demoProfile: UserProfileRequest = {
  display_name: "CareerLens Demo User",
  email: "demo@careerlens.local",
  target_country: "United States",
  target_city: "Seattle",
  target_job_family: "Backend",
  desired_job_title: "Backend Software Engineer",
  current_country: "South Korea",
  nationality: "South Korea",
  experience_years: 3,
  related_experience_years: 2,
  language_level: "BUSINESS",
  english_level: "BUSINESS",
  japanese_level: "BASIC",
  education: "Bachelor in Computer Science",
  major: "Computer Science",
  graduation_status: "Graduated",
  preferred_work_type: "Hybrid",
  expected_salary_range: "USD 100k-130k",
  available_start_date: "Within 3 months",
  visa_sponsorship_needed: true,
  tech_stack: ["Java", "Spring Boot", "MySQL", "REST API", "Docker"],
  certifications: ["AWS Cloud Practitioner"],
  github_present: true,
  portfolio_present: true,
  github_url: "https://github.com/careerlens-demo",
  portfolio_url: "https://portfolio.example.com",
  prioritize_salary: false,
  prioritize_acceptance_probability: true,
  prioritize_work_life_balance: false,
  prioritize_company_value: false,
  prioritize_job_fit: true,
  project_experience_summary: "Built REST APIs, database-backed services, and deployment-ready backend projects.",
  domain_experience: "Cloud backend and career platform prototype",
  cloud_experience: "AWS EC2, RDS, S3 basics",
  database_experience: "MySQL schema design and query optimization",
  deployment_experience: "Docker-based local deployment and CI/CD basics",
  language_test_scores: "TOEIC 860",
  preferences: ["Hybrid", "Visa support", "Cloud backend"]
};

export async function diagnoseRecommendations(profile: UserProfileRequest): Promise<RecommendationResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const storedUser = getStoredUser();
  const requestProfile = profile.user_id || !storedUser
    ? profile
    : {
        ...profile,
        user_id: storedUser.user_id,
        display_name: profile.display_name || storedUser.display_name,
        email: profile.email || storedUser.email
      };
  const response = await apiFetch(`${baseUrl}/api/recommendations/diagnose`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify({ user_profile: requestProfile }),
    cache: "no-store"
  }, "적합도 진단");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Recommendation diagnosis request failed."));
  }

  return response.json();
}

export async function diagnoseStoredProfile(userId: number): Promise<RecommendationResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const response = await apiFetch(`${baseUrl}/api/recommendations/diagnose/users/${userId}`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store"
  }, "저장 프로필 적합도 진단");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Stored profile diagnosis request failed."));
  }

  return response.json();
}

export async function diagnoseStoredProfileForJob(userId: number, jobId: number): Promise<RecommendationResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const response = await apiFetch(`${baseUrl}/api/recommendations/diagnose/users/${userId}/jobs/${jobId}`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store"
  }, "선택 공고 적합도 진단");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Selected job diagnosis request failed."));
  }

  return response.json();
}

export async function fetchUserProfile(userId: number): Promise<UserProfileSummary> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const response = await apiFetch(`${baseUrl}/api/users/${userId}/profile`, {
    headers: authHeaders(),
    cache: "no-store"
  }, "프로필 조회");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Profile request failed."));
  }

  return response.json();
}

export async function saveUserProfile(userId: number, profile: UserProfileRequest): Promise<UserProfileSummary> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const response = await apiFetch(`${baseUrl}/api/users/${userId}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify(profile),
    cache: "no-store"
  }, "프로필 저장");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Profile save request failed."));
  }

  return response.json();
}
