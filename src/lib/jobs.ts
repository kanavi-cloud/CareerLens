export type DeadlineStatus = "ROLLING" | "CLOSED" | "URGENT" | "CLOSING_SOON" | "OPEN";

export type JobPosting = {
  job_id: number;
  external_ref: string;
  company_name: string;
  country: string;
  job_title: string;
  job_family: string;
  required_skills: string[];
  preferred_skills: string[];
  required_languages: string[];
  min_experience_years: number | null;
  degree_requirement: string;
  portfolio_required: boolean;
  visa_requirement: string;
  salary_range: string;
  work_type: string;
  application_deadline: string | null;
  deadline_status: DeadlineStatus;
  days_until_deadline: number | null;
  salary_score: number | null;
  work_life_balance_score: number | null;
  company_value_score: number | null;
  evaluation_rationale: string;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function fetchJobs(): Promise<JobPosting[]> {
  const response = await fetch(`${baseUrl}/api/jobs`, {
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Job posting list request failed.");
  }

  return response.json();
}
