import { Badge, Card, ScoreBar } from "@/components/ui";
import { workTypeLabel } from "@/lib/display-labels";
import type { JobPosting } from "@/lib/jobs";
import { Pressable, Text, View } from "react-native";
import {
  countryLabel,
  daysText,
  deadlineText,
  deadlineTone,
  formatDate,
} from "./job-format";

export function JobCard({
  job,
  selected,
  onSelect,
}: {
  job: JobPosting;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable className="w-full" onPress={onSelect}>
      <Card
        className={`flex flex-col rounded-xl p-4 transition ${
          selected
            ? "border-brand bg-[#f2faf8] shadow-panel ring-2 ring-brand/10"
            : "border-slate-200"
        }`}
      >
        <View className="flex-row items-start gap-3">
          <View className="size-12 shrink-0 items-center justify-center rounded-lg bg-night">
            <Text className="text-base font-black text-white">
              {companyInitial(job.company_name)}
            </Text>
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text
                  className="text-sm font-bold text-slate-600"
                  numberOfLines={1}
                >
                  {job.company_name}
                </Text>
                <Text
                  className="mt-1 text-base font-extrabold leading-6 text-night"
                  numberOfLines={2}
                >
                  {job.job_title}
                </Text>
              </View>
              <Text className="shrink-0 text-lg leading-none text-slate-400">
                {selected ? "●" : "○"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Badge tone="muted">{job.job_family}</Badge>
          <Badge tone={deadlineTone(job.deadline_status)}>
            {deadlineText(job)}
          </Badge>
          <Badge tone="brand">{workTypeLabel(job.work_type)}</Badge>
        </View>

        <View className="mt-4 flex-col gap-1.5 text-sm font-semibold text-slate-600">
          <Text
            className="text-sm font-semibold text-slate-600"
            numberOfLines={1}
          >
            {countryLabel(job.country)}
          </Text>
          <Text
            className="text-sm font-semibold text-slate-600"
            numberOfLines={1}
          >
            최소 {job.min_experience_years ?? 0}년 ·{" "}
            {job.salary_range || "연봉 미기재"}
          </Text>
        </View>

        <View className="mt-4 rounded-lg bg-white/75 p-3">
          <View className="flex-row justify-between gap-2">
            <View className="flex-1">
              <CompactScore label="연봉" value={job.salary_score} />
            </View>
            <View className="flex-1">
              <CompactScore
                label="워라밸"
                value={job.work_life_balance_score}
                tone="success"
              />
            </View>
            <View className="flex-1">
              <CompactScore
                label="기업"
                value={job.company_value_score}
                tone="brand"
              />
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row items-center justify-between gap-3 border-t border-slate-200/70 pt-4">
          <Text className="text-xs font-bold text-slate-500">
            {daysText(job)}
          </Text>
          <Text className="text-xs font-bold text-night">
            {formatDate(job.application_deadline)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

function companyInitial(companyName: string) {
  return companyName.trim().slice(0, 1).toUpperCase() || "C";
}

function CompactScore({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: number | null;
  tone?: "brand" | "success";
}) {
  if (value === null || value === undefined) {
    return (
      <View>
        <Text className="text-[10px] font-bold text-slate-400">{label}</Text>
        <Text className="mt-1 text-xs font-bold text-slate-500">검수</Text>
        <View className="mt-2 h-1.5 rounded-full bg-slate-200" />
      </View>
    );
  }
  return <ScoreBar label={label} value={value} tone={tone} />;
}
