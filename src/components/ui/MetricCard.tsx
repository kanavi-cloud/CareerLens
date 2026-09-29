import { View, Text, Pressable } from 'react-native';
import type { ReactNode } from "react";

export function MetricCard({ label, value, helper }: { label: string; value: ReactNode; helper?: string }) {
  return (
    <View className="rounded-xl border border-line bg-panel p-3">
      <Text className="text-xs font-semibold text-slate-500">{label}</Text>
      <View className="mt-1 text-lg font-semibold text-night">{value}</View>
      {helper && <Text className="mt-1 text-xs text-slate-500">{helper}</Text>}
    </View>
  );
}
