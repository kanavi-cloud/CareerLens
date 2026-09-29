import { workTypeLabel } from "@/lib/display-labels";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { countryLabel, deadlineLabel } from "./job-format";

export type JobFilterState = {
  country: string;
  workType: string;
  experienceLevel: string;
  jobFamily: string;
  deadlineStatus: string;
  query: string;
};

export function JobFilterBar({
  filters,
  countries,
  workTypes,
  jobFamilies,
  onChange,
  onReset,
}: {
  filters: JobFilterState;
  countries: string[];
  workTypes: string[];
  jobFamilies: string[];
  onChange: (filters: JobFilterState) => void;
  onReset: () => void;
}) {
  const activeFilterCount = [
    filters.country !== "ALL",
    filters.workType !== "ALL",
    filters.experienceLevel !== "ALL",
    filters.jobFamily !== "ALL",
    filters.deadlineStatus !== "ALL",
    Boolean(filters.query),
  ].filter(Boolean).length;

  return (
    <View className="w-full flex-col gap-3">
      <View className="w-full flex-row items-center rounded-full border border-line bg-white px-4">
        <Text className="mr-2 text-base text-brand">⌕</Text>
        <TextInput
          className="min-h-12 flex-1 py-3 text-sm font-bold text-night"
          placeholder="회사, 직무, 스킬 검색"
          placeholderTextColor="#94a3b8"
          value={filters.query}
          onChangeText={(query) => onChange({ ...filters, query })}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {filters.query ? (
          <Pressable
            accessibilityLabel="검색어 지우기"
            className="h-7 w-7 items-center justify-center rounded-full bg-slate-500"
            onPress={() => onChange({ ...filters, query: "" })}
          >
            <Text className="text-xs font-black text-white">×</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        <SelectPill
          label={`근무 국가${filters.country !== "ALL" ? " ✓" : ""}`}
          value={filters.country}
          onChange={(value) => onChange({ ...filters, country: value })}
          onClear={() => onChange({ ...filters, country: "ALL" })}
          active={filters.country !== "ALL"}
          options={[
            { label: "전체 국가", value: "ALL" },
            ...countries.map((country) => ({
              label: countryLabel(country),
              value: country,
            })),
          ]}
        />

        <SelectPill
          label={`근무 형태${filters.workType !== "ALL" ? " ✓" : ""}`}
          value={filters.workType}
          onChange={(value) => onChange({ ...filters, workType: value })}
          onClear={() => onChange({ ...filters, workType: "ALL" })}
          active={filters.workType !== "ALL"}
          options={[
            { label: "전체 근무 형태", value: "ALL" },
            ...workTypes.map((workType) => ({
              label: workTypeLabel(workType),
              value: workType,
            })),
          ]}
        />

        <SelectPill
          label={`경력${filters.experienceLevel !== "ALL" ? " ✓" : ""}`}
          value={filters.experienceLevel}
          onChange={(value) =>
            onChange({ ...filters, experienceLevel: value })
          }
          onClear={() => onChange({ ...filters, experienceLevel: "ALL" })}
          active={filters.experienceLevel !== "ALL"}
          options={[
            { label: "전체 경력", value: "ALL" },
            { label: "신입/주니어 (0-2년)", value: "JUNIOR" },
            { label: "미드레벨 (3-5년)", value: "MID" },
            { label: "시니어 (6년 이상)", value: "SENIOR" },
          ]}
        />

        <SelectPill
          label={`직무${filters.jobFamily !== "ALL" ? " ✓" : ""}`}
          value={filters.jobFamily}
          onChange={(value) => onChange({ ...filters, jobFamily: value })}
          onClear={() => onChange({ ...filters, jobFamily: "ALL" })}
          active={filters.jobFamily !== "ALL"}
          options={[
            { label: "전체 직무 분야", value: "ALL" },
            ...jobFamilies.map((family) => ({
              label: family,
              value: family,
            })),
          ]}
        />

        <SelectPill
          label={`마감${filters.deadlineStatus !== "ALL" ? " ✓" : ""}`}
          value={filters.deadlineStatus}
          onChange={(value) =>
            onChange({ ...filters, deadlineStatus: value })
          }
          onClear={() => onChange({ ...filters, deadlineStatus: "ALL" })}
          active={filters.deadlineStatus !== "ALL"}
          options={[
            { label: "전체 마감 상태", value: "ALL" },
            { label: deadlineLabel.OPEN, value: "OPEN" },
            { label: deadlineLabel.CLOSING_SOON, value: "CLOSING_SOON" },
            { label: deadlineLabel.URGENT, value: "URGENT" },
            { label: deadlineLabel.ROLLING, value: "ROLLING" },
            { label: deadlineLabel.CLOSED, value: "CLOSED" },
          ]}
        />
      </ScrollView>

      <View className="flex-row flex-wrap items-center gap-3 px-1">
        <Text className="text-sm font-bold text-slate-500">
          적용 필터 {activeFilterCount}개
        </Text>
        <Pressable onPress={onReset}>
          <Text className="text-sm font-black text-brand">필터 초기화</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SelectPill({
  label,
  value,
  options,
  active,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  active: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <View
        className={`h-11 flex-row items-center gap-2 rounded-full border px-4 ${
          active ? "border-brand/30 bg-[#e8f2f1]" : "border-line bg-white"
        }`}
      >
        <Pressable
          onPress={() => setOpen(true)}
          className="flex-row items-center gap-2"
        >
          <Text
            className={`text-sm font-black ${
              active ? "text-brand" : "text-night"
            }`}
          >
            {selected && value !== "ALL" ? selected.label : label}
          </Text>
          <Text className="text-base text-slate-400">⌄</Text>
        </Pressable>
        {active ? (
          <Pressable
            accessibilityLabel={`${label} 필터 해제`}
            hitSlop={8}
            onPress={onClear}
            className="ml-1 h-6 w-6 items-center justify-center rounded-full bg-white"
          >
            <Text className="text-sm font-black text-slate-500">×</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            className="absolute inset-0"
            onPress={() => setOpen(false)}
          />
          <View className="max-h-[70%] rounded-t-3xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-3 text-base font-black text-night">{label}</Text>
            <ScrollView>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    className={`mb-2 rounded-xl border px-4 py-3 ${
                      isSelected
                        ? "border-brand bg-[#e8f2f1]"
                        : "border-line bg-white"
                    }`}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        isSelected ? "text-brand" : "text-night"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
