import { View, Text, Pressable } from 'react-native';
import { barClass } from "./style-helpers";
import type { Tone } from "./types";

export function ScoreBar({ label, value, weight, tone = "brand" }: { label: string; value: number; weight?: number; tone?: Tone }) {
  return (
    <View>
      <View className="flex-row items-center justify-between gap-3 text-sm">
        <Text className="font-medium text-slate-700">{label}</Text>
        <Text className="font-semibold text-night">{value}{weight !== undefined ? ` · ${weight}%` : ""}</Text>
      </View>
      <View className="mt-2 h-2 border border-line bg-white">
        <View className={`h-full ${barClass(tone)}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </View>
    </View>
  );
}
