import { View, Text, Pressable } from 'react-native';
import { StatusPill } from "./Badge";
import { Card } from "./Card";
import { checklistTone } from "./style-helpers";

export function ChecklistCard({ title, items }: { title: string; items: Array<{ label: string; status: string }> }) {
  return (
    <Card className="p-5">
      <Text className="text-lg font-semibold text-night">{title}</Text>
      <View className="mt-4 space-y-3">
        {items.map((item) => (
          <View key={item.label} className="flex-row items-center justify-between gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0">
            <Text className="text-sm text-slate-700">{item.label}</Text>
            <StatusPill tone={checklistTone(item.status)}>{item.status}</StatusPill>
          </View>
        ))}
      </View>
    </Card>
  );
}
