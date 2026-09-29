import { View, Text, Pressable } from 'react-native';
import type { ReactNode } from "react";
import { Card } from "./Card";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <Card className="p-8 text-center">
      <Text className="text-base font-semibold text-night">{title}</Text>
      {description && <Text className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</Text>}
      {action && <View className="mt-5 flex-row justify-center">{action}</View>}
    </Card>
  );
}
