import { View, Text, Pressable } from 'react-native';
import type { ReactNode } from "react";

export function TimelineCard({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <View>
      <View className="absolute left-[-9px] top-6 h-4 w-4 border border-night bg-paper" />
      <Text className="text-xs font-bold tracking-[0.16em] text-brand">{label}</Text>
      <Text className="mt-1 text-lg font-semibold text-night">{title}</Text>
      <View className="mt-4">{children}</View>
    </View>
  );
}
