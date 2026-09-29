import { View, Text, Pressable } from 'react-native';
import type { ReactNode } from "react";

export function PageHeader({
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
    <View>
      <View className="lens-container flex flex-col gap-5 py-6 md:flex-row md:items-end md:justify-between">
        <View>
          {kicker && <Text className="lens-kicker">{kicker}</Text>}
          <Text className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-night md:text-4xl">{title}</Text>
          {description && <Text className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</Text>}
        </View>
        {actions && <View className="flex-row flex-wrap gap-2">{actions}</View>}
      </View>
    </View>
  );
}
