"use client";

import { JobCard } from "@/components/jobs/JobCard";
import { JobDetailPanel } from "@/components/jobs/JobDetailPanel";
import {
  JobFilterBar,
  type JobFilterState,
} from "@/components/jobs/JobFilterBar";
import { SiteHeader } from "@/components/site-header";
import { Button, Card, EmptyState, LinkButton, PageShell } from "@/components/ui";
import { loadStoredUserAsync } from "@/lib/auth";
import { fetchJobs, type JobPosting } from "@/lib/jobs";
import { isMembershipLimitMessage } from "@/lib/membership";
import { createPlannerRoadmap } from "@/lib/planner";
import { diagnoseStoredProfileForJob } from "@/lib/recommendation";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

const JOBS_PER_PAGE = 8;

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filters, setFilters] = useState<JobFilterState>({
    country: "ALL",
    workType: "ALL",
    experienceLevel: "ALL",
    jobFamily: "ALL",
    deadlineStatus: "ALL",
    query: "",
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [creatingJobId, setCreatingJobId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  useEffect(() => {
    fetchJobs()
      .then(setJobs)
      .catch((error: Error) => setErrorMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.country,
    filters.workType,
    filters.experienceLevel,
    filters.jobFamily,
    filters.deadlineStatus,
    filters.query,
  ]);

  const countries = useMemo(
    () => uniqueValues(jobs.map((job) => job.country)),
    [jobs]
  );
  const workTypes = useMemo(
    () => uniqueValues(jobs.map((job) => job.work_type)),
    [jobs]
  );
  const jobFamilies = useMemo(
    () => uniqueValues(jobs.map((job) => job.job_family)),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesCountry =
        filters.country === "ALL" || job.country === filters.country;
      const matchesWorkType =
        filters.workType === "ALL" || job.work_type === filters.workType;
      const matchesExperience = matchesExperienceLevel(
        job.min_experience_years,
        filters.experienceLevel
      );
      const matchesFamily =
        filters.jobFamily === "ALL" || job.job_family === filters.jobFamily;
      const matchesDeadline =
        filters.deadlineStatus === "ALL" ||
        job.deadline_status === filters.deadlineStatus;
      const matchesQuery =
        !query ||
        `${job.company_name} ${job.job_title} ${job.required_skills.join(
          " "
        )} ${job.preferred_skills.join(" ")}`
          .toLowerCase()
          .includes(query);
      return (
        matchesCountry &&
        matchesWorkType &&
        matchesExperience &&
        matchesFamily &&
        matchesDeadline &&
        matchesQuery
      );
    });
  }, [filters, jobs]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * JOBS_PER_PAGE;
  const visibleJobs = filteredJobs.slice(
    pageStartIndex,
    pageStartIndex + JOBS_PER_PAGE
  );
  const selectedJob = selectedJobId
    ? filteredJobs.find((job) => job.job_id === selectedJobId) ?? null
    : null;

  useEffect(() => {
    if (loading) return;
    if (visibleJobs.length === 0) {
      setSelectedJobId(null);
      return;
    }
    if (
      !selectedJobId ||
      !visibleJobs.some((job) => job.job_id === selectedJobId)
    ) {
      setSelectedJobId(visibleJobs[0].job_id);
    }
  }, [loading, selectedJobId, visibleJobs]);

  function resetFilters() {
    setFilters({
      country: "ALL",
      workType: "ALL",
      experienceLevel: "ALL",
      jobFamily: "ALL",
      deadlineStatus: "ALL",
      query: "",
    });
  }

  async function handleCreateRoadmap(job: JobPosting) {
    const user = await loadStoredUserAsync();
    if (!user) {
      router.push("/login");
      return;
    }

    setCreatingJobId(job.job_id);
    setErrorMessage("");
    try {
      const diagnosis = await diagnoseStoredProfileForJob(
        user.user_id,
        job.job_id
      );
      const recommendation = diagnosis.recommendations[0];
      if (!recommendation?.diagnosis_id) {
        throw new Error("선택한 공고에 대한 진단 결과를 만들지 못했습니다.");
      }
      const roadmap = await createPlannerRoadmap(recommendation.diagnosis_id);
      router.push(`/planner/${roadmap.roadmap_id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "로드맵 생성 중 오류가 발생했습니다."
      );
    } finally {
      setCreatingJobId(null);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <View className="w-full flex-col gap-3 px-4 py-3">
        <View className="flex-col gap-2">
          <Text className="text-xs font-bold tracking-wider text-brand">
            JOB POSTINGS
          </Text>
          <Text className="text-2xl font-black leading-tight text-night">
            전체 공고 조회
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          <LinkButton href="/jobs/recommendation" variant="secondary">
            맞춤추천 진단
          </LinkButton>
          <LinkButton href="/onboarding/profile">프로필 보강</LinkButton>
        </View>
      </View>

      <View className="w-full flex-1 flex-col px-4 pb-4">
        <View>
          <JobFilterBar
            filters={filters}
            countries={countries}
            workTypes={workTypes}
            jobFamilies={jobFamilies}
            onChange={setFilters}
            onReset={resetFilters}
          />
        </View>

        {errorMessage && (
          <View
            role="alert"
            className="mt-3 shrink-0 rounded-2xl border border-coral/30 bg-red-50 px-4 py-3 text-sm font-medium text-coral"
          >
            <View className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Text>{errorMessage}</Text>
              {isMembershipLimitMessage(errorMessage) && (
                <LinkButton href="/membership">Pro 멤버십 보기</LinkButton>
              )}
            </View>
          </View>
        )}

        {loading ? (
          <Card className="mt-4 p-8">
            <Text className="text-center text-sm text-slate-600">
              공고 데이터를 불러오는 중입니다.
            </Text>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <View className="mt-4">
            <EmptyState
              title="조건에 맞는 공고가 없습니다"
              description="국가, 직무군, 검색어를 조정하거나 맞춤추천 진단에서 프로필 조건을 다시 확인하세요."
            />
          </View>
        ) : (
          <>
            <View className="mt-4 w-full flex-col gap-4">
              <View className="mb-1 flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Text className="text-sm font-black text-night">
                  {filteredJobs.length.toLocaleString()}개 공고 중{" "}
                  {pageStartIndex + 1}-
                  {Math.min(
                    pageStartIndex + visibleJobs.length,
                    filteredJobs.length
                  )}
                  개
                </Text>
                <Text className="text-xs font-bold text-slate-500">
                  공고를 누르면 아래에서 상세 정보를 확인할 수 있습니다.
                </Text>
              </View>

              <View className="w-full flex-col gap-3">
                {visibleJobs.map((job) => (
                  <JobCard
                    key={job.job_id}
                    job={job}
                    selected={selectedJobId === job.job_id}
                    onSelect={() => setSelectedJobId(job.job_id)}
                  />
                ))}
              </View>

              <JobsPagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalCount={filteredJobs.length}
                start={pageStartIndex + 1}
                end={Math.min(
                  pageStartIndex + visibleJobs.length,
                  filteredJobs.length
                )}
                onChange={setCurrentPage}
              />

              <View className="mt-2 w-full">
                <JobDetailPanel
                  job={selectedJob}
                  creating={
                    selectedJob ? creatingJobId === selectedJob.job_id : false
                  }
                  onCreateRoadmap={() => {
                    if (selectedJob) {
                      handleCreateRoadmap(selectedJob);
                    }
                  }}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </PageShell>
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function matchesExperienceLevel(years: number | null, level: string) {
  const value = years ?? 0;
  if (level === "JUNIOR") return value <= 2;
  if (level === "MID") return value >= 3 && value <= 5;
  if (level === "SENIOR") return value >= 6;
  return true;
}

function JobsPagination({
  currentPage,
  totalPages,
  totalCount,
  start,
  end,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  start: number;
  end: number;
  onChange: (page: number) => void;
}) {
  return (
    <View className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <Text className="text-sm font-medium text-slate-600">
        {totalCount}개 중{" "}
        <Text className="text-night">
          {start}-{end}
        </Text>
        개 표시
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <Button
          
          variant="secondary"
          disabled={currentPage <= 1}
          onPress={() => onChange(currentPage - 1)}
        >
          이전
        </Button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => (
            <Button
              key={page}
              
              variant={page === currentPage ? "primary" : "secondary"}
              className="min-w-10 px-3"
              onPress={() => onChange(page)}
            >
              {page}
            </Button>
          )
        )}
        <Button
          
          variant="secondary"
          disabled={currentPage >= totalPages}
          onPress={() => onChange(currentPage + 1)}
        >
          다음
        </Button>
      </View>
    </View>
  );
}
