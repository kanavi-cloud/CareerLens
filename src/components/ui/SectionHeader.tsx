import { View, Text, Pressable } from 'react-native';
import type { ReactNode } from "react";

export function SectionHeader({
  kicker,
  title,
  description,
  actions
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <View className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <View>
        {kicker && <Text className="text-xs font-bold tracking-[0.16em] text-brand">{kicker}</Text>}
        <Text className="mt-1 text-xl font-semibold text-night">{title}</Text>
        {description && <Text className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</Text>}
      </View>
      {actions && <View className="flex-row flex-wrap gap-2">{actions}</View>}
    </View>
  );
}
