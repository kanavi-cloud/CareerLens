import { View, Text, Pressable } from 'react-native';
import { Card } from "./Card";

export function StepCard({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <Card className="p-5">
      <Text className="text-xs font-bold text-brand">0{index}</Text>
      <Text className="mt-3 text-base font-semibold text-night">{title}</Text>
      <Text className="mt-2 text-sm leading-6 text-slate-600">{description}</Text>
    </Card>
  );
}
