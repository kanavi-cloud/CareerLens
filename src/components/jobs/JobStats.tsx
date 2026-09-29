import { View, Text, Pressable } from 'react-native';
import type { JobPosting } from "@/lib/jobs";

export function JobStats({ jobs, filteredCount }: { jobs: JobPosting[]; filteredCount: number }) {
  return (
    <View className="mt-6 flex-row gap-3 border-t border-slate-100 pt-5 sm:flex-cols-2 lg:flex-cols-4">
      <Stat label="전체 공고" value={`${jobs.length}개`} />
      <Stat label="현재 표시" value={`${filteredCount}개`} />
      <Stat label="마감 임박" value={`${jobs.filter((job) => job.deadline_status === "URGENT").length}개`} />
      <Stat label="로드맵 생성" value="공고별 가능" />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-center">
      <Text className="text-xs font-semibold text-slate-400">{label}</Text>
      <Text className="mt-1 text-xl font-extrabold text-night">{value}</Text>
    </View>
  );
}
